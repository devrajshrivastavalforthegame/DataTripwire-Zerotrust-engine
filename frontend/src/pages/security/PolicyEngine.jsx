import { motion } from "motion/react";
import { FlaskConical, History, ToggleLeft, ToggleRight } from "lucide-react";
import { useMemo, useState } from "react";
import { securityStore, useSecurityStore } from "../../services/securityStore";

function decision(score,policies){
 const enabled=policies.filter(p=>p.enabled).sort((a,b)=>b.threshold-a.threshold);
 return enabled.find(p=>score>=p.threshold)?.effect||"ALLOW";
}
export default function PolicyEngine(){
 const policies=useSecurityStore(s=>s.policies);
 const togglePolicy=useSecurityStore(()=>securityStore.togglePolicy);
 const [score,setScore]=useState(72);
 const result=useMemo(()=>decision(score,policies),[score,policies]);
 return <motion.div className="page security-page" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
  <div className="security-page-heading"><div><span className="security-eyebrow">DECISION CONTROL</span><h1>Policy Engine</h1><p>Evaluate risk against deterministic policies before adaptive enforcement.</p></div></div>
  <section className="sec-policy-grid"><div className="sec-panel"><div className="sec-panel-header"><div><span className="security-eyebrow">ACTIVE POLICIES</span><h2>Policy set</h2></div></div>{policies.map(p=><div className="sec-policy-row" key={p.id}><div><strong>{p.name}</strong><small>{p.scope} · v{p.version}</small></div><span className={"sec-decision "+p.effect.toLowerCase()}>{p.effect}</span><button onClick={()=>togglePolicy(p.id)}>{p.enabled?<ToggleRight size={25}/>:<ToggleLeft size={25}/>}</button></div>)}</div>
  <div className="sec-panel sec-simulator"><div className="sec-panel-header"><div><span className="security-eyebrow">POLICY SIMULATOR</span><h2>Test a risk score</h2></div><FlaskConical size={18}/></div><div className="sec-sim-score"><strong>{score}</strong><span>RISK SCORE</span></div><input type="range" min="0" max="100" value={score} onChange={e=>setScore(Number(e.target.value))}/><div className="sec-sim-scale"><span>0 Allow</span><span>50 Verify</span><span>70 Restrict</span><span>85 Block</span></div><div className={"sec-policy-result "+result.toLowerCase()}><strong>{result}</strong><span>Decision returned by enabled policy chain</span></div></div></section>
  <section className="sec-panel"><div className="sec-panel-header"><div><span className="security-eyebrow">GOVERNANCE</span><h2>Policy lifecycle</h2></div><History size={16}/></div><div className="sec-lifecycle-note">Enable or disable policies and use the simulator to preview the decision before enforcement.</div></section>
 </motion.div>;
}
