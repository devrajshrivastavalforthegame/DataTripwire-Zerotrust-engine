import { query } from "../config/database.js";

export async function listResources(req, res) {
    try {
        const limit = Math.min(
            Math.max(Number.parseInt(req.query.limit ?? "50", 10) || 50, 1),
            100
        );

        const result = await query(`
            SELECT
                r.id,
                r.name,
                r.resource_type,
                r.sensitivity,
                r.owner_user_id,
                u.username AS owner_username,
                r.description,
                r.active,
                r.created_at,
                r.updated_at
            FROM resources r
            LEFT JOIN users u ON u.id = r.owner_user_id
            ORDER BY
                CASE r.sensitivity
                    WHEN 'RESTRICTED' THEN 1
                    WHEN 'CONFIDENTIAL' THEN 2
                    WHEN 'INTERNAL' THEN 3
                    WHEN 'PUBLIC' THEN 4
                    ELSE 5
                END,
                r.name
            LIMIT $1
        `, [limit]);

        const summary = await query(`
            SELECT
                COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE active)::int AS active,
                COUNT(*) FILTER (WHERE NOT active)::int AS inactive,
                COUNT(*) FILTER (WHERE sensitivity = 'RESTRICTED')::int AS restricted,
                COUNT(*) FILTER (WHERE sensitivity = 'CONFIDENTIAL')::int AS confidential
            FROM resources
        `);

        return res.json({
            count: result.rows.length,
            summary: summary.rows[0],
            resources: result.rows
        });
    } catch (error) {
        console.error("Resources query error:", error);
        return res.status(500).json({
            error: "Unable to load resources"
        });
    }
}
