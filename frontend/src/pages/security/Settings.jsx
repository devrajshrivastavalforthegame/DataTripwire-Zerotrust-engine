import { motion } from "motion/react";
import { RotateCcw, ShieldCheck } from "lucide-react";
import { useSecurityStore } from "../../services/securityStore";

const toggles=[["continuousEvaluation","Continuous evaluation","Re-evaluate every active session continuously."],["highRiskAlerts","High-risk notifications","Notify analysts when a session crosses the high-risk threshold."],["auditLogging","Audit logging","Record policy decisions and enforcement actions."],["stepUpVerification","Step-up verification","Require re-authentication for medium-risk sensitive actions."],["automaticContainment","Automatic containment","Allow policy rules to restrict or quarantine high-risk sessions."]];
export default function Settings(){
 const settings=useSecurityStore(s=>s.settings);
 const update=useSecurityStore(s=>s.updateSetting);
 const reset=()=>{const defaults={continuousEvaluation:true,highRiskAlerts:true,auditLogging:true,stepUpVerification:true,automaticContainment:true,verifyThreshold:50,restrictThreshold:70,blockThreshold:85};Object.entries(defaults).forEach(([k,v])=>update(k,v));};
 return <motion.div className="page security-page" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
  <div className="security-page-heading"><div><span className="security-eyebrow">CONSOLE CONFIGURATION</span><h1>Settings</h1><p>Configure continuous evaluation and adaptive enforcement guardrails.</p></div><div className="sec-setting-actions"><button className="sec-secondary-button" onClick={reset}><RotateCcw size={14}/> Reset</button><span className="sec-live-badge"><ShieldCheck size={13}/> Saved locally</span></div></div>
  <section className="sec-panel"><div className="sec-panel-header"><div><span className="security-eyebrow">CONTINUOUS TRUST</span><h2>Evaluation controls</h2></div></div>{toggles.map(([key,title,desc])=><button className="sec-setting-row" key={key} onClick={()=>update(key,!settings[key])}><div><strong>{title}</strong><small>{desc}</small></div><span className={settings[key]?"on":"off"}>{settings[key]?"ON":"OFF"}</span></button>)}</section>
  <section className="sec-panel sec-thresholds"><div className="sec-panel-header"><div><span className="security-eyebrow">RISK THRESHOLDS</span><h2>Adaptive decision boundaries</h2></div></div>{[["verifyThreshold","VERIFY"],["restrictThreshold","RESTRICT"],["blockThreshold","BLOCK"]].map(([key,label])=><label key={key}><span><strong>{label}</strong><b>{settings[key]}</b></span><input type="range" min="0" max="100" value={settings[key]} onChange={e=>update(key,Number(e.target.value))}/></label>)}</section>
 </motion.div>;
}
