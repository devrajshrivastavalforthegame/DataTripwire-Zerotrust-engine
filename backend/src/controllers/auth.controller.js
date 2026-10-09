import { login } from "../services/auth/auth.service.js";
import { endSession } from "../services/auth/session.repository.js";

export async function loginController(req, res) {
    try {
        const { email, password, deviceFingerprint, location, portal } = req.body || {};
        if (typeof email !== "string" || typeof password !== "string") {
            return res.status(400).json({ error: "email and password are required" });
        }

        const result = await login({
            email: email.trim().toLowerCase(),
            password,
            ipAddress: req.ip,
            userAgent: req.get("user-agent"),
            deviceFingerprint,
            location,
            portal
        });
        res.json(result);
    } catch (error) {
        const statusCode = error.statusCode
            || (error.message === "Invalid credentials" ? 401 : 403);
        res.status(statusCode).json({ error: error.message });
    }
}

export async function meController(req, res) {
    res.json({ user: req.auth.user, session: req.auth.session });
}

export async function logoutController(req, res) {
    await endSession(req.auth.session.id);
    res.json({ status: "ok" });
}
