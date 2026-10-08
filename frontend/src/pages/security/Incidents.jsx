import { motion } from "motion/react";
import { AlertTriangle } from "lucide-react";
import { useMemo, useState } from "react";
import { useSecurityStore } from "../../services/securityStore";

export default function Incidents(){
 const incidents=useSecurityStore(s=>s.incidents);
 const updateIncident=useSecurityStore(s=>s.updateIncident);
 const [filter,setFilter]=useState("All");
 const [selected,setSelected]=useState(incidents[0]?.id);
 const rows=useMemo(()=>filter==="All"?incidents:incidents.filter(i=>i.severity===filter),[incidents,filter]);
 const active=incidents.find(i=>i.id===selected)||rows[0];
 return <motion.div className="page security-page" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
  <div className="security-page-heading"><div><span className="security-eyebrow">THREAT MANAGEMENT</span><h1>Incidents</h1><p>Investigate correlated behaviour, contain impact and record every response.</p></div><span className="sec-live-badge"><i/> {incidents.filter(i=>i.status!=="Resolved").length} OPEN</span></div>
  <div className="sec-filter-group">{["All","Critical","High","Medium"].map(x=><button key={x} className={filter===x?"active":""} onClick={()=>setFilter(x)}>{x}</button>)}</div>
  <div className="sec-incident-layout"><section className="sec-panel"><div className="sec-panel-header"><div><span className="security-eyebrow">INCIDENT QUEUE</span><h2>Security incidents</h2></div></div>{rows.map(i=><button key={i.id} className={"sec-incident-row "+(selected===i.id?"selected":"")} onClick={()=>setSelected(i.id)}><span className={"sec-severity "+i.severity.toLowerCase()}><AlertTriangle size={14}/>{i.severity}</span><strong>{i.title}</strong><small>{i.user} · {i.time}</small><b>{i.risk}</b></button>)}</section>
  {active&&<aside className="sec-investigation"><div className="sec-investigation-header"><div><span>INCIDENT</span><strong>{active.id}</strong></div><span className={"sec-severity "+active.severity.toLowerCase()}>{active.severity}</span></div><div className="sec-incident-risk"><strong>{active.risk}</strong><span>RISK SCORE</span></div>{[["TRIGGER",active.trigger],["RESOURCE",active.resource],["USER",active.user],["STATUS",active.status]].map(([k,v])=><div className="sec-detail-block" key={k}><span>{k}</span><strong>{v}</strong></div>)}<div className="sec-action-row">{["Investigating","Contained","Resolved"].map(s=><button key={s} className={active.status===s?"active":""} onClick={()=>updateIncident(active.id,s)}>{s}</button>)}</div></aside>}
  </div>
 </motion.div>;
}
