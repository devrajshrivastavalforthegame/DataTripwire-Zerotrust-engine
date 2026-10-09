const API_BASE_URL=import.meta.env.VITE_API_BASE_URL||"http://localhost:3000";
const AI_SERVICE_URL=import.meta.env.VITE_AI_SERVICE_URL||"http://localhost:8000";
export const AUTH_KEY="datatripwire.auth.v1";

let stepUpHandler = null;

export function registerStepUpHandler(handler) {
  stepUpHandler = handler;
  return () => {
    if (stepUpHandler === handler) stepUpHandler = null;
  };
}

async function request(url,options={}, {allowStepUp=true}={}){
  const token=localStorage.getItem(AUTH_KEY);
  const headers={"Content-Type":"application/json",...(options.headers||{})};
  if(token) headers.Authorization="Bearer "+token;
  const r=await fetch(url,{...options,headers});
  if(!r.ok){
    let body=null;
    try{body=await r.json()}catch{}
    if(body?.code==="STEP_UP_REQUIRED" && allowStepUp && stepUpHandler){
      return stepUpHandler(async password=>{
        await request(API_BASE_URL+"/api/v1/auth/step-up",{
          method:"POST",
          body:JSON.stringify({password})
        },{allowStepUp:false});
        return request(url,options,{allowStepUp:false});
      });
    }
    const detail=body?.detail?.message||body?.detail||body?.error?.message||body?.error||`Request failed with ${r.status}`;
    const e=new Error(typeof detail==="string"?detail:`Request failed with ${r.status}`);
    e.status=r.status;e.body=body;throw e;
  }
  return r.status===204?null:r.json();
}
export const api={
  health:()=>request(API_BASE_URL+"/health"),
  login:async(payload)=>{
    const body=await request(API_BASE_URL+"/api/v1/auth/login",{method:"POST",body:JSON.stringify(payload)});
    localStorage.setItem(AUTH_KEY,body.accessToken);
    const raw=String(body.user?.role||"").toLowerCase();
    const labels={security_manager:"Security Manager",security_analyst:"Security Analyst",system_admin:"System Admin",manager:"Manager",employee:"Employee",auditor:"Auditor"};
    const roles=[body.user?.role,labels[raw]].filter(Boolean);
    const user={...body.user,roles:[...new Set(roles)]};
    localStorage.setItem("datatripwire.user.v1",JSON.stringify(user));
    return {...body,user};
  },
  me:()=>request(API_BASE_URL+"/api/v1/auth/me"),
  stepUp:(password)=>request(API_BASE_URL+"/api/v1/auth/step-up",{method:"POST",body:JSON.stringify({password})}),
  logout:()=>{localStorage.removeItem(AUTH_KEY);localStorage.removeItem("datatripwire.user.v1")},
  resources:()=>request(API_BASE_URL+"/api/v1/resources"),
  accessResource:(id,payload)=>request(API_BASE_URL+"/api/v1/resources/"+id+"/access",{method:"POST",body:JSON.stringify(payload)}),
  securityOverview:()=>request(API_BASE_URL+"/api/v1/security/overview"),
  securityExposure:()=>request(API_BASE_URL+"/api/v1/security/data-exposure"),
  securityActivity:()=>request(API_BASE_URL+"/api/v1/security/activity"),
  securityIncidents:async()=>{const x=await request(API_BASE_URL+"/api/v1/security/incidents");return x.incidents||[]},
  resolveIncident:(id)=>request(API_BASE_URL+"/api/v1/security/incidents/"+encodeURIComponent(id)+"/resolve",{method:"POST"}),
  securityAudit:async()=>{const x=await request(API_BASE_URL+"/api/v1/security/audit");return x.audit||[]},
  securitySessions:async()=>{const x=await request(API_BASE_URL+"/api/v1/security/sessions");return x.sessions||[]},
  securityPolicies:()=>request(API_BASE_URL+"/api/v1/security/policies"),
  securityResponses:async()=>{const x=await request(API_BASE_URL+"/api/v1/security/responses");return x.responses||[]},
  securityResources:async()=>{const x=await request(API_BASE_URL+"/api/v1/security/resources");return x.resources||[]},
  usersRisk:async()=>{const x=await request(API_BASE_URL+"/api/v1/security/users-risk");return x.users||[]},
  rbac:()=>request(API_BASE_URL+"/api/v1/rbac"),
  toggleRolePermission:(roleId,permissionId)=>request(API_BASE_URL+"/api/v1/rbac/roles/"+encodeURIComponent(roleId)+"/permissions/"+encodeURIComponent(permissionId)+"/toggle",{method:"POST"}),
  updateSecurityResource:(id,payload)=>request(API_BASE_URL+"/api/v1/security/resources/"+id,{method:"PATCH",body:JSON.stringify(payload)}),
  restrictSession:(id,reason)=>request(API_BASE_URL+"/api/v1/security/sessions/"+encodeURIComponent(id)+"/restrict",{method:"POST",body:JSON.stringify({reason})}),
  quarantineSession:(id,reason)=>request(API_BASE_URL+"/api/v1/security/sessions/"+encodeURIComponent(id)+"/quarantine",{method:"POST",body:JSON.stringify({reason})}),
  releaseSession:(id,reason)=>request(API_BASE_URL+"/api/v1/security/sessions/"+encodeURIComponent(id)+"/release",{method:"POST",body:JSON.stringify({reason})}),
  sessionTimeline:(id)=>request(API_BASE_URL+"/api/v1/security/sessions/"+encodeURIComponent(id)+"/timeline"),
  workspaceState:()=>request(API_BASE_URL+"/api/v1/workspace/state"),
  workspaceStateUpdate:(data)=>request(API_BASE_URL+"/api/v1/workspace/state",{method:"PUT",body:JSON.stringify({data})}),
  workspaceTeam:()=>request(API_BASE_URL+"/api/v1/workspace/team"),
  workspaceReports:()=>request(API_BASE_URL+"/api/v1/workspace/reports"),
  workspaceAction:(action,target,metadata={})=>request(API_BASE_URL+"/api/v1/workspace/actions",{method:"POST",body:JSON.stringify({action,target,metadata})}),
  createTask:(payload)=>request(API_BASE_URL+"/api/v1/workspace/tasks",{method:"POST",body:JSON.stringify(payload)}),
  createProject:(payload)=>request(API_BASE_URL+"/api/v1/workspace/projects",{method:"POST",body:JSON.stringify(payload)}),
  updateTask:(id,payload)=>request(API_BASE_URL+"/api/v1/workspace/tasks/"+encodeURIComponent(id),{method:"PATCH",body:JSON.stringify(payload)}),
  sendMessage:(payload)=>request(API_BASE_URL+"/api/v1/workspace/messages",{method:"POST",body:JSON.stringify(payload)}),
  decideApproval:(id,decision)=>request(API_BASE_URL+"/api/v1/workspace/approvals/"+encodeURIComponent(id)+"/"+decision,{method:"POST"}),
  createCalendarEvent:(payload)=>request(API_BASE_URL+"/api/v1/workspace/calendar/events",{method:"POST",body:JSON.stringify(payload)}),
  updateProfile:(payload)=>request(API_BASE_URL+"/api/v1/workspace/profile",{method:"PUT",body:JSON.stringify(payload)}),
  updateWorkspaceSettings:(payload)=>request(API_BASE_URL+"/api/v1/workspace/settings",{method:"PUT",body:JSON.stringify(payload)}),
  analyzeBehaviour:(payload)=>request(AI_SERVICE_URL+"/api/v1/analyze",{method:"POST",body:JSON.stringify(payload)})
};