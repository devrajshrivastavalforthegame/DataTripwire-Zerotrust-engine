import { motion } from "motion/react";
import { Play } from "lucide-react";
import { securityStore, useSecurityStore } from "../../services/securityStore";

const levels=[["ALLOW","Normal activity continues.","allow"],["VERIFY","Re-authentication required.","verify"],["RESTRICT","Sensitive actions are limited.","restrict"],["BLOCK","Session is quarantined.","block"]];
export default function AdaptiveResponse(){
 const responses=useSecurityStore(s=>s.responses);
 const executeResponse=useSecurityStore(()=>securityStore.executeResponse);
 return <motion.div className="page security-page" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
  <div className="security-page-heading"><div><span className="security-eyebrow">RESPONSE CONTROL</span><h1>Adaptive Response</h1><p>Escalation and recovery are determined by policy, never by AI.</p></div></div>
  <section className="security-panel"><div className="response-ladder">{levels.map(([label,description,type],i)=><div className={"response-level "+type} key={label}><span>0{i+1}</span><strong>{label}</strong><p>{description}</p></div>)}</div></section>
  <section className="security-panel"><div className="security-panel-heading"><div><span className="security-eyebrow">LIFECYCLE</span><h2>Response lifecycle</h2></div></div><div className="lifecycle">{["Detection","Risk Increase","Policy Evaluation","Decision","Enforcement","Monitoring","Recovery"].map((x,i)=><div className="lifecycle-step" key={x}><span>{i+1}</span><strong>{x}</strong></div>)}</div></section>
  <section className="sec-panel"><div className="sec-panel-header"><div><span className="security-eyebrow">ACTIVE RESPONSES</span><h2>Enforcement queue</h2></div></div>{responses.map(r=><div className="sec-response-row" key={r.id}><div><strong>{r.user}</strong><small>{r.trigger}</small></div><b>{r.risk}</b><span>{r.resource}</span><span className={"sec-decision "+r.decision.toLowerCase()}>{r.decision}</span><span>{r.status}</span><div className="sec-response-actions">{["ALLOW","VERIFY","RESTRICT","BLOCK"].map(d=><button title={"Set "+d} key={d} className={r.decision===d?"active":""} onClick={()=>executeResponse(r.id,d)}><Play size={10}/>{d}</button>)}</div></div>)}</section>
 </motion.div>;
}
