import { query } from "../config/database.js";

export async function listUsersRisk(req, res) {
    try {
        const limit = Math.min(
            Math.max(Number.parseInt(req.query.limit ?? "50", 10) || 50, 1),
            100
        );

        const result = await query(`
            SELECT
                u.id,
                u.username,
                u.email,
                u.role AS legacy_role,
                u.status,
                u.created_at,
                COALESCE(
                    (
                        SELECT jsonb_agg(
                            jsonb_build_object('id', r.id, 'name', r.name, 'slug', r.slug)
                            ORDER BY r.name
                        )
                        FROM user_roles ur
                        JOIN roles r ON r.id = ur.role_id
                        WHERE ur.user_id = u.id
                    ),
                    '[]'::jsonb
                ) AS roles,
                COALESCE(
                    (
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'name', resp.name,
                                'scope', ursp.scope
                            )
                            ORDER BY resp.name
                        )
                        FROM user_responsibilities ursp
                        JOIN responsibilities resp
                            ON resp.id = ursp.responsibility_id
                        WHERE ursp.user_id = u.id
                    ),
                    '[]'::jsonb
                ) AS responsibilities,
                (
                    SELECT COUNT(*)::int
                    FROM sessions s
                    WHERE s.user_id = u.id
                      AND s.status <> 'ended'
                ) AS active_sessions,
                latest.risk_score,
                latest.decision,
                latest.sts_score,
                latest.ats_score,
                latest.risk_factors,
                latest.evaluated_at
            FROM users u
            LEFT JOIN LATERAL (
                SELECT
                    rd.risk_score,
                    rd.decision,
                    rd.sts_score,
                    rd.ats_score,
                    rd.risk_factors,
                    rd.created_at AS evaluated_at
                FROM risk_decisions rd
                WHERE rd.user_id = u.id
                ORDER BY rd.created_at DESC
                LIMIT 1
            ) latest ON true
            ORDER BY
                COALESCE(latest.risk_score, 0) DESC,
                u.created_at DESC
            LIMIT $1
        `, [limit]);

        return res.json({
            count: result.rows.length,
            users: result.rows
        });
    } catch (error) {
        console.error("Users and risk query error:", error);
        return res.status(500).json({
            error: "Unable to load users and risk"
        });
    }
}
