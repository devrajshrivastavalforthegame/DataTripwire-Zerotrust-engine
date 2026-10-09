import { query } from "../config/database.js";
import { evaluateAndSave } from "../services/risk/risk.service.js";
import { applyPolicy } from "../services/policy/policy.service.js";
import { analyzeWithAI } from "../services/ai/ai.service.js";
import { sendSecurityIncidentAlert } from "../services/alert.service.js";

export async function accessProtectedResource(req, res) {
  const { id } = req.params;
  const { action = "OPEN", deviceFingerprint, location, requestCount = 1 } = req.body || {};

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

  const eventResult = await query(
    `INSERT INTO behavior_events
      (session_id,user_id,event_type,request_count,resource,action,ip_address,device_fingerprint,location,metadata,responsibility,task,scope)
     VALUES ($1,$2,'RESOURCE_ACCESS',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING *`,
    [
      req.auth.session.id, req.auth.user.id, Number(requestCount) || 1,
      resource.name, String(action).toUpperCase(), req.ip,
      deviceFingerprint ?? req.auth.session.device_fingerprint ?? null,
      location ?? req.auth.session.location ?? null,
      JSON.stringify({resourceType:resource.resource_type,sensitivity:resource.sensitivity,protected:true}),
      req.auth.user.role, null, "assigned"
    ]
  );

  const event = eventResult.rows[0];
  event.metadata = {
    ...(event.metadata || {}),
    resource_type: resource.sensitivity === "RESTRICTED" ? "restricted" : resource.sensitivity === "CONFIDENTIAL" ? "confidential" : resource.resource_type,
    high_impact_action: ["DOWNLOAD","COPY"].includes(String(action).toUpperCase())
  };
  await query(`UPDATE behavior_events SET metadata=$1 WHERE id=$2`, [JSON.stringify(event.metadata), event.id]);
  const isHighImpact = ["DOWNLOAD","COPY"].includes(String(action).toUpperCase());
  const previous = await query(
    `SELECT risk_score FROM risk_decisions WHERE session_id=$1 ORDER BY created_at DESC LIMIT 1`,
    [req.auth.session.id]
  );

  // Protected-resource sensitivity and high-impact actions are explicit risk signals.
  if (resource.sensitivity === "RESTRICTED") event.metadata.resource_type = "restricted";
  else if (resource.sensitivity === "CONFIDENTIAL") event.metadata.resource_type = "confidential";
  if (isHighImpact) event.metadata.high_impact_action = true;

  const risk = await evaluateAndSave({
    userId:req.auth.user.id,
    sessionId:req.auth.session.id,
    event,
    isDecoy:false
  });

  // Add deterministic protected-resource risk after the baseline evaluation.
  let protectedPoints = resource.resource_type === "CREDENTIALS" ? 55 : resource.sensitivity === "RESTRICTED" ? 25 : resource.sensitivity === "CONFIDENTIAL" ? 14 : 0;
  if (isHighImpact) protectedPoints += resource.resource_type === "CREDENTIALS" ? 25 : 12;
  if (protectedPoints) {
    const score = Math.min(100, risk.score + protectedPoints);
    risk.previousScore = risk.score;
    risk.score = score;
    risk.sts = Math.max(0,100-score);
    risk.ats = Math.min(100,risk.ats + protectedPoints);
    risk.factors.push({type:"protected_resource",points:protectedPoints,detail:`${resource.resource_type === "CREDENTIALS" ? "Credential" : resource.sensitivity} resource accessed with ${String(action).toUpperCase()} action.`});
    risk.decision = score >= 85 ? "QUARANTINE" : score >= 70 ? "RESTRICT" : score >= 50 ? "VERIFY" : score >= 30 ? "MONITOR" : "ALLOW";
    risk.explanation = risk.factors.map(f=>f.detail).join(" ");
    await query(
      `UPDATE risk_decisions SET risk_score=$1,decision=$2,previous_score=$3,sts_score=$4,ats_score=$5,explanation=$6,risk_factors=$7,reasons=$8 WHERE id=$9`,
      [risk.score,risk.decision,risk.previousScore,risk.sts,risk.ats,risk.explanation,JSON.stringify(risk.factors),JSON.stringify(risk.factors.map(f=>f.type)),risk.decisionId]
    );
  }

  const policy = await applyPolicy({userId:req.auth.user.id,sessionId:req.auth.session.id,decision:risk.decision});

  let ai = null;
  try {
    ai = await analyzeWithAI({
      user_id: String(req.auth.user.id),
      session_id: String(req.auth.session.id),
      risk_score: risk.score,
      decision: risk.decision,
      reasons: risk.factors.map(f => f.type),
      device: { is_new: false },
      location: { is_new: false },
      time_context: { is_unusual: false },
      activity: {
        requests_per_minute: Number(requestCount) || 1,
        unique_resources: 1,
        records_accessed: isHighImpact ? 1 : 0,
        download_volume_mb: isHighImpact ? 1 : 0,
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

  const blocked = ["RESTRICT","QUARANTINE"].includes(risk.decision);
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
    resource,
    action:String(action).toUpperCase(),
    risk:{score:risk.score,sts:risk.sts,ats:risk.ats,decision:risk.decision,factors:risk.factors,explanation:risk.explanation},
    policy,
    ai,
    alert
  });
}
