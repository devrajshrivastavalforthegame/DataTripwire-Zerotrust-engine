import pool, { query } from "../config/database.js";

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


export async function updateSecurityResource(req, res) {
    const { id } = req.params;
    const body = req.body ?? {};
    const allowedFields = ["sensitivity", "active", "description"];
    const suppliedFields = Object.keys(body);
    const unsupported = suppliedFields.filter((field) => !allowedFields.includes(field));

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
        return res.status(400).json({ error: "Invalid resource ID" });
    }
    if (!suppliedFields.length || unsupported.length) {
        return res.status(400).json({
            error: "Provide one or more supported fields: sensitivity, active, description",
            unsupportedFields: unsupported
        });
    }
    if (body.sensitivity !== undefined &&
        !["PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED", "CRITICAL"].includes(String(body.sensitivity).toUpperCase())) {
        return res.status(400).json({ error: "sensitivity must be PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED, or CRITICAL" });
    }
    if (body.active !== undefined && typeof body.active !== "boolean") {
        return res.status(400).json({ error: "active must be a boolean" });
    }
    if (body.description !== undefined &&
        (typeof body.description !== "string" || body.description.length > 1000)) {
        return res.status(400).json({ error: "description must be a string of at most 1000 characters" });
    }

    let client;
    try {
        client = await pool.connect();
        await client.query("BEGIN");
        const updated = await client.query(
            `UPDATE resources
             SET sensitivity = COALESCE($1, sensitivity),
                 active = COALESCE($2, active),
                 description = CASE WHEN $3::boolean THEN $4::text ELSE description END,
                 updated_at = NOW()
             WHERE id = $5
             RETURNING id, name, resource_type, sensitivity, owner_user_id, description, active, created_at, updated_at`,
            [
                body.sensitivity === undefined ? null : String(body.sensitivity).toUpperCase(),
                body.active === undefined ? null : body.active,
                body.description !== undefined,
                body.description ?? null,
                id
            ]
        );

        const resource = updated.rows[0];
        if (!resource) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Resource not found" });
        }

        await client.query(
            `INSERT INTO audit_logs
             (user_id, session_id, event_type, action, severity, details, ip_address)
             VALUES ($1, $2, 'resource_management', 'UPDATE', 'info', $3, $4)`,
            [
                req.auth.user.id,
                req.auth.session.id,
                JSON.stringify({ resourceId: id, resourceName: resource.name, changes: body }),
                req.ip
            ]
        );
        await client.query("COMMIT");
        return res.json({ updated: true, resource });
    } catch (error) {
        if (client) {
            try { await client.query("ROLLBACK"); } catch {}
        }
        console.error("Resource update error:", error);
        return res.status(500).json({ error: "Unable to update resource" });
    } finally {
        client?.release();
    }
}
