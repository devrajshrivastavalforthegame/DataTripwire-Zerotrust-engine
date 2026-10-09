import { Navigate,useLocation } from "react-router-dom";
import { AUTH_KEY } from "../api";

const SECURITY_ROLES=["security_manager","security_analyst","system_admin","auditor","security manager","security analyst","system admin","auditor"];

function tokenUser(){
  try{
    const token=localStorage.getItem(AUTH_KEY);
    if(!token)return null;
    const part=token.split(".")[1];
    if(!part)return null;
    const payload=JSON.parse(atob(part.replace(/-/g,"+").replace(/_/g,"/")));
    return payload;
  }catch{return null}
}

function hasSecurityRole(user){
  const values=[
    user?.role,
    ...(Array.isArray(user?.roles)?user.roles:[]),
    tokenUser()?.role
  ].filter(Boolean).map(v=>String(v).toLowerCase().trim());
  return values.some(v=>SECURITY_ROLES.includes(v));
}

export default function AuthGate({security=false,children}){
  const location=useLocation();
  const token=localStorage.getItem(AUTH_KEY);

  if(!token) return <Navigate to="/login" replace state={{from:location.pathname}} />;

  if(security){
    let user=null;
    try{user=JSON.parse(localStorage.getItem("datatripwire.user.v1")||"null")}catch{}
    if(!hasSecurityRole(user)) return <Navigate to="/" replace />;
  }

  return children;
}