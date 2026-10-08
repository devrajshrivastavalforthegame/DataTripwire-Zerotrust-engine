import { motion } from "motion/react";
import { Shield, Check, X } from "lucide-react";
import { useState } from "react";
import { securityStore, useSecurityStore } from "../../services/securityStore";

const keys=[["overview","Overview"],["users","Users & Risk"],["resources","Resources"],["incidents","Incidents"],["policies","Policy Engine"],["rbac","RBAC"],["audit","Audit Logs"],["response","Adaptive Response"]];
export default function RBAC(){
 const roles=useSecurityStore(s=>s.roles);
 const updatePermission=useSecurityStore(()=>securityStore.updatePermission);
 const [selected,setSelected]=useState(roles[0]?.id);
 const role=roles.find(r=>r.id===selected)||roles[0];
 return <motion.div className="page security-page" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
  <div className="security-page-heading"><div><span className="security-eyebrow">ACCESS GOVERNANCE</span><h1>RBAC</h1><p>Manage effective permissions by security responsibility.</p></div></div>
  <div className="sec-rbac-layout"><section className="sec-panel sec-role-list"><div className="sec-panel-header"><div><span className="security-eyebrow">ROLES</span><h2>Security roles</h2></div></div>{roles.map(r=><button className={selected===r.id?"selected":""} key={r.id} onClick={()=>setSelected(r.id)}><Shield size={16}/><div><strong>{r.name}</strong><small>{r.users} assigned users</small></div></button>)}</section>
  {role&&<section className="sec-panel"><div className="sec-panel-header"><div><span className="security-eyebrow">EFFECTIVE PERMISSIONS</span><h2>{role.name}</h2></div><span className="sec-live-badge">{role.users} users</span></div><div className="sec-permission-grid">{keys.map(([key,label])=><button key={key} className={role.permissions[key]?"granted":""} onClick={()=>updatePermission(role.id,key)}><span>{role.permissions[key]?<Check size={14}/>:<X size={14}/>}</span><strong>{label}</strong><small>{role.permissions[key]?"Granted":"Denied"}</small></button>)}</div></section>}
  </div>
 </motion.div>;
}
