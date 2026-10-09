import { motion } from "motion/react";
import { Search, RefreshCw, Smartphone, Monitor, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../api";

const decision=v=><span className={"sec-decision "+String(v||"ALLOW").toLowerCase()}>{v||"ALLOW"}</span>;
const riskTone=v=>v>=80?"high":v>=50?"medium":"low";

export default function LiveActivity(){
 const [items,setItems]=useState([]),[selected,setSelected]=useState(null),[filter,setFilter]=useState("All"),[q,setQ]=useState("");
 const load=()=>api.securityActivity().then(x=>{const rows=(x.activity||[]).map(e=>({id:e.id,time:e.created_at,user:e.username||e.email,action:e.action||e.event_type,sensitivity:e.metadata?.sensitivity||e.metadata?.resourceSensitivity||"—",device:e.device_fingerprint?"Known":"Unknown",risk:Number(e.risk_score||0),decision:e.decision||"ALLOW",factors:e.risk_factors||[],explanation:e.explanation||"No explanation recorded.",resource:e.resource,session:e.session_id}));setItems(rows);setSelected(s=>s&&rows.find(r=>r.id===s.id)||rows[0]||null);}).catch(console.error);
 useEffect(()=>{load();const t=setInterval(load,1000);return()=>clearInterval(t)},[]);
 const filtered=items.filter(i=>(!q||[i.user,i.action,i.resource,i.sensitivity,i.decision].join(" ").toLowerCase().includes(q.toLowerCase()))&&(filter==="Normal"?i.risk<30:filter==="Suspicious"?i.risk>=30&&i.risk<70:filter==="High Risk"?i.risk>=70:filter==="Blocked"?["BLOCK","QUARANTINE"].includes(i.decision):true));
 return <div className="sec-page">
  <div className="sec-page-heading"><div><span className="sec-eyebrow">SECURITY CONSOLE</span><h1>Live Activity</h1><p>Real events from WorkShepher, scored and decided by the backend.</p></div><div className="sec-live-indicator"><span/>Streaming · 1s</div></div>
  <div className="sec-toolbar"><div className="sec-search"><Search size={15}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search users, actions, resources..." /></div><div className="sec-filter-group">{["All","Normal","Suspicious","High Risk","Blocked"].map(f=><button key={f} className={filter===f?"active":""} onClick={()=>setFilter(f)}>{f}</button>)}</div><button className="sec-secondary-button" onClick={load}><RefreshCw size={14}/>Refresh</button></div>
  <div className="sec-activity-layout"><section className="sec-panel sec-activity-panel"><div className="sec-event-head activity"><span>TIME</span><span>USER</span><span>ACTION</span><span>RESOURCE</span><span>DEVICE</span><span>RISK</span><span>DECISION</span><span/></div><div className="sec-activity-list">
   {filtered.map(item=><motion.button className={"sec-activity-row "+(selected?.id===item.id?"selected":"")} key={item.id} onClick={()=>setSelected(item)} initial={{opacity:0}} animate={{opacity:1}}><time>{new Date(item.time).toLocaleTimeString()}</time><strong>{item.user}</strong><span className="sec-action-name">{item.action}</span><span className="sec-sensitivity">{item.resource||item.sensitivity}</span><span className="sec-device">{item.device==="Unknown"?<Smartphone size={13}/>:<Monitor size={13}/>} {item.device}</span><span className={"sec-table-risk "+riskTone(item.risk)}>{item.risk}</span>{decision(item.decision)}<ChevronRight size={14}/></motion.button>)}
   {!filtered.length&&<div style={{padding:30,textAlign:"center",opacity:.7}}>Waiting for WorkShepher activity…</div>}
  </div></section>
  {selected&&<motion.aside className="sec-investigation" initial={{opacity:0,x:15}} animate={{opacity:1,x:0}}>
   <div className="sec-investigation-header"><div><span className="sec-section-label">EVENT INVESTIGATION</span><h2>Why this decision?</h2></div><button onClick={()=>setSelected(null)}><X size={16}/></button></div>
   <div className="sec-investigation-risk"><div className={"sec-risk-ring "+(selected.risk>=80?"critical":selected.risk>=50?"warning":"safe")}><strong>{selected.risk}</strong><span>RISK</span></div><div>{decision(selected.decision)}<strong>{selected.user}</strong><span>{selected.action}</span></div></div>
   <div className="sec-detail-block"><span className="sec-detail-label">RISK FACTORS</span>{(selected.factors||[]).map((f,i)=><div className="sec-factor" key={i}><div><span>{f.detail||f.type}</span><strong>+{f.points||0}</strong></div><div className="sec-factor-bar"><motion.i initial={{width:0}} animate={{width:`${Math.min(100,(f.points||0)*3)}%`}}/></div></div>)}</div>
   <div className="sec-detail-block"><span className="sec-detail-label">CONTEXT</span><div className="sec-context-grid"><div><span>Session</span><strong>{selected.session||"—"}</strong></div><div><span>Resource</span><strong>{selected.resource||"—"}</strong></div><div><span>Decision</span><strong>{selected.decision}</strong></div></div></div>
   <div className="sec-policy-result"><span className="sec-detail-label">POLICY DECISION</span><div><strong>{selected.decision}</strong><span>{selected.explanation}</span></div></div>
  </motion.aside>}
  </div></div>
}