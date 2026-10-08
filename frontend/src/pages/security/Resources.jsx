import { motion } from "motion/react";
import { Database,ShieldCheck,ShieldOff,Search,RefreshCw } from "lucide-react";
import { useEffect,useMemo,useState } from "react";
import { api } from "../../api";
export default function Resources(){
 const [resources,setResources]=useState([]); const [query,setQuery]=useState(""); const [busy,setBusy]=useState("");
 const load=()=>api.securityResources().then(setResources).catch(()=>{});
 useEffect(()=>{load()},[]);
 const filtered=useMemo(()=>resources.filter(r=>[r.name,r.type,r.owner,r.sensitivity].join(" ").toLowerCase().includes(query.toLowerCase())),[resources,query]);
 const toggle=async r=>{setBusy(r.id);try{await api.updateSecurityResource(r.id,{protected:!r.protected});await load()}finally{setBusy("")}};
 return <motion.div className="page security-page" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
  <div className="security-page-heading"><div><span className="security-eyebrow">PROTECTED ASSETS</span><h1>Resources</h1><p>Real resource protection state from the backend.</p></div><button className="sec-secondary-button" onClick={load}><RefreshCw size={14}/> Refresh</button></div>
  <div className="sec-toolbar"><label className="sec-search"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search resources..."/></label><span className="sec-toolbar-count">{filtered.length} resources</span></div>
  <section className="sec-resource-grid">{filtered.map(r=><motion.button whileHover={{y:-4}} className="sec-resource-card" key={r.id} onClick={()=>toggle(r)} disabled={busy===r.id}><div className="sec-resource-icon"><Database size={17}/></div><div className="sec-resource-top"><span>{r.type}</span><i className={r.protected?"protected":"unprotected"}>{busy===r.id?"SAVING…":r.protected?"PROTECTED":"OPEN"}</i></div><strong>{r.name}</strong><p>{r.owner} · {r.sensitivity}</p><small>{r.accesses} access events</small></motion.button>)}</section>
 </motion.div>;
}