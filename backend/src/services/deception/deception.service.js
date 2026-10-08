import { query } from "../../config/database.js";
import { evaluateAndSave } from "../risk/risk.service.js";
import { applyPolicy } from "../policy/policy.service.js";
import { analyzeWithAI } from "../ai/ai.service.js";

export async function triggerDecoy({ auth, ipAddress, resource = "/api/v1/finance/archive/backup" }) {
    const eventResult = await query(`
        INSERT INTO behavior_events
        (session_id,user_id,event_type,request_count,resource,action,ip_address,device_fingerprint,location,metadata,is_decoy,sts_score,ats_score)
        VALUES ($1,$2,'decoy_access',1,$3,'read',$4,$5,$6,$7,true,NULL,100)
        RETURNING *`,
        [auth.session.id,auth.user.id,resource,ipAddress,auth.session.device_fingerprint,auth.session.location,
         JSON.stringify({resource_type:"decoy",decoy:true,reason:"controlled_deception"})]);
    const event = eventResult.rows[0];
    const risk = await evaluateAndSave({ userId:auth.user.id, sessionId:auth.session.id, event, isDecoy:true });
    const policy = await applyPolicy({ userId:auth.user.id, sessionId:auth.session.id, decision:"QUARANTINE" });
    let ai = null;
    try {
        ai = await analyzeWithAI({ user_id:auth.user.id, risk_score:risk.score, decision:"QUARANTINE", reasons:risk.factors.map(f=>f.type), context:{event,sts:risk.sts,ats:risk.ats,session_status:policy.sessionStatus} });
        await query(`UPDATE risk_decisions SET ai_assessment=$1 WHERE id=$2`, [JSON.stringify(ai),risk.decisionId]);
    } catch (error) {
        ai = { assessment:"critical", confidence:0.99, explanation:"AI unavailable; deterministic decoy policy enforced.", recommended_action:"QUARANTINE", fallback:true, error:error.message };
    }
    await query(`INSERT INTO audit_logs (user_id,session_id,event_type,action,severity,details,ip_address) VALUES ($1,$2,'deception','QUARANTINE','critical',$3,$4)`, [auth.user.id,auth.session.id,JSON.stringify({resource,risk,ai}),ipAddress]);
    return { event, risk, policy, ai };
}
