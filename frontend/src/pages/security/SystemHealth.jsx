import { motion } from "motion/react";
import { Activity, CheckCircle2, Database, Gauge, RefreshCw, Server } from "lucide-react";
import { useState } from "react";

const services=[["Risk Engine","12 ms"],["Behaviour Engine","18 ms"],["Policy Engine","9 ms"],["Redis","2 ms"],["Database","6 ms"],["Audit Service","11 ms"]];
export default function SystemHealth(){
 const [tick,setTick]=useState(0);
 return <motion.div className="page security-page" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
  <div className="security-page-heading"><div><span className="security-eyebrow">INFRASTRUCTURE</span><h1>System Health</h1><p>Operational status across the continuous trust decision pipeline.</p></div><button className="sec-secondary-button" onClick={()=>setTick(x=>x+1)}><RefreshCw size={14}/> Refresh</button></div>
  <div className="sec-health-summary"><div><Activity size={17}/><strong>Operational</strong><span>All services responding</span></div><div><Gauge size={17}/><strong>9.7 ms</strong><span>Average policy latency</span></div><div><Server size={17}/><strong>6 / 6</strong><span>Healthy services</span></div></div>
  <section className="sec-panel"><div className="sec-panel-header"><div><span className="security-eyebrow">SERVICE STATUS</span><h2>Decision infrastructure</h2></div><span className="sec-integrity"><CheckCircle2 size={14}/> Healthy · refresh {tick+1}</span></div>{services.map(([name,lat])=><div className="sec-health-detail" key={name}><div className="sec-health-service"><span><CheckCircle2 size={14}/></span><strong>{name}</strong></div><span>Healthy</span><b>{lat}</b><i><Database size={13}/></i></div>)}</section>
 </motion.div>;
}
