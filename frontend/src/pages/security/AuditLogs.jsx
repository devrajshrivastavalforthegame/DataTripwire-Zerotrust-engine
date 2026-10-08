import { motion } from "motion/react";
import { Download, Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { useSecurityStore, downloadAuditCsv } from "../../services/securityStore";

export default function AuditLogs(){
 const audit=useSecurityStore(s=>s.audit);
 const [query,setQuery]=useState("");
 const rows=useMemo(()=>audit.filter(r=>Object.values(r).join(" ").toLowerCase().includes(query.toLowerCase())),[audit,query]);
 return <motion.div className="page security-page" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
  <div className="security-page-heading"><div><span className="security-eyebrow">EVIDENCE & GOVERNANCE</span><h1>Audit Logs</h1><p>Trace decisions, enforcement and administrative changes.</p></div><button className="sec-secondary-button" onClick={()=>downloadAuditCsv(rows)}><Download size={14}/> Export CSV</button></div>
  <div className="sec-audit-toolbar"><label className="sec-search"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search actor, action, target..." /></label><span className="sec-integrity"><ShieldCheck size={15}/> Audit integrity: <b>Healthy</b></span></div>
  <section className="sec-panel"><div className="sec-table-head sec-audit-head"><span>TIME</span><span>ACTOR</span><span>ACTION</span><span>TARGET</span><span>RESULT</span><span>SEVERITY</span></div>{rows.map(r=><div className="sec-audit-row" key={r.id}><span>{r.time}</span><strong>{r.actor}</strong><span>{r.action}</span><span>{r.target}</span><span>{r.result}</span><span className={"sec-severity "+r.severity.toLowerCase()}>{r.severity}</span></div>)}</section>
 </motion.div>;
}
