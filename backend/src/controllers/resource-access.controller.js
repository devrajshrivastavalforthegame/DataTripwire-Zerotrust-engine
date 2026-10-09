import { query } from "../config/database.js";
import { evaluateAndSave, decisionForScore } from "../services/risk/risk.service.js";
import { calculateExposureRisk } from "./exposure.controller.js";
import { applyPolicy } from "../services/policy/policy.service.js";
import { analyzeWithAI } from "../services/ai/ai.service.js";
import { sendSecurityIncidentAlert } from "../services/alert.service.js";

export async function accessProtectedResource(req, res) {
  const { id } = req.params;
  const { action = "OPEN" } = req.body || {};

  const resourceResult = await query(
    `SELECT id,name,resource_type,sensitivity,description,active
     FROM resources WHERE id=$1 LIMIT 1`, [id]
  );
  const resource = resourceResult.rows[0];
  if (!resource || !resource.active) return res.status(404).json({ error:"Resource not found" });

  const allowedActions = ["OPEN","DOWNLOAD","COPY"];
  if (!allowedActions.includes(String(action).toUpperCase())) {
    return res.status(400).json({ error:"action must be OPEN, DOWNLOAD, or COPY" });
  }

  const requestCountResult = await query(
    `SELECT COUNT(*)::int AS count FROM behavior_events WHERE session_id = $1 AND created_at >= NOW() - make_interval(mins => 1)`,
    [req.auth.session.id]
  );
  const observedRequestCount = Number(requestCountResult.rows[0]?.count || 0) + 1;

  const eventResult = await query(
    `INSERT INTO behavior_events
      (session_id,user_id,event_type,request_count,resource,action,ip_address,device_fingerprint,location,metadata,responsibility,task,scope)
     VALUES ($1,$2,'RESOURCE_ACCESS',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING *`,
    [
      req.auth.session.id, req.auth.user.id, observedRequestCount,
      resource.name, String(action).toUpperCase(), req.ip,
      req.auth.session.device_fingerprint ?? null,
      req.auth.session.location ?? null,
      JSON.stringify({resourceType:resource.resource_type,sensitivity:resource.sensitivity,protected:true}),
      req.auth.user.role, null, "assigned"
    ]
  );

  const event = eventResult.rows[0];

  const telemetryAction = ({
  OPEN: "VIEW",
  DOWNLOAD: "DOWNLOAD",
    COPY: "COPY",
  })[String(action).toUpperCase()] || "VIEW";

  event.metadata = {
    ...(event.metadata || {}),
    resource_type: ["RESTRICTED", "CONFIDENTIAL"].includes(String(resource.sensitivity).toUpperCase())
      ? String(resource.sensitivity).toLowerCase()
      : resource.resource_type,
    high_impact_action: ["DOWNLOAD", "COPY"].includes(String(action).toUpperCase()),
  };
  await query(`UPDATE behavior_events SET metadata=$1 WHERE id=$2`, [JSON.stringify(event.metadata), event.id]);
  const isHighImpact = ["DOWNLOAD","COPY"].includes(String(action).toUpperCase());


  const protectedPoints =
    resource.resource_type === "CREDENTIALS"
        ? 55
        : resource.sensitivity === "RESTRICTED"
            ? 25
            : resource.sensitivity === "CONFIDENTIAL"
                ? 14
                : 0;

const actionPoints = isHighImpact
    ? resource.resource_type === "CREDENTIALS"
        ? 25
        : 12
    : 0;


const additionalFactors = [];

if (String(resource.sensitivity).toUpperCase() === "CRITICAL") {
  additionalFactors.push({
    type: "data_classification",
    points: 40,
    detail: "Access to CRITICAL-classified data",
  });
} else if (String(resource.sensitivity).toUpperCase() === "INTERNAL") {
  additionalFactors.push({
    type: "data_classification",
    points: 5,
    detail: "Access to INTERNAL-classified data",
  });
}
if (protectedPoints > 0) {
  additionalFactors.push({
    type: "protected_resource",
    points: protectedPoints,
    detail: `${
      resource.resource_type === "CREDENTIALS"
        ? "Credential"
        : resource.sensitivity
    } resource accessed.`
  });
}

if (actionPoints > 0) {
  additionalFactors.push({
    type: "high_impact_action",
    points: actionPoints,
    detail: `High-impact ${String(action).toUpperCase()} action on a protected resource.`
  });
}

  const risk = await evaluateAndSave({
    userId: req.auth.user.id,
    sessionId: req.auth.session.id,
    event,
    isDecoy: false,
    additionalFactors
  });

  // Fuse behavior/access risk with cumulative data-exposure risk. This is deterministic
  // backend policy input; AI remains advisory. Keep the rolling window bounded.
  const exposureEvents = await query(
    `SELECT action, classification, bytes_transferred, department, resource_id
       FROM data_access_events WHERE user_id=$1 AND created_at >= NOW() - INTERVAL '30 days'
       ORDER BY created_at DESC LIMIT 5000`,
    [req.auth.user.id]
  );
  const exposure = calculateExposureRisk(exposureEvents.rows);
  const fusedScore = Math.max(Number(risk.score) || 0, exposure.DBR);
  if (fusedScore !== risk.score) {
    risk.score = fusedScore;
    risk.decision = decisionForScore(fusedScore);
    risk.sts = Math.max(0, 100 - fusedScore);
    risk.explanation = `${risk.explanation} Cumulative data exposure fusion: DER ${exposure.DER}, ER ${exposure.ER}, DBR ${exposure.DBR}.`;
    await query(`UPDATE risk_decisions SET risk_score=$1, decision=$2, sts_score=$3, explanation=$4,
      risk_factors = risk_factors || $5::jsonb WHERE id=$6`,
      [risk.score, risk.decision, risk.sts, risk.explanation,
       JSON.stringify([{ type: "data_risk_fusion", points: exposure.DBR, detail: `DER ${exposure.DER}; ER ${exposure.ER}; DBR ${exposure.DBR}` }]), risk.decisionId]);
  }

  const stepUpVerifiedAt = req.auth.session.step_up_verified_at ? Date.parse(req.auth.session.step_up_verified_at) : NaN;
  const stepUpAgeMs = Date.now() - stepUpVerifiedAt;
  const stepUpVerified = Number.isFinite(stepUpAgeMs) && stepUpAgeMs >= 0 && stepUpAgeMs <= 5 * 60 * 1000;
  const policy = await applyPolicy({userId:req.auth.user.id,sessionId:req.auth.session.id,decision:risk.decision,stepUpVerified});

  let ai = null;
  try {
    ai = await analyzeWithAI({
      user_id: String(req.auth.user.id),
      session_id: String(req.auth.session.id),
      risk_score: risk.score,
      decision: risk.decision,
      reasons: risk.factors.map(f => f.type),
      device: { is_new: risk.factors.some((factor) => factor.type === "new_device") },
      location: { is_new: risk.factors.some((factor) => factor.type === "new_location") },
      time_context: { is_unusual: risk.factors.some((factor) => factor.type === "unusual_login_time") },
      activity: {
        requests_per_minute: observedRequestCount,
        unique_resources: 1,
        records_accessed: 0,
        download_volume_mb: 0,
        authorization_failures: 0,
        cross_domain_access: 0
      },
      context: {
        role: req.auth.user.role || "",
        responsibility: req.auth.user.role || "",
        task: event.task || "",
        resource: resource.name,
        action: String(action).toUpperCase(),
        scope: event.scope || "assigned",
        sts: risk.sts,
        ats: risk.ats,
        session_status: req.auth.session.status || "active",
        task_match: true,
        responsibility_match: true,
        sensitive_resource: resource.sensitivity !== "PUBLIC",
        deception_interaction: false
      }
    });
  } catch {
    ai = {assessment:"unavailable",confidence:0,recommended_action:risk.decision,fallback:true};
  }

  const blocked = ["RESTRICT","QUARANTINE"].includes(risk.decision) || (risk.decision === "VERIFY" && !stepUpVerified);

  // Exposure telemetry represents data that the user was actually allowed to access.
  // Attempted/blocked requests remain in behavior_events and audit_logs, but must not
  // inflate data exfiltration metrics as though bytes or records were disclosed.
  if (!blocked) {
    await query(
      `INSERT INTO data_access_events
         (user_id, session_id, resource_id, action, classification,
          department, source_ip, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`,
      [
        req.auth.user.id,
        req.auth.session.id,
        resource.id,
        telemetryAction,
        String(resource.sensitivity || "INTERNAL").toUpperCase(),
        req.auth.user.department || null,
        req.ip || null,
        JSON.stringify({
          resource_name: resource.name,
          resource_type: resource.resource_type,
          request_count: observedRequestCount,
          outcome: "allowed",
          measured_bytes: false,
        }),
      ]
    );
  }

  const severity = risk.score >= 85 ? "critical" : risk.score >= 70 ? "high" : risk.score >= 50 ? "medium" : "info";

  await query(
    `INSERT INTO audit_logs (user_id,session_id,event_type,action,severity,details,ip_address)
     VALUES ($1,$2,'resource_access',$3,$4,$5,$6)`,
    [req.auth.user.id,req.auth.session.id,risk.decision,severity,
      JSON.stringify({resource,requestedAction:action,risk,policy,ai,blocked}),req.ip]
  );

  let alert = {sent:false,configured:false};
  if (risk.score >= 70 || ["DOWNLOAD","COPY"].includes(String(action).toUpperCase()) && resource.sensitivity !== "PUBLIC") {
    try {
      alert = await sendSecurityIncidentAlert({
        user:req.auth.user,event,risk,decision:risk.decision,resource:resource.name,timestamp:new Date().toISOString()
      });
    } catch (error) {
      console.error("Security alert email failed:",error);
      alert = {sent:false,configured:true,error:"delivery_failed"};
    }
  }

  return res.status(blocked ? 403 : 200).json({
    allowed:!blocked,
    ...(blocked && risk.decision === "VERIFY" ? { code: "STEP_UP_REQUIRED" } : {}),
    ...(blocked && risk.decision === "RESTRICT" ? { code: "SESSION_RESTRICTED" } : {}),
    ...(blocked && risk.decision === "QUARANTINE" ? { code: "SESSION_QUARANTINED" } : {}),
    resource,
    action:String(action).toUpperCase(),
    risk:{score:risk.score,sts:risk.sts,ats:risk.ats,decision:risk.decision,factors:risk.factors,explanation:risk.explanation},
    exposure:{DER:exposure.DER,ER:exposure.ER,DBR:exposure.DBR,level:exposure.level,window:"30 days"},
    policy,
    ai,
    alert
  });
}
