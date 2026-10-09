const API_BASE_URL=import.meta.env.VITE_API_BASE_URL||"http://localhost:3000";
const AI_SERVICE_URL=import.meta.env.VITE_AI_SERVICE_URL||"http://localhost:8000";
export const AUTH_KEY="datatripwire.auth.v1";

async function request(url,options={}){
  const token=localStorage.getItem(AUTH_KEY);
  const headers={"Content-Type":"application/json",...(options.headers||{})};
  if(token) headers.Authorization="Bearer "+token;
  const r=await fetch(url,{...options,headers});
  if(!r.ok){
    let body=null;
    try{body=await r.json()}catch{}
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
  logout:()=>{localStorage.removeItem(AUTH_KEY);localStorage.removeItem("datatripwire.user.v1")},
  resources:()=>request(API_BASE_URL+"/api/v1/resources"),
  accessResource:(id,payload)=>request(API_BASE_URL+"/api/v1/resources/"+id+"/access",{method:"POST",body:JSON.stringify(payload)}),
  securityOverview:()=>request(API_BASE_URL+"/api/v1/security/overview"),
  securityActivity:()=>request(API_BASE_URL+"/api/v1/security/activity"),
  securityIncidents:async()=>{const x=await request(API_BASE_URL+"/api/v1/security/incidents");return x.incidents||[]},
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
  workspaceAction:(action,target,metadata={})=>request(API_BASE_URL+"/api/v1/workspace/actions",{method:"POST",body:JSON.stringify({action,target,metadata})}),
  createTask:(payload)=>request(API_BASE_URL+"/api/v1/workspace/tasks",{method:"POST",body:JSON.stringify(payload)}),
  updateTask:(id,payload)=>request(API_BASE_URL+"/api/v1/workspace/tasks/"+encodeURIComponent(id),{method:"PATCH",body:JSON.stringify(payload)}),
  sendMessage:(payload)=>request(API_BASE_URL+"/api/v1/workspace/messages",{method:"POST",body:JSON.stringify(payload)}),
  decideApproval:(id,decision)=>request(API_BASE_URL+"/api/v1/workspace/approvals/"+encodeURIComponent(id)+"/"+decision,{method:"POST"}),
  updateProfile:(payload)=>request(API_BASE_URL+"/api/v1/workspace/profile",{method:"PUT",body:JSON.stringify(payload)}),
  updateWorkspaceSettings:(payload)=>request(API_BASE_URL+"/api/v1/workspace/settings",{method:"PUT",body:JSON.stringify(payload)}),
  analyzeBehaviour:(payload)=>request(AI_SERVICE_URL+"/api/v1/analyze",{method:"POST",body:JSON.stringify(payload)})
};