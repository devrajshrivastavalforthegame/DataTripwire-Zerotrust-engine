import pool, { query } from "../config/database.js";

const POLICY_ACTIONS = {
    ALLOW: {
        requiredAction: "NONE",
        enforcement: "APPLICATION_CONTINUES"
    },
    MONITOR: {
        requiredAction: "INCREASE_MONITORING",
        enforcement: "APPLICATION_CONTINUES"
    },
    VERIFY: {
        requiredAction: "STEP_UP_AUTH",
        enforcement: "PROTECTED_ACTIONS_REQUIRE_VERIFICATION"
    },
    RESTRICT: {
        requiredAction: "LIMIT_CAPABILITIES",
        enforcement: "HIGH_RISK_ACTIONS_DENIED"
    },
    QUARANTINE: {
        requiredAction: "DENY_PROTECTED_ACTIONS",
        enforcement: "SESSION_QUARANTINED"
    }
};

export async function getPolicies(req, res) {
    return res.json({
        policyId: "default-zero-trust-v2",
        authority: "deterministic_backend_policy",
        aiCanOverridePolicy: false,
        actions: Object.entries(POLICY_ACTIONS).map(([decision, config]) => ({
            decision,
            ...config
        }))
    });
}

export async function getAdaptiveResponses(req, res) {
    const result = await query(`
        SELECT
            a.id,
            a.created_at,
            a.event_type,
            a.action,
            a.severity,
            a.user_id,
            u.username,
            a.session_id,
            a.details
        FROM audit_logs a
        LEFT JOIN users u ON u.id = a.user_id
        WHERE a.event_type IN ('behavior_risk', 'deception', 'manual_response')
           OR a.action IN ('ALLOW', 'MONITOR', 'VERIFY', 'RESTRICT', 'QUARANTINE', 'RELEASE')
        ORDER BY a.created_at DESC
        LIMIT 100
    `);

    return res.json({ count: result.rows.length, responses: result.rows });
}

export async function manageSessionResponse(req, res, forcedAction = null) {
    const { sessionId } = req.params;
    const reason = req.body?.reason;
    const action = forcedAction ?? req.body?.action;

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)) {
        return res.status(400).json({ error: "Invalid session ID" });
    }

    if (!["RESTRICT", "QUARANTINE", "RELEASE"].includes(action)) {
        return res.status(400).json({
            error: "action must be RESTRICT, QUARANTINE, or RELEASE"
        });
    }

    if (reason !== undefined &&
        (typeof reason !== "string" || reason.trim().length < 3 || reason.length > 500)) {
        return res.status(400).json({
            error: "reason must be a string between 3 and 500 characters"
        });
    }

    let client;

    try {
        client = await pool.connect();
        await client.query("BEGIN");

        // Serialize concurrent responses for the same session.
        const clientResult = await client.query(
            "SELECT id, user_id, status FROM sessions WHERE id = $1 FOR UPDATE",
            [sessionId]
        );

        const session = clientResult.rows[0];

        if (!session) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Session not found" });
        }

        // Separation of duties: an operator cannot change their own session state.
        if (String(session.user_id) === String(req.auth.user.id)) {
            await client.query("ROLLBACK");
            return res.status(403).json({
                error: "Operators cannot apply session responses to their own account",
                code: "SELF_SESSION_RESPONSE_FORBIDDEN"
            });
        }

        if (session.status === "ended") {
            await client.query("ROLLBACK");
            return res.status(409).json({ error: "Ended sessions cannot be modified" });
        }

        let update;

        if (action === "RESTRICT") {
            update = await client.query(`
                UPDATE sessions
                SET status = 'restricted',
                    baseline_eligible = false,
                    last_activity_at = NOW()
                WHERE id = $1 AND status <> 'ended'
                RETURNING id, user_id, status, step_up_required, baseline_eligible
            `, [sessionId]);
        } else if (action === "QUARANTINE") {
            update = await client.query(`
                UPDATE sessions
                SET status = 'quarantined',
                    baseline_eligible = false,
                    step_up_required = true,
                    last_activity_at = NOW()
                WHERE id = $1 AND status <> 'ended'
                RETURNING id, user_id, status, step_up_required, baseline_eligible
            `, [sessionId]);
        } else {
            update = await client.query(`
                UPDATE sessions
                SET status = 'active',
                    step_up_required = true,
                    step_up_verified_at = NULL,
                    baseline_eligible = false,
                    last_activity_at = NOW()
                WHERE id = $1 AND status IN ('restricted', 'quarantined')
                RETURNING id, user_id, status, step_up_required, baseline_eligible
            `, [sessionId]);

            if (!update.rows[0]) {
                await client.query("ROLLBACK");
                return res.status(409).json({
                    error: "Only restricted or quarantined sessions can be released"
                });
            }
        }

        const updatedSession = update.rows[0];

        await client.query(`
            INSERT INTO audit_logs
                (user_id, session_id, event_type, action, severity, details, ip_address)
            VALUES ($1, $2, 'manual_response', $3, $4, $5, $6)
        `, [
            req.auth.user.id,
            sessionId,
            action,
            action === "QUARANTINE" ? "critical" : "high",
            JSON.stringify({
                targetUserId: session.user_id,
                previousStatus: session.status,
                newStatus: updatedSession.status,
                reason: reason?.trim() || "No reason provided",
                performedBy: req.auth.user.id
            }),
            req.ip
        ]);

        // Neither the session change nor its audit entry commits alone.
        await client.query("COMMIT");

        return res.json({
            message: `Session ${action.toLowerCase()} applied`,
            session: updatedSession
        });
    } catch (error) {
        if (client) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error("Response transaction rollback failed:", rollbackError);
            }
        }

        console.error("Session response transaction failed:", error);
        return res.status(500).json({ error: "Unable to apply session response" });
    } finally {
        client?.release();
    }
}

export const restrictSession = (req, res) =>
    manageSessionResponse(req, res, "RESTRICT");

export const quarantineSession = (req, res) =>
    manageSessionResponse(req, res, "QUARANTINE");

export const releaseSession = (req, res) =>
    manageSessionResponse(req, res, "RELEASE");
