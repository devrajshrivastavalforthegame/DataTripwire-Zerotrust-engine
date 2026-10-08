import { query } from "../../config/database.js";
import { writeAudit } from "../audit.service.js";

const WEIGHTS = {
    newDevice: 15,
    newLocation: 10,
    unusualLoginTime: 10,
    highRequestVolume: 15,
    unusualResource: 12
};

export function calculateRisk(flags = {}) {
    let score = 0;
    const reasons = [];
    for (const [key, weight] of Object.entries(WEIGHTS)) {
        if (flags[key]) { score += weight; reasons.push(key); }
    }
    score = Math.max(0, Math.min(100, score));
    let decision = "ALLOW";
    if (score >= 85) decision = "QUARANTINE";
    else if (score >= 70) decision = "RESTRICT";
    else if (score >= 50) decision = "VERIFY";
    else if (score >= 30) decision = "MONITOR";
    return { score, decision, reasons };
}

export async function recordBehavior({ auth, body, ipAddress }) {
    const {
        eventType, requestCount = 0, resource = null, action = null,
        deviceFingerprint = null, location = null, metadata = {}
    } = body || {};

    if (typeof eventType !== "string" || !eventType.trim()) throw new Error("eventType is required");
    if (!Number.isInteger(requestCount) || requestCount < 0 || requestCount > 100000) throw new Error("Invalid requestCount");

    const flags = {
        newDevice: !!deviceFingerprint && deviceFingerprint !== auth.session.device_fingerprint,
        newLocation: !!location && location !== auth.session.location,
        highRequestVolume: requestCount >= 50,
        unusualResource: !!resource && /admin|secret|payroll|backup|credentials/i.test(resource)
    };
    const risk = calculateRisk(flags);

    const event = await query(
        `INSERT INTO behavior_events
        (session_id,user_id,event_type,request_count,resource,action,ip_address,device_fingerprint,location,metadata)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        RETURNING *`,
        [auth.session.id, auth.user.id, eventType.trim(), requestCount, resource, action,
         ipAddress, deviceFingerprint, location, metadata]
    );

    await query(
        `INSERT INTO risk_decisions
        (user_id,session_id,behavior_event_id,risk_score,decision,reasons)
        VALUES ($1,$2,$3,$4,$5,$6)`,
        [auth.user.id, auth.session.id, event.rows[0].id, risk.score, risk.decision, risk.reasons]
    );

    if (risk.decision === "VERIFY") {
        await query(`UPDATE sessions SET step_up_required=true, baseline_eligible=false WHERE id=$1`, [auth.session.id]);
    }
    if (risk.decision === "RESTRICT" || risk.decision === "QUARANTINE") {
        await query(`UPDATE sessions SET status=$2, baseline_eligible=false WHERE id=$1`, [
            auth.session.id, risk.decision.toLowerCase()
        ]);
    }

    await writeAudit({
        userId: auth.user.id, sessionId: auth.session.id,
        eventType: "behavior_risk", action: risk.decision,
        severity: risk.score >= 70 ? "high" : risk.score >= 30 ? "medium" : "info",
        details: { riskScore: risk.score, reasons: risk.reasons, flags }
    });

    return { event: event.rows[0], risk };
}
