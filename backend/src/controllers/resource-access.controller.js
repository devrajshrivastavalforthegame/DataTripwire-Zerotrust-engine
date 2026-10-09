import { query } from "../config/database.js";
import { evaluateAndSave } from "../services/risk/risk.service.js";
import { applyPolicy } from "../services/policy/policy.service.js";
import { analyzeWithAI } from "../services/ai/ai.service.js";
import { sendSecurityIncidentAlert } from "../services/alert.service.js";

const ACTIONS = new Set(["OPEN", "DOWNLOAD", "COPY"]);

function isStepUpFresh(value, now = Date.now()) {
    if (!value) return false;
    const timestamp = Date.parse(value);
    const age = now - timestamp;
    return Number.isFinite(timestamp) && age >= 0 && age <= 5 * 60 * 1000;
}

function protectedFactors(resource, action) {
    const factors = [];
    const sensitivity = String(resource.sensitivity || "").toUpperCase();
    const type = String(resource.resource_type || "").toUpperCase();
    const highImpact = ["DOWNLOAD", "COPY"].includes(action);
    let points = type === "CREDENTIALS" ? 55 : sensitivity === "RESTRICTED" ? 25 : sensitivity === "CONFIDENTIAL" ? 14 : sensitivity === "CRITICAL" ? 40 : sensitivity === "INTERNAL" ? 5 : 0;
    if (points > 0) {
        factors.push({
            type: "protected_resource",
            points,
            detail: `${type === "CREDENTIALS" ? "Credential" : sensitivity} resource accessed.`
        });
    }
    if (highImpact) {
        const actionPoints = type === "CREDENTIALS" ? 25 : 12;
        factors.push({
            type: "high_impact_action",
            points: actionPoints,
            detail: `High-impact ${action} action on a protected resource.`
        });
    }
    return factors;
}

export async function accessProtectedResource(req, res) {
    const { id } = req.params;
    const body = req.body || {};
    const action = String(body.action || "OPEN").toUpperCase();
    const requestCount = Number(body.requestCount ?? 1);

    if (!ACTIONS.has(action)) {
        return res.status(400).json({ error: "action must be OPEN, DOWNLOAD, or COPY" });
    }
    if (!Number.isFinite(requestCount) || requestCount < 1 || requestCount > 1000) {
        return res.status(400).json({ error: "requestCount must be a number between 1 and 1000" });
    }

    try {
        const resourceResult = await query(
            `SELECT id,name,resource_type,sensitivity,description,active
             FROM resources WHERE id=$1 LIMIT 1`,
            [id]
        );
        const resource = resourceResult.rows[0];
        if (!resource || !resource.active) return res.status(404).json({ error: "Resource not found" });

        const eventResult = await query(
            `INSERT INTO behavior_events
              (session_id,user_id,event_type,request_count,resource,action,ip_address,device_fingerprint,location,metadata,responsibility,task,scope)
             VALUES ($1,$2,'RESOURCE_ACCESS',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
             RETURNING *`,
            [
                req.auth.session.id,
                req.auth.user.id,
                requestCount,
                resource.name,
                action,
                req.ip,
                body.deviceFingerprint ?? req.auth.session.device_fingerprint ?? null,
                body.location ?? req.auth.session.location ?? null,
                JSON.stringify({
                    resourceType: resource.resource_type,
                    sensitivity: resource.sensitivity,
                    resource_type: resource.sensitivity === "RESTRICTED"
                        ? "restricted"
                        : resource.sensitivity === "CONFIDENTIAL"
                            ? "confidential"
                            : String(resource.resource_type || "").toLowerCase(),
                    protected: true,
                    high_impact_action: ["DOWNLOAD", "COPY"].includes(action)
                }),
                req.auth.user.role,
                null,
                "assigned"
            ]
        );
        const event = eventResult.rows[0];

        const risk = await evaluateAndSave({
            userId: req.auth.user.id,
            sessionId: req.auth.session.id,
            event,
            isDecoy: false,
            additionalFactors: protectedFactors(resource, action)
        });

        const stepUpVerified = isStepUpFresh(req.auth.session.step_up_verified_at);
        const policy = await applyPolicy({
            userId: req.auth.user.id,
            sessionId: req.auth.session.id,
            decision: risk.decision,
            stepUpVerified
        });

        let ai;
        try {
            ai = await analyzeWithAI({
                user_id: String(req.auth.user.id),
                session_id: String(req.auth.session.id),
                risk_score: risk.score,
                decision: risk.decision,
                reasons: risk.factors.map((factor) => factor.type),
                device: { is_new: false },
                location: { is_new: false },
                time_context: { is_unusual: false },
                activity: {
                    requests_per_minute: requestCount,
                    unique_resources: 1,
                    records_accessed: ["DOWNLOAD", "COPY"].includes(action) ? 1 : 0,
                    download_volume_mb: 0,
                    authorization_failures: 0,
                    cross_domain_access: 0
                },
                context: {
                    role: req.auth.user.role || "",
                    responsibility: req.auth.user.role || "",
                    task: event.task || "",
                    resource: resource.name,
                    action,
                    scope: event.scope || "assigned",
                    sts: risk.sts,
                    ats: risk.ats,
                    session_status: req.auth.session.status || "active",
                    task_match: true,
                    responsibility_match: true,
                    sensitive_resource: String(resource.sensitivity).toUpperCase() !== "PUBLIC",
                    deception_interaction: false
                }
            });
        } catch (error) {
            console.error("AI risk analysis unavailable:", error);
            ai = { assessment: "unavailable", confidence: 0, recommended_action: risk.decision, fallback: true };
        }

        const blocked = ["RESTRICT", "QUARANTINE"].includes(risk.decision) ||
            (risk.decision === "VERIFY" && !stepUpVerified);
        const severity = risk.score >= 85 ? "critical" : risk.score >= 70 ? "high" : risk.score >= 50 ? "medium" : "info";

        await query(
            `INSERT INTO audit_logs (user_id,session_id,event_type,action,severity,details,ip_address)
             VALUES ($1,$2,'resource_access',$3,$4,$5,$6)`,
            [
                req.auth.user.id,
                req.auth.session.id,
                risk.decision,
                severity,
                JSON.stringify({ resource, requestedAction: action, risk, policy, ai, blocked }),
                req.ip
            ]
        );

        let alert = { sent: false, configured: false };
        if (risk.score >= 70 || (["DOWNLOAD", "COPY"].includes(action) && resource.sensitivity !== "PUBLIC")) {
            try {
                alert = await sendSecurityIncidentAlert({
                    user: req.auth.user,
                    event,
                    risk,
                    decision: risk.decision,
                    resource: resource.name,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error("Security alert email failed:", error);
                alert = { sent: false, configured: true, error: "delivery_failed" };
            }
        }

        return res.status(blocked ? 403 : 200).json({
            allowed: !blocked,
            ...(blocked && risk.decision === "VERIFY" ? { code: "STEP_UP_REQUIRED" } : {}),
            ...(blocked && risk.decision === "RESTRICT" ? { code: "SESSION_RESTRICTED" } : {}),
            ...(blocked && risk.decision === "QUARANTINE" ? { code: "SESSION_QUARANTINED" } : {}),
            resource,
            action,
            risk: {
                score: risk.score,
                sts: risk.sts,
                ats: risk.ats,
                decision: risk.decision,
                factors: risk.factors,
                explanation: risk.explanation
            },
            policy,
            ai,
            alert
        });
    } catch (error) {
        console.error("Protected resource access failed:", error);
        return res.status(500).json({ error: "Unable to process resource access" });
    }
}
