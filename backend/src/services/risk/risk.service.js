import { query } from "../../config/database.js";
import { getUserDataExposureRisk } from "./data-exposure.service.js";

export const RISK_POINTS = {
    newDevice: 15,
    newLocation: 10,
    unusualLoginTime: 10,
    highRequestVolume: 15,
    unusualResource: 12,
    unusualAction: 8,
    scopeViolation: 15,
    decoyAccess: 60
};

export function decisionForScore(score) {
    if (score >= 85) return "QUARANTINE";
    if (score >= 70) return "RESTRICT";
    if (score >= 50) return "VERIFY";
    if (score >= 30) return "MONITOR";
    return "ALLOW";
}

function inHourRange(hour, start, end) {
    if (start == null || end == null) return true;
    return start <= end ? hour >= start && hour <= end : hour >= start || hour <= end;
}

export function calculateScores({ event, baseline, previousScore = 0, isDecoy = false, dataExposureRisk = null }) {
    const factors = [];
    let increase = 0;
    const knownDevices = Array.isArray(baseline?.known_devices) ? baseline.known_devices : [];
    const knownLocations = Array.isArray(baseline?.known_locations) ? baseline.known_locations : [];
    const commonTypes = Array.isArray(baseline?.common_resource_types) ? baseline.common_resource_types : [];

    const add = (type, points, detail) => { increase += points; factors.push({ type, points, detail }); };
    if (event.device_fingerprint && !knownDevices.includes(event.device_fingerprint)) add("new_device", RISK_POINTS.newDevice, "New device fingerprint detected.");
    if (event.location && !knownLocations.includes(event.location)) add("new_location", RISK_POINTS.newLocation, "New location detected.");
    const avg = Number(baseline?.avg_requests_per_minute || baseline?.avg_request_count || 0);
    if (Number(event.request_count) >= 50 || (avg > 0 && Number(event.request_count) > avg * 2)) add("high_request_volume", RISK_POINTS.highRequestVolume, "Request volume exceeds the normal baseline.");
    const type = event.metadata?.resource_type;
    if (typeof type === "string" && type.trim() && !commonTypes.includes(type.trim().toLowerCase())) add("unusual_resource", RISK_POINTS.unusualResource, `Unusual resource category: ${type}.`);
    if (event.event_type === "login" && !inHourRange(new Date(event.created_at).getHours(), baseline?.usual_login_hour_start, baseline?.usual_login_hour_end)) add("unusual_login_time", RISK_POINTS.unusualLoginTime, "Login time is outside the normal window.");
    if (event.action && /delete|export|download|grant|disable/i.test(event.action)) add("unusual_action", RISK_POINTS.unusualAction, "High-impact action observed.");
    if (event.scope && event.scope !== "assigned" && event.scope !== "own") add("scope_violation", RISK_POINTS.scopeViolation, "Action scope is outside the normal assignment.");
    if (isDecoy) add("decoy_access", RISK_POINTS.decoyAccess, "Controlled deception resource was accessed.");

    const behaviorScore = Math.min(100, Math.max(0, increase ? Number(previousScore) + increase : Number(previousScore) - 5));
    const rawExposureScore = Number(dataExposureRisk?.score);
    const dataExposureScore = Number.isFinite(rawExposureScore)
        ? Math.min(100, Math.max(0, Math.round(rawExposureScore)))
        : 0;
    const behaviorAts = Math.min(100, Math.max(0, factors.reduce((sum, f) => sum + f.points, 0) + (isDecoy ? 25 : 0)));

    const exposureFactors = dataExposureScore > 0
        ? [
            {
                type: "data_exposure_risk",
                points: dataExposureScore,
                detail: "Rolling sensitive-data exposure risk is " + dataExposureScore + "/100."
            },
            ...(Array.isArray(dataExposureRisk?.factors) ? dataExposureRisk.factors : []).map(factor => ({
                type: "data_exposure_" + String(factor.code || "signal").toLowerCase(),
                points: Number.isFinite(Number(factor.points)) ? Math.max(0, Number(factor.points)) : 0,
                detail: String(factor.detail || "Sensitive-data exposure signal observed.")
            }))
        ]
        : [];
    const allFactors = [...factors, ...exposureFactors];

    // Risk fusion: high data risk cannot be hidden by a low behavior score.
    // Scores are fused with MAX rather than added to avoid double counting.
    const fusedScore = Math.max(behaviorScore, dataExposureScore);
    const sts = Math.max(0, 100 - fusedScore);
    const ats = Math.max(behaviorAts, dataExposureScore);
    return {
        previousScore: Number(previousScore),
        behaviorScore,
        dataExposureScore,
        dataExposureSeverity: dataExposureRisk?.severity ?? (dataExposureScore >= 70 ? "CRITICAL" : dataExposureScore >= 50 ? "HIGH" : dataExposureScore >= 30 ? "MEDIUM" : "LOW"),
        score: fusedScore,
        sts,
        ats,
        decision: isDecoy ? "QUARANTINE" : decisionForScore(fusedScore),
        factors: allFactors,
        explanation: allFactors.length ? allFactors.map(f => f.detail).join(" ") : "Observed behavior and sensitive-data exposure match the current baseline."
    };
}

export async function evaluateAndSave({ userId, sessionId, event, isDecoy = false }) {
    const baselineResult = await query(`SELECT * FROM user_baselines WHERE user_id=$1`, [userId]);
    const baseline = baselineResult.rows[0] ?? null;
    const previousResult = await query(`SELECT risk_score, sts_score FROM risk_decisions WHERE session_id=$1 ORDER BY created_at DESC LIMIT 1`, [sessionId]);
    const previousScore = Number(previousResult.rows[0]?.risk_score ?? 0);

    // Exposure analytics supplement existing scoring. If analytics are unavailable,
    // retain the existing behavior-risk path and do not invent an exposure score.
    let dataExposureRisk = null;
    try {
        dataExposureRisk = await getUserDataExposureRisk(userId);
    } catch (error) {
        console.error("Data exposure assessment unavailable; using behavior risk only:", error);
    }

    const result = calculateScores({ event, baseline, previousScore, isDecoy, dataExposureRisk });
    const saved = await query(`
        INSERT INTO risk_decisions
        (user_id,session_id,behavior_event_id,risk_score,decision,reasons,ai_assessment,previous_score,sts_score,ats_score,explanation,policy_id,risk_factors)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        RETURNING *`,
        [userId, sessionId, event.id, result.score, result.decision, JSON.stringify(result.factors.map(f => f.type)), null,
         result.previousScore, result.sts, result.ats, result.explanation, "default-zero-trust-v2", JSON.stringify(result.factors)]);
    return { ...result, decisionId: saved.rows[0].id, riskDecision: saved.rows[0] };
}
