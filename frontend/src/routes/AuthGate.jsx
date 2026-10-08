import { Navigate,useLocation } from "react-router-dom";
import { AUTH_KEY } from "../api";

export default function AuthGate({security=false,children}){
  const location=useLocation();
  const token=localStorage.getItem(AUTH_KEY);
  if(!token) return <Navigate to="/login" replace state={{from:location.pathname}} />;
  if(security){
    try{
      const user=JSON.parse(localStorage.getItem("datatripwire.user.v1")||"null");
      const allowed=user?.roles?.some(r=>["Security Manager","Security Analyst","Auditor"].includes(r));
      if(!allowed) return <Navigate to="/" replace />;
    }catch{return <Navigate to="/" replace />}
  }
  return children;
}
