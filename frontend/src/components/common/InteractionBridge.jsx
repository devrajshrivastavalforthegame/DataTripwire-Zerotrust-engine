import {useEffect,useState} from "react";
import {api} from "../../api";
export default function InteractionBridge(){
 const [toast,setToast]=useState("");
 useEffect(()=>{
  const onClick=event=>{
   const button=event.target.closest?.("button");
   if(!button || button.disabled) return;
   const label=(button.getAttribute("aria-label")||button.getAttribute("title")||button.innerText||"button").replace(/\s+/g," ").trim().slice(0,120);
   api.workspaceAction("BUTTON_CLICK",window.location.pathname,{label}).catch(()=>{});
   if(!button.dataset.noToast && !button.classList.contains("ws-send-button")){
    setToast(label+" • action recorded");
    window.clearTimeout(window.__dtToast); window.__dtToast=window.setTimeout(()=>setToast(""),1800);
   }
  };
  document.addEventListener("click",onClick,true);
  return()=>document.removeEventListener("click",onClick,true);
 },[]);
 return toast?<div className="dt-action-toast" role="status">{toast}</div>:null;
}