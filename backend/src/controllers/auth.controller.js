import { login } from "../services/auth/auth.service.js";
import { endSession } from "../services/auth/session.repository.js";
import { findUserByEmail } from "../services/auth/user.repository.js";
import { verifyPassword } from "../services/auth/password.service.js";
import { query } from "../config/database.js";

export async function loginController(req, res) {
    try {
        const { email, password, portal, deviceFingerprint, location } = req.body || {};
        if (typeof email !== "string" || typeof password !== "string") {
            return res.status(400).json({ error: "email and password are required" });
        }
        if (!["employee", "admin"].includes(portal)) {
            return res.status(400).json({ error: "portal must be employee or admin", code: "PORTAL_REQUIRED" });
        }

        const result = await login({
            email: email.trim().toLowerCase(),
            password,
            portal,
            ipAddress: req.ip,
            userAgent: req.get("user-agent"),
            deviceFingerprint,
            location
        });
        res.json(result);
    } catch (error) {
        const status = error.message === "Invalid credentials" ? 401 : error.message === "User account is not active" || error.code === "PORTAL_MISMATCH" || error.code === "PORTAL_NOT_ALLOWED" ? 403 : 500;
        res.status(status).json({ error: error.message, ...(error.code ? { code: error.code } : {}) });
    }
}

export async function meController(req, res) {
    res.json({ user: req.auth.user, session: req.auth.session });
}

export async function logoutController(req, res) {
    await endSession(req.auth.session.id);
    res.json({ status: "ok" });
}


export async function stepUpController(req, res) {
    const password = req.body?.password;
    if (typeof password !== "string" || password.length === 0) {
        return res.status(400).json({ error: "password is required", code: "STEP_UP_PASSWORD_REQUIRED" });
    }

    try {
        const user = await findUserByEmail(String(req.auth.user.email).toLowerCase());
        const verified = user?.status === "active" &&
            await verifyPassword(password, user.password_hash);

        if (!verified) {
            await query(
                `INSERT INTO audit_logs (user_id, session_id, event_type, action, severity, details, ip_address)
                 VALUES ($1, $2, 'step_up', 'FAILED', 'medium', $3, $4)`,
                [req.auth.user.id, req.auth.session.id, JSON.stringify({ reason: "invalid_credentials" }), req.ip]
            );
            return res.status(401).json({ error: "Step-up verification failed", code: "STEP_UP_INVALID_CREDENTIALS" });
        }

        const updated = await query(
            `UPDATE sessions
             SET step_up_required = false,
                 step_up_verified_at = NOW(),
                 baseline_eligible = false,
                 last_activity_at = NOW()
             WHERE id = $1
               AND user_id = $2
               AND status = 'active'
               AND step_up_required = true
             RETURNING id, status, step_up_required, step_up_verified_at, baseline_eligible`,
            [req.auth.session.id, req.auth.user.id]
        );

        if (!updated.rows[0]) {
            return res.status(409).json({
                error: "No active step-up challenge is pending for this session",
                code: "STEP_UP_NOT_PENDING"
            });
        }

        await query(
            `INSERT INTO audit_logs (user_id, session_id, event_type, action, severity, details, ip_address)
             VALUES ($1, $2, 'step_up', 'VERIFIED', 'info', $3, $4)`,
            [req.auth.user.id, req.auth.session.id, JSON.stringify({ method: "password_reauthentication" }), req.ip]
        );

        return res.json({
            verified: true,
            session: updated.rows[0]
        });
    } catch (error) {
        console.error("Step-up verification error:", error);
        return res.status(500).json({ error: "Unable to verify step-up challenge" });
    }
}
