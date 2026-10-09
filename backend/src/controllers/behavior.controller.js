import { query } from "../config/database.js";
import { evaluateAndSave } from "../services/risk/risk.service.js";
import { applyPolicy } from "../services/policy/policy.service.js";
import { analyzeWithAI } from "../services/ai/ai.service.js";

function validString(value,max) { return value == null || (typeof value === "string" && value.length <= max); }

export async function behaviorController(req,res) {
    try {
        const body = req.body || {};
        const eventType = body.eventType;
        const requestCount = body.requestCount ?? 0;
        if (typeof eventType !== "string" || !eventType.trim()) return res.status(400).json({error:"eventType is required"});
        if (!Number.isInteger(requestCount) || requestCount < 0 || requestCount > 100000) return res.status(400).json({error:"requestCount must be an integer between 0 and 100000"});
        for (const [k,m] of [["resource",500],["action",100],["deviceFingerprint",200],["location",200],["responsibility",150],["task",200],["scope",200]]) if (!validString(body[k],m)) return res.status(400).json({error:`${k} is invalid`});
        if (body.metadata != null && (typeof body.metadata !== "object" || Array.isArray(body.metadata))) return res.status(400).json({error:"metadata must be an object"});

        const eventResult = await query(`
            INSERT INTO behavior_events
            (session_id,user_id,event_type,request_count,resource,action,ip_address,device_fingerprint,location,metadata,responsibility,task,scope)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
            RETURNING *`,
            [req.auth.session.id,req.auth.user.id,eventType.trim(),requestCount,body.resource ?? null,body.action ?? null,req.ip,
             body.deviceFingerprint ?? req.auth.session.device_fingerprint ?? null,body.location ?? req.auth.session.location ?? null,
             JSON.stringify(body.metadata ?? {}),body.responsibility ?? req.auth.user.role ?? null,body.task ?? null,body.scope ?? "assigned"]);
        const event = eventResult.rows[0];
        const risk = await evaluateAndSave({userId:req.auth.user.id,sessionId:req.auth.session.id,event});
        await query(`UPDATE behavior_events SET sts_score=$1,ats_score=$2 WHERE id=$3`,[risk.sts,risk.ats,event.id]);
        const policy = await applyPolicy({userId:req.auth.user.id,sessionId:req.auth.session.id,decision:risk.decision});
        let ai = null;
        try {
            ai = await analyzeWithAI({user_id:req.auth.user.id,risk_score:risk.score,decision:risk.decision,reasons:risk.factors.map(f=>f.type),context:{role:req.auth.user.role,responsibility:event.responsibility,task:event.task,resource:event.resource,action:event.action,scope:event.scope,sts:risk.sts,ats:risk.ats,session_status:policy.sessionStatus}});
            await query(`UPDATE risk_decisions SET ai_assessment=$1 WHERE id=$2`,[JSON.stringify(ai),risk.decisionId]);
        } catch { ai = {assessment:"unavailable",confidence:0,recommended_action:risk.decision,explanation:"AI unavailable; deterministic backend policy remains authoritative",fallback:true}; }
        await query(`INSERT INTO audit_logs (user_id,session_id,event_type,action,severity,details,ip_address) VALUES ($1,$2,'behavior_risk',$3,$4,$5,$6)`,
            [req.auth.user.id,req.auth.session.id,risk.decision,risk.score>=70?"high":risk.score>=30?"medium":"info",JSON.stringify({risk,policy,ai}),req.ip]);
        return res.status(201).json({event,risk:{score:risk.score,behaviorScore:risk.behaviorScore,dataExposureScore:risk.dataExposureScore,dataExposureSeverity:risk.dataExposureSeverity,sts:risk.sts,ats:risk.ats,decision:risk.decision,factors:risk.factors,explanation:risk.explanation},policy,ai});
    } catch (error) { console.error("Behavior processing error",error); return res.status(500).json({error:"Unable to process behavior event"}); }
}
