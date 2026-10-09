import { query } from "../config/database.js";

export async function listActivity(req, res) {
    try {
        const limit = Math.min(Math.max(Number.parseInt(req.query.limit ?? "50", 10) || 50, 1), 100);

        const result = await query(`
            SELECT
                be.id,
                be.created_at,
                be.event_type,
                be.user_id,
                u.username,
                u.email,
                u.role,
                be.action,
                be.resource,
                be.responsibility,
                be.task,
                be.scope,
                be.device_fingerprint,
                be.location,
                be.metadata,
                be.sts_score,
                be.ats_score,
                be.is_decoy,
                rd.risk_score,
                rd.decision,
                rd.previous_score,
                rd.reasons,
                rd.risk_factors,
                rd.explanation
            FROM behavior_events be
            JOIN users u
                ON u.id = be.user_id
            LEFT JOIN LATERAL (
                SELECT
                    risk_score,
                    decision,
                    previous_score,
                    reasons,
                    risk_factors,
                    explanation
                FROM risk_decisions
                WHERE behavior_event_id = be.id
                ORDER BY created_at DESC
                LIMIT 1
            ) rd ON true
            ORDER BY be.created_at DESC
            LIMIT $1
        `, [limit]);

        return res.json({
            count: result.rows.length,
            activity: result.rows
        });
    } catch (error) {
        console.error("Live activity error:", error);
        return res.status(500).json({
            error: "Unable to load live activity"
        });
    }
}
