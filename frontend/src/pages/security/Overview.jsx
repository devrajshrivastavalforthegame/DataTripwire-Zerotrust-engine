import { motion } from "motion/react";
import { Users,Radio,AlertTriangle,LockKeyhole,Activity,ShieldCheck,RefreshCw } from "lucide-react";
import { useEffect,useState } from "react";
import { api } from "../../api";

function Metric({label,value,Icon}){return <motion.div className="sec-metric" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}><div className="sec-metric-icon"><Icon size={17}/></div><strong>{value}</strong><span>{label}</span></motion.div>}
export default function Overview(){
 const [data,setData]=useState(null),[activity,setActivity]=useState([]),[exposure,setExposure]=useState(null),[exposureError,setExposureError]=useState("");
 const load=async()=>{try{const [o,a]=await Promise.all([api.securityOverview(),api.securityActivity()]);setData(o);setActivity(a.activity||[]);try{setExposure(await api.securityExposure());setExposureError("")}catch(e){setExposureError(e.message||"Exposure analytics unavailable")}}catch(e){console.error(e)}};
 useEffect(()=>{load();const t=setInterval(load,5000);return()=>clearInterval(t)},[]);
 const m=data?.metrics||{};
 const trust=data?.continuousTrust||{};
 return <div className="sec-page">
  <div className="sec-page-heading"><div><span className="sec-eyebrow">SECURITY CONSOLE</span><h1>Security Overview</h1><p>Continuous visibility into identity, behaviour, trust and adaptive access.</p></div><button className="sec-secondary-button" onClick={load}><RefreshCw size={14}/>Live refresh</button></div>
  <div className="sec-metrics-grid">{[["Active Users",m.activeUsers||0,Users],["Active Sessions",m.activeSessions||0,Radio],["High-Risk Users",m.highRiskUsers||0,AlertTriangle],["Restricted Sessions",m.restrictedSessions||0,LockKeyhole],["Policy Decisions",m.policyDecisions||0,Activity],["System",data?.systemStatus||"—",ShieldCheck]].map(([l,v,I])=><Metric key={l} label={l} value={v} Icon={I}/>)}</div>
  <div className="sec-overview-grid">
   <section className="sec-panel sec-trust-panel"><div className="sec-panel-header"><div><span className="sec-section-label">CONTINUOUS TRUST</span><h2>Current trust state</h2></div><span className="sec-live-dot">LIVE</span></div>
    <div className="sec-trust-body"><div className="sec-trust-ring"><div><strong>{Math.max(0,100-(trust.riskScore||0))}</strong><span>TRUST</span></div></div><div className="sec-trust-copy"><div className="sec-trust-status"><span/>{trust.state||"TRUSTED"}</div><h3>Every active session is re-evaluated.</h3><p>The latest decision is <strong>{trust.latestDecision||"ALLOW"}</strong> with risk score <strong>{trust.riskScore||0}</strong>.</p><div className="sec-mini-factors"><div><span>STS</span><strong>{trust.stsScore??100}</strong></div><div><span>ATS</span><strong>{trust.atsScore??0}</strong></div><div><span>Decision</span><strong>{trust.latestDecision||"ALLOW"}</strong></div></div></div></div>
   </section>
   <section className="sec-panel"><div className="sec-panel-header"><div><span className="sec-section-label">RECENT ACTIVITY</span><h2>Latest decisions</h2></div></div><div className="sec-event-table"><div className="sec-event-head"><span>USER</span><span>ACTION</span><span>RISK</span><span>DECISION</span><span>TIME</span></div>{activity.slice(0,6).map(e=><div className="sec-event-row" key={e.id}><strong>{e.username||e.email}</strong><span>{e.action||e.event_type}<small>{e.resource||"—"}</small></span><div className={"sec-risk-number "+(Number(e.risk_score)>=80?"high":Number(e.risk_score)>=50?"medium":"low")}>{e.risk_score??0}</div><span className={"sec-decision "+String(e.decision||"ALLOW").toLowerCase()}>{e.decision||"ALLOW"}</span><time>{new Date(e.created_at).toLocaleTimeString()}</time></div>)}</div></section>
  </div>
  <section className="sec-panel">
   <div className="sec-panel-header"><div><span className="sec-section-label">DATA EXPOSURE</span><h2>Cumulative exposure risk</h2></div><span className="sec-live-dot">30 DAYS</span></div>
   {exposureError?<div className="sec-empty-state"><strong>Exposure analytics unavailable</strong><span>{exposureError}</span></div>:<div className="sec-detail-grid">
    <div className="sec-detail-block"><span>DATA BREACH RISK</span><strong>{exposure?.overall?.score ?? "—"}{exposure?.overall?.score != null ? "/100" : ""}</strong></div>
    <div className="sec-detail-block"><span>RISK LEVEL</span><strong>{exposure?.overall?.level ?? "Loading"}</strong></div>
    <div className="sec-detail-block"><span>30-DAY EVENTS</span><strong>{exposure?.windows?.days30?.eventCount ?? "—"}</strong></div>
    <div className="sec-detail-block"><span>MEASURED TRANSFER</span><strong>{exposure?.windows?.days30?.totalBytes == null ? "Not measured" : exposure.windows.days30.totalBytes.toLocaleString()+" bytes"+(exposure.windows.days30.unmeasuredByteEvents>0?" (partial)":"")}</strong></div>
   </div>}
   <p className="sec-muted-note">Exposure scores are deterministic prototype indicators. Transfer volume is shown only when measured by the application.</p>
  </section>
  <section className="sec-panel"><div className="sec-panel-header"><div><span className="sec-section-label">DECISION PIPELINE</span><h2>Continuous enforcement</h2></div></div><div className="sec-flow">{[["01","Authenticated","Identity established"],["02","Evaluated","Behaviour analysed"],["03","Risk Score","Trust recalculated"],["04","Policy Decision","Deterministic policy"],["05","Response","Access adapted"],["06","Audit","Evidence recorded"]].map((s,i)=><div className="sec-flow-step" key={s[1]}><div className="sec-flow-number">{s[0]}</div><div><strong>{s[1]}</strong><span>{s[2]}</span></div>{i<5&&<i/>}</div>)}</div></section>
 </div>
}