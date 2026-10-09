import { query } from "../config/database.js";

export async function listSessions(req,res) {
    const result = await query(`SELECT s.id,s.user_id,u.username,u.email,u.role,s.status,s.step_up_required,s.step_up_verified_at,s.baseline_eligible,s.ip_address,s.device_fingerprint,s.location,s.created_at,s.last_activity_at,
        COALESCE((SELECT rd.risk_score FROM risk_decisions rd WHERE rd.session_id=s.id ORDER BY rd.created_at DESC LIMIT 1),0) AS risk_score
        FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.status <> 'ended' ORDER BY s.last_activity_at DESC LIMIT 100`);
    res.json({sessions:result.rows});
}

export async function sessionTimeline(req,res) {
    const id = req.params.sessionId;
    const session = await query(`SELECT * FROM sessions WHERE id=$1`,[id]);
    if (!session.rows[0]) return res.status(404).json({error:"Session not found"});
    const [events,risks,audit] = await Promise.all([
        query(`SELECT * FROM behavior_events WHERE session_id=$1 ORDER BY created_at ASC`,[id]),
        query(`SELECT * FROM risk_decisions WHERE session_id=$1 ORDER BY created_at ASC`,[id]),
        query(`SELECT * FROM audit_logs WHERE session_id=$1 ORDER BY created_at ASC`,[id])
    ]);
    res.json({session:session.rows[0],events:events.rows,riskDecisions:risks.rows,audit: audit.rows});
}

export async function listAudit(req,res) {
    const result = await query(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200`);
    res.json({audit:result.rows});
}
