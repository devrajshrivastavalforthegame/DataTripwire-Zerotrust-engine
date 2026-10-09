const API_BASE_URL=import.meta.env.VITE_API_BASE_URL||"http://localhost:8000";
const AI_SERVICE_URL=import.meta.env.VITE_AI_SERVICE_URL||"http://localhost:8001";
export const AUTH_KEY="datatripwire.auth.v1";

async function request(url,options={}){
  const token=localStorage.getItem(AUTH_KEY);
  const headers={"Content-Type":"application/json",...(options.headers||{})};
  if(token) headers.Authorization="Bearer "+token;
  const r=await fetch(url,{...options,headers});
  if(!r.ok){let detail="Request failed with "+r.status;try{const body=await r.json();detail=body.detail?.message||body.detail||body.error?.message||detail}catch{};const e=new Error(detail);e.status=r.status;throw e}
  return r.status===204?null:r.json();
}
export const api={
  health:()=>request(API_BASE_URL+"/health"),
  login:async(payload)=>{const body=await request(API_BASE_URL+"/api/v1/auth/login",{method:"POST",body:JSON.stringify(payload)});localStorage.setItem(AUTH_KEY,body.accessToken);
const user={...body.user,roles:[body.user.role, ...(body.user.role==="security_manager"?["Security Manager"]:body.user.role==="security_analyst"?["Security Analyst"]:[])]};
localStorage.setItem("datatripwire.user.v1",JSON.stringify(user));return {...body,user}},
  me:()=>request(API_BASE_URL+"/api/v1/auth/me"),
  adminUsers:()=>request(API_BASE_URL+"/api/v1/admin/users"),
  adminRoles:()=>request(API_BASE_URL+"/api/v1/admin/roles"),
  logout:()=>{localStorage.removeItem(AUTH_KEY);localStorage.removeItem("datatripwire.user.v1")},
  resources:()=>request(API_BASE_URL+"/api/v1/resources"),
  accessResource:(id,payload)=>request(API_BASE_URL+"/api/v1/resources/"+id+"/access",{method:"POST",body:JSON.stringify(payload)}),
  securityOverview:()=>request(API_BASE_URL+"/api/v1/security/overview"),
  securityActivity:()=>request(API_BASE_URL+"/api/v1/security/activity"),
  securityIncidents:()=>request(API_BASE_URL+"/api/v1/security/incidents"),
  securityAudit:()=>request(API_BASE_URL+"/api/v1/security/audit"),
  securitySessions:()=>request(API_BASE_URL+"/api/v1/security/sessions"),
  securityPolicies:()=>request(API_BASE_URL+"/api/v1/security/policies"),
  securityResources:()=>request(API_BASE_URL+"/api/v1/security/resources"),
  updateSecurityResource:(id,payload)=>request(API_BASE_URL+"/api/v1/security/resources/"+id,{method:"PATCH",body:JSON.stringify(payload)}),
  updateIncident:(id,status)=>request(API_BASE_URL+"/api/v1/security/incidents/"+id,{method:"PATCH",body:JSON.stringify({status})}),
  updateSession:(id,decision)=>request(API_BASE_URL+"/api/v1/security/sessions/"+encodeURIComponent(id),{method:"PATCH",body:JSON.stringify({decision})}),
  updatePolicy:(id,payload)=>request(API_BASE_URL+"/api/v1/security/policies/"+encodeURIComponent(id),{method:"PATCH",body:JSON.stringify(payload)}),
  executeResponse:(id,decision)=>request(API_BASE_URL+"/api/v1/security/responses/"+encodeURIComponent(id),{method:"POST",body:JSON.stringify({decision})}),
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
