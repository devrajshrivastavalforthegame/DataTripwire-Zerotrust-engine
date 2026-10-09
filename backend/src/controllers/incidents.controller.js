import { query } from "../config/database.js";

export async function listIncidents(req, res) {
    try {
        const limit = Math.min(
            Math.max(Number.parseInt(req.query.limit ?? "50", 10) || 50, 1),
            100
        );

        const result = await query(`
            SELECT
                a.id,
                a.created_at,
                a.event_type,
                a.action,
                a.severity,
                a.details,
                a.ip_address,
                u.id AS user_id,
                u.username,
                u.email,
                a.session_id,
                COALESCE(
                    a.details->'risk'->>'score',
                    a.details->'risk'->'riskDecision'->>'risk_score'
                ) AS risk_score,
                COALESCE(
                    a.details->'risk'->>'decision',
                    a.action
                ) AS decision,
                a.details->'risk'->'factors' AS risk_factors,
                a.details->'ai' AS ai_assessment,
                a.details->'policy'->>'enforcement' AS enforcement
            FROM audit_logs a
            LEFT JOIN users u ON u.id = a.user_id
            WHERE
                a.severity IN ('high', 'critical')
                OR a.action IN ('RESTRICT', 'QUARANTINE', 'BLOCK')
                OR a.event_type = 'deception'
            ORDER BY
                CASE a.severity
                    WHEN 'critical' THEN 1
                    WHEN 'high' THEN 2
                    ELSE 3
                END,
                a.created_at DESC
            LIMIT $1
        `, [limit]);

        const summary = await query(`
            SELECT
                COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE severity = 'critical')::int AS critical,
                COUNT(*) FILTER (WHERE severity = 'high')::int AS high,
                COUNT(*) FILTER (
                    WHERE action IN ('RESTRICT', 'QUARANTINE', 'BLOCK')
                )::int AS enforcement_events
            FROM audit_logs
            WHERE
                severity IN ('high', 'critical')
                OR action IN ('RESTRICT', 'QUARANTINE', 'BLOCK')
                OR event_type = 'deception'
        `);

        return res.json({
            count: result.rows.length,
            summary: summary.rows[0],
            incidents: result.rows
        });
    } catch (error) {
        console.error("Incidents query error:", error);
        return res.status(500).json({
            error: "Unable to load incidents"
        });
    }
}


export async function resolveIncident(req,res){
  const id=req.params.id;
  const result=await query("UPDATE audit_logs SET details=jsonb_set(details,'{incidentStatus}',to_jsonb('RESOLVED'::text),true) WHERE id=$1 RETURNING id,details",[id]);
  if(!result.rows[0])return res.status(404).json({error:"Incident not found"});
  await query("INSERT INTO audit_logs(user_id,event_type,action,severity,details) VALUES($1,'incident_resolution','RESOLVE','info',$2)",[req.auth.user.id,JSON.stringify({incidentId:id,resolvedBy:req.auth.user.id})]);
  res.json({resolved:true,incident:result.rows[0]});
}
