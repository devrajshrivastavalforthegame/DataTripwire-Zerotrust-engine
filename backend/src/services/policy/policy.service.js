import { query } from "../../config/database.js";

const ACTIONS = {
    ALLOW: { requiredAction: "NONE", enforcement: "APPLICATION_CONTINUES" },
    MONITOR: { requiredAction: "INCREASE_MONITORING", enforcement: "APPLICATION_CONTINUES" },
    VERIFY: { requiredAction: "STEP_UP_AUTH", enforcement: "PROTECTED_ACTIONS_REQUIRE_VERIFICATION" },
    RESTRICT: { requiredAction: "LIMIT_CAPABILITIES", enforcement: "HIGH_RISK_ACTIONS_DENIED" },
    QUARANTINE: { requiredAction: "DENY_PROTECTED_ACTIONS", enforcement: "SESSION_QUARANTINED" }
};

export async function applyPolicy({ userId, sessionId, decision, stepUpVerified = false }) {
    const action = ACTIONS[decision];
    if (!action) throw new Error(`Unsupported policy decision: ${decision}`);
    if (decision === "VERIFY" && !stepUpVerified) await query(`UPDATE sessions SET step_up_required=true, step_up_verified_at=NULL, baseline_eligible=false, last_activity_at=NOW() WHERE id=$1 AND user_id=$2`, [sessionId,userId]);
    if (decision === "RESTRICT") await query(`UPDATE sessions SET status='restricted', baseline_eligible=false, last_activity_at=NOW() WHERE id=$1 AND user_id=$2`, [sessionId,userId]);
    if (decision === "QUARANTINE") await query(`UPDATE sessions SET status='quarantined', baseline_eligible=false, step_up_required=true, last_activity_at=NOW() WHERE id=$1 AND user_id=$2`, [sessionId,userId]);
    const result = await query(`SELECT status,step_up_required,step_up_verified_at,baseline_eligible FROM sessions WHERE id=$1 AND user_id=$2`, [sessionId,userId]);
    const row = result.rows[0];
    return { policyId:"default-zero-trust-v2", decision, ...action, ...(decision === "VERIFY" && stepUpVerified ? { requiredAction: "NONE", enforcement: "VERIFICATION_SATISFIED_FOR_CURRENT_WINDOW" } : {}), sessionStatus:row?.status ?? null, stepUpRequired:row?.step_up_required ?? false, stepUpVerifiedAt:row?.step_up_verified_at ?? null, stepUpSatisfied: decision === "VERIFY" && stepUpVerified, baselineEligible:row?.baseline_eligible ?? false };
}
