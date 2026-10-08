const API_BASE_URL=import.meta.env.VITE_API_BASE_URL||"http://localhost:8000";
const AI_SERVICE_URL=import.meta.env.VITE_AI_SERVICE_URL||"http://localhost:8001";
async function request(url,options={}){const r=await fetch(url,{...options,headers:{"Content-Type":"application/json",...(options.headers||{})}});if(!r.ok)throw new Error((await r.text().catch(()=> ""))||("Request failed with "+r.status));return r.json();}
export const api={health:()=>request(API_BASE_URL+"/health"),analyzeBehaviour:(payload)=>request(AI_SERVICE_URL+"/api/v1/analyze",{method:"POST",body:JSON.stringify(payload)})};