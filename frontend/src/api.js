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
  login:async(payload)=>{const body=await request(API_BASE_URL+"/api/v1/auth/login",{method:"POST",body:JSON.stringify(payload)});localStorage.setItem(AUTH_KEY,body.access_token);localStorage.setItem("datatripwire.user.v1",JSON.stringify(body.user));return body},
  me:()=>request(API_BASE_URL+"/api/v1/auth/me"),
  logout:()=>{localStorage.removeItem(AUTH_KEY);localStorage.removeItem("datatripwire.user.v1")},
  resources:()=>request(API_BASE_URL+"/api/v1/resources"),
  accessResource:(id,payload)=>request(API_BASE_URL+"/api/v1/resources/"+id+"/access",{method:"POST",body:JSON.stringify(payload)}),
  securityOverview:()=>request(API_BASE_URL+"/api/v1/security/overview"),
  securityActivity:()=>request(API_BASE_URL+"/api/v1/security/activity"),
  securityIncidents:()=>request(API_BASE_URL+"/api/v1/security/incidents"),
  securityAudit:()=>request(API_BASE_URL+"/api/v1/security/audit"),
  securitySessions:()=>request(API_BASE_URL+"/api/v1/security/sessions"),
  securityPolicies:()=>request(API_BASE_URL+"/api/v1/security/policies"),
  analyzeBehaviour:(payload)=>request(AI_SERVICE_URL+"/api/v1/analyze",{method:"POST",body:JSON.stringify(payload)})
};
