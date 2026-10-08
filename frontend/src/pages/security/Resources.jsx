import { motion } from "motion/react";
import { Database, ShieldCheck, ShieldOff, Search, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { securityStore, useSecurityStore } from "../../services/securityStore";

export default function Resources(){
 const resources=useSecurityStore(s=>s.resources);
 const toggleResource=useSecurityStore(()=>securityStore.toggleResource);
 const [query,setQuery]=useState("");
 const filtered=useMemo(()=>resources.filter(r=>[r.name,r.type,r.owner,r.sensitivity].join(" ").toLowerCase().includes(query.toLowerCase())),[resources,query]);
 return <motion.div className="page security-page" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
  <div className="security-page-heading"><div><span className="security-eyebrow">PROTECTED ASSETS</span><h1>Resources</h1><p>Control sensitivity, protection state and access posture for business resources.</p></div><button className="sec-secondary-button" onClick={()=>setQuery("")}><RefreshCw size={14}/> Reset</button></div>
  <div className="sec-toolbar"><label className="sec-search"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search resources..." /></label><span className="sec-toolbar-count">{filtered.length} resources</span></div>
  <section className="sec-resource-grid">{filtered.map(r=><motion.button whileHover={{y:-4}} className="sec-resource-card" key={r.id} onClick={()=>toggleResource(r.id)}><div className="sec-resource-icon"><Database size={17}/></div><div className="sec-resource-top"><span>{r.type}</span><i className={r.protection?"protected":"unprotected"}>{r.protection?"PROTECTED":"OPEN"}</i></div><strong>{r.name}</strong><p>{r.owner} · {r.sensitivity}</p><small>{r.accesses} access events · Last {r.lastAccess}</small></motion.button>)}</section>
  <section className="sec-panel sec-resource-table"><div className="sec-panel-header"><div><span className="security-eyebrow">ACCESS ACTIVITY</span><h2>Recent resource access</h2></div></div><div className="sec-table-head"><span>RESOURCE</span><span>SENSITIVITY</span><span>OWNER</span><span>ACCESS</span><span>PROTECTION</span></div>{filtered.map(r=><div className="sec-resource-row" key={r.id}><strong><Database size={15}/>{r.name}</strong><span>{r.sensitivity}</span><span>{r.owner}</span><span>{r.accesses}</span><span className={r.protection?"sec-status-on":"sec-status-off"}>{r.protection?<ShieldCheck size={14}/>:<ShieldOff size={14}/>} {r.protection?"Protected":"Open"}</span></div>)}</section>
 </motion.div>;
}
