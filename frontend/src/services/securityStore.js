import { useSyncExternalStore } from "react";
import { api } from "../api";

const STORAGE_KEY = "datatripwire.security.console.v1";

const seed = {
  resources: [
    { id:"res-fin", name:"Financial Report", type:"Report", sensitivity:"Confidential", owner:"Finance", protection:true, accesses:184, lastAccess:"02:13" },
    { id:"res-hr", name:"HR Records", type:"Records", sensitivity:"Restricted", owner:"People Ops", protection:true, accesses:96, lastAccess:"02:13" },
    { id:"res-pay", name:"Payroll Sheet", type:"Spreadsheet", sensitivity:"Restricted", owner:"Finance", protection:true, accesses:73, lastAccess:"10:51" },
    { id:"res-road", name:"Product Roadmap", type:"Document", sensitivity:"Internal", owner:"Product", protection:true, accesses:241, lastAccess:"10:55" }
  ],
  incidents: [
    { id:"inc-30417", title:"Suspicious financial download", severity:"High", user:"Aarav Sharma", risk:87, status:"Investigating", trigger:"New device + request burst", resource:"Financial Report", time:"02:13" },
    { id:"inc-30418", title:"Restricted HR share attempt", severity:"Critical", user:"Aarav Sharma", risk:91, status:"Contained", trigger:"New device + restricted resource", resource:"HR Records", time:"02:13" },
    { id:"inc-30412", title:"Unusual payroll access", severity:"Medium", user:"Rohan Das", risk:52, status:"Awaiting verification", trigger:"Unusual login time", resource:"Payroll Sheet", time:"10:51" }
  ],
  policies: [
    { id:"pol-001", name:"High Risk Containment", effect:"RESTRICT", threshold:70, scope:"Confidential + Restricted", enabled:true, version:4 },
    { id:"pol-002", name:"Critical Session Quarantine", effect:"BLOCK", threshold:85, scope:"Restricted resources", enabled:true, version:3 },
    { id:"pol-003", name:"Step-up Verification", effect:"VERIFY", threshold:50, scope:"Sensitive actions", enabled:true, version:6 },
    { id:"pol-004", name:"Normal Baseline Access", effect:"ALLOW", threshold:0, scope:"Internal resources", enabled:true, version:8 }
  ],
  roles: [
    { id:"role-analyst", name:"Security Analyst", users:8, permissions:{overview:true, users:true, resources:true, incidents:true, policies:false, rbac:false, audit:true, response:true} },
    { id:"role-manager", name:"Security Manager", users:3, permissions:{overview:true, users:true, resources:true, incidents:true, policies:true, rbac:true, audit:true, response:true} },
    { id:"role-auditor", name:"Auditor", users:4, permissions:{overview:true, users:false, resources:true, incidents:true, policies:false, rbac:false, audit:true, response:false} }
  ],
  audit: [
    { id:"evt-30417", time:"02:13:04", actor:"DataTripwire Engine", action:"RESTRICT", target:"Aarav Sharma / Financial Report", result:"Enforced", severity:"High" },
    { id:"evt-30418", time:"02:13:41", actor:"DataTripwire Engine", action:"BLOCK", target:"Aarav Sharma / HR Records", result:"Enforced", severity:"Critical" },
    { id:"evt-30402", time:"10:44:02", actor:"Meera Iyer", action:"VIEW", target:"Project Plan", result:"Allowed", severity:"Low" },
    { id:"evt-30398", time:"10:42:18", actor:"Aarav Sharma", action:"VIEW", target:"Financial Report", result:"Allowed", severity:"Low" }
  ],
  responses: [
    { id:"resp-1", user:"Aarav Sharma", trigger:"New device + request burst", risk:87, resource:"Financial Report", decision:"RESTRICT", time:"02:13", status:"Enforced" },
    { id:"resp-2", user:"Rohan Das", trigger:"Unusual time", risk:52, resource:"Payroll Sheet", decision:"VERIFY", time:"10:51", status:"Awaiting user" },
    { id:"resp-3", user:"Neha Kapoor", trigger:"Normal baseline", risk:14, resource:"Roadmap", decision:"ALLOW", time:"10:55", status:"Monitoring" }
  ],
  settings:{continuousEvaluation:true,highRiskAlerts:true,auditLogging:true,stepUpVerification:true,automaticContainment:true,verifyThreshold:50,restrictThreshold:70,blockThreshold:85}
};

function load(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    return raw ? {...seed,...JSON.parse(raw)} : structuredClone(seed);
  }catch{return structuredClone(seed);}
}
let state=load();
const listeners=new Set();
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));listeners.forEach(fn=>fn());}
function mutate(fn){state=fn(state);save();return state;}

export const securityStore={
  getState:()=>state,
  subscribe:(fn)=>{listeners.add(fn);return()=>listeners.delete(fn);},
  reset:()=>mutate(()=>structuredClone(seed)),
  toggleResource:(id)=>{const current=state.resources.find(r=>r.id===id); if(current) api.updateSecurityResource(id,{protected:!current.protection}).catch(()=>{}); return mutate(s=>({...s,resources:s.resources.map(r=>r.id===id?{...r,protection:!r.protection}:r)}));},
  updateIncident:(id,status)=>{api.updateIncident(id,status).catch(()=>{});return mutate(s=>({...s,incidents:s.incidents.map(i=>i.id===id?{...i,status}:i)}));},
  togglePolicy:(id)=>{const p=state.policies.find(x=>x.id===id);if(p)api.updatePolicy(p.id,{enabled:!p.enabled}).catch(()=>{});return mutate(s=>({...s,policies:s.policies.map(p=>p.id===id?{...p,enabled:!p.enabled,version:p.version+1}:p)}));},
  updatePermission:(roleId,key)=>mutate(s=>({...s,roles:s.roles.map(r=>r.id===roleId?{...r,permissions:{...r.permissions,[key]:!r.permissions[key]}}:r)})),
  executeResponse:(id,decision)=>{const response=state.responses.find(r=>r.id===id);if(response)api.executeResponse(response.session_id||response.id,decision).catch(()=>{});return mutate(s=>{
    const response=s.responses.find(r=>r.id===id);
    if(!response)return s;
    const status=decision==="BLOCK"||decision==="RESTRICT"?"Enforced":decision==="VERIFY"?"Awaiting user":"Monitoring";
    const severity=decision==="BLOCK"?"Critical":decision==="RESTRICT"?"High":"Low";
    const eventId="evt-"+Date.now();
    return {...s,
      responses:s.responses.map(r=>r.id===id?{...r,decision,status}:r),
      audit:[{id:eventId,time:new Date().toLocaleTimeString([], {hour12:false}),actor:"Security Manager",action:decision,target:response.user+" / "+response.resource,result:status,severity},...s.audit].slice(0,50)
    };
  });},
  updateSetting:(key,value)=>mutate(s=>({...s,settings:{...s.settings,[key]:value}}))
};

export function useSecurityStore(selector=s=>s){
  const snapshot=useSyncExternalStore(securityStore.subscribe,securityStore.getState,securityStore.getState);
  return selector(snapshot);
}

export function downloadAuditCsv(rows){
  const header="Time,Actor,Action,Target,Result,Severity";
  const body=rows.map(r=>[r.time,r.actor,r.action,r.target,r.result,r.severity].map(v=>'"'+String(v).replaceAll('"','""')+'"').join(",")).join("\\n");
  const blob=new Blob([header+"\\n"+body],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download="datatripwire-audit-log.csv";a.click();URL.revokeObjectURL(url);
}
