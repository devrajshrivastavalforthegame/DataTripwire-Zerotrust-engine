import { Navigate,useLocation } from "react-router-dom";
import { AUTH_KEY } from "../api";

const SECURITY_ROLES=["security_manager","security_analyst","system_admin","auditor","security manager","security analyst","system admin","auditor"];

export default function AuthGate({security=false,children}){
  const location=useLocation();
  const token=localStorage.getItem(AUTH_KEY);
  if(!token) return <Navigate to="/login" replace state={{from:location.pathname}} />;
  if(security){
    try{
      const user=JSON.parse(localStorage.getItem("datatripwire.user.v1")||"null");
      const values=[user?.role,...(Array.isArray(user?.roles)?user.roles:[])].filter(Boolean).map(v=>String(v).toLowerCase());
      const allowed=values.some(v=>SECURITY_ROLES.includes(v));
      if(!allowed) return <Navigate to="/" replace />;
    }catch{return <Navigate to="/" replace />}
  }
  return children;
}