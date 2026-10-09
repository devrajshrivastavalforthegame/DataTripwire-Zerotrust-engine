import { query } from "../config/database.js";

export async function getOverview(req, res) {
    const [
        activeUsers,
        activeSessions,
        highRiskUsers,
        restrictedSessions,
        policyDecisions,
        openIncidents
    ] = await Promise.all([
        query(`
            SELECT COUNT(DISTINCT user_id)::int AS count
            FROM sessions
            WHERE status <> 'ended'
        `),

        query(`
            SELECT COUNT(*)::int AS count
            FROM sessions
            WHERE status = 'active'
        `),

        query(`
            SELECT COUNT(*)::int AS count
            FROM (
                SELECT DISTINCT ON (user_id)
                    user_id,
                    risk_score
                FROM risk_decisions
                ORDER BY user_id, created_at DESC
            ) latest
            WHERE latest.risk_score >= 70
        `),

        query(`
            SELECT COUNT(*)::int AS count
            FROM sessions
            WHERE status IN ('restricted', 'quarantined')
        `),

        query(`
            SELECT COUNT(*)::int AS count
            FROM risk_decisions
            WHERE created_at >= NOW() - INTERVAL '24 hours'
        `),

        query(`
            SELECT COUNT(*)::int AS count
            FROM audit_logs
            WHERE
                severity IN ('high', 'critical')
                OR action IN ('RESTRICT', 'QUARANTINE', 'BLOCK')
                OR event_type = 'deception'
        `)
    ]);

    const latestDecision = await query(`
        SELECT
            rd.decision,
            rd.risk_score,
            rd.sts_score,
            rd.ats_score,
            rd.created_at
        FROM risk_decisions rd
        ORDER BY rd.created_at DESC
        LIMIT 1
    `);

    const latest = latestDecision.rows[0] || null;

    let trustState = "TRUSTED";

    if (latest?.decision === "QUARANTINE") {
        trustState = "QUARANTINED";
    } else if (latest?.decision === "RESTRICT") {
        trustState = "RESTRICTED";
    } else if (latest?.decision === "VERIFY") {
        trustState = "VERIFY";
    } else if (latest?.decision === "MONITOR") {
        trustState = "MONITOR";
    }

    res.json({
        metrics: {
            activeUsers: activeUsers.rows[0].count,
            activeSessions: activeSessions.rows[0].count,
            highRiskUsers: highRiskUsers.rows[0].count,
            openIncidents: openIncidents.rows[0].count,
            restrictedSessions: restrictedSessions.rows[0].count,
            policyDecisions: policyDecisions.rows[0].count
        },
        continuousTrust: {
            state: trustState,
            latestDecision: latest?.decision || "ALLOW",
            riskScore: latest?.risk_score ?? 0,
            stsScore: latest?.sts_score ?? 100,
            atsScore: latest?.ats_score ?? 0,
            evaluatedAt: latest?.created_at ?? null
        },
        systemStatus: "OPERATIONAL"
    });
}
