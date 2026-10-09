import { motion } from "motion/react";
import { Search, FileText, FileSpreadsheet, FileImage, Clock3, Eye, Download, ShieldAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeading, StatusPill } from "../../components/workshepher/WorkspaceWidgets";
import { api } from "../../api";

function DocumentIcon({ type }) {
  if (type === "XLSX") return <FileSpreadsheet size={19} />;
  if (type === "PNG") return <FileImage size={19} />;
  return <FileText size={19} />;
}

export default function Documents() {
  const [resources,setResources]=useState([]); const [q,setQ]=useState(""); const [filter,setFilter]=useState("All");
  const [busy,setBusy]=useState("");
  const [message,setMessage]=useState("");
  const [result,setResult]=useState(null);
  const [stepUpRequest,setStepUpRequest]=useState(null);
  const [stepUpPassword,setStepUpPassword]=useState("");
  const [stepUpError,setStepUpError]=useState("");
  const [verifyingStepUp,setVerifyingStepUp]=useState(false);

  useEffect(()=>{api.resources().then(x=>setResources(x.resources||x||[])).catch(e=>setMessage(e.message));},[]);
  const docs=useMemo(()=>resources.filter(d=>(filter==="All"||filter==="Protected"&&d.sensitivity!=="PUBLIC"||filter==="Recent")&&[d.name,d.resource_type,d.sensitivity,d.description].join(" ").toLowerCase().includes(q.toLowerCase())),[resources,q,filter]);

  async function access(doc,action){
    if(!doc.id){setMessage("Resource is not initialized yet. Restart the backend after database setup.");return;}
    setBusy(doc.id+action);setMessage("");
    try{
      const response=await api.accessResource(doc.id,{action});
      setResult(response);
      setMessage(response.allowed ? `Access allowed — risk ${response.risk?.score ?? 0}/100` : `Access blocked by continuous trust policy — risk ${response.risk?.score ?? 0}/100`);
    }catch(e){
      setResult(e.body||e);
      if(e.body?.code==="STEP_UP_REQUIRED"){
        setStepUpRequest({doc,action});setStepUpPassword("");setStepUpError("");
        setMessage("Additional identity verification is required for this protected action.");
      }else{
        setMessage(e.body?.error||(e.status===403?"This action is unavailable for your current session.":"We could not complete that action. Please try again."));
      }
    }
    finally{setBusy("");}
  }

  async function verifyStepUp(event){
    event.preventDefault();
    if(!stepUpRequest)return;
    setVerifyingStepUp(true);setStepUpError("");
    try{
      await api.stepUp(stepUpPassword);
      const response=await api.accessResource(stepUpRequest.doc.id,{action:stepUpRequest.action});
      setResult(response);
      setMessage(response.allowed ? `Access allowed — risk ${response.risk?.score ?? 0}/100` : `Access blocked by continuous trust policy — risk ${response.risk?.score ?? 0}/100`);
      setStepUpRequest(null);setStepUpPassword("");
    }catch(e){
      setResult(e.body||e);
      setStepUpError(e.body?.error||e.message||"Verification failed. Please try again.");
      if(e.body?.code && e.body.code!=="STEP_UP_INVALID_CREDENTIALS" && e.body.code!=="STEP_UP_PASSWORD_REQUIRED"){
        setMessage(e.body.error||"The policy still blocks this action.");
      }
    }finally{setVerifyingStepUp(false)}
  }

  return <div className="ws-page">
    <PageHeading eyebrow="WORKSPACE" title="Documents" description="Your organization's protected documents and resources." />
    {message&&<div className={message.includes("allowed")?"ws-success-banner":"ws-login-error"}><ShieldAlert size={16}/>{message}</div>}

    <div className="ws-document-toolbar">
      <div className="ws-search-field"><Search size={17}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search documents and protected resources..." /><kbd>? K</kbd></div>
      <div className="ws-toolbar-filters">{["All","Recent","Protected"].map(x=><button key={x} className={filter===x?"active":""} onClick={()=>setFilter(x)}>{x}</button>)}</div>
    </div>
    <section className="ws-panel ws-documents-panel">
      <div className="ws-document-table-head"><span>Name</span><span>Type</span><span>Sensitivity</span><span>Updated</span><span /></div>
      <div className="ws-document-list">
        {docs.map((doc,index)=><motion.div className="ws-document-row" key={doc.id||doc.name} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:index*.05}}>
          <div className="ws-document-name"><div className="ws-document-icon"><DocumentIcon type={doc.resource_type==="CREDENTIALS"?"PDF":"PDF"}/></div><div><strong>{doc.name}</strong><span>{doc.description||"Protected workspace resource"}</span></div></div>
          <StatusPill>{doc.resource_type}</StatusPill>
          <StatusPill>{doc.sensitivity}</StatusPill>
          <span className="ws-document-updated"><Clock3 size={14}/>Protected resource</span>
          <div style={{display:"flex",gap:8}}>
            <button className="ws-icon-button" title="Open" onClick={()=>access(doc,"OPEN")} disabled={busy===doc.id+"OPEN"}><Eye size={16}/></button>
            <button className="ws-icon-button" title="Download" onClick={()=>access(doc,"DOWNLOAD")} disabled={busy===doc.id+"DOWNLOAD"}><Download size={16}/></button>
          </div>
        </motion.div>)}
      </div>
    </section>
    {stepUpRequest&&<div className="ws-modal-overlay" role="presentation"><form className="ws-modal" onSubmit={verifyStepUp} aria-labelledby="step-up-title">
      <button type="button" className="ws-modal-close" onClick={()=>{setStepUpRequest(null);setStepUpPassword("");setStepUpError("")}} aria-label="Cancel verification">×</button>
      <h2 id="step-up-title">Verify your identity</h2>
      <p>Confirm your password to continue {stepUpRequest.action.toLowerCase()} on <strong>{stepUpRequest.doc.name}</strong>.</p>
      <label>Account password<input autoFocus type="password" autoComplete="current-password" value={stepUpPassword} onChange={e=>setStepUpPassword(e.target.value)} required /></label>
      {stepUpError&&<div className="ws-login-error" role="alert">{stepUpError}</div>}
      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:12}}><button type="button" className="ws-secondary-button" onClick={()=>setStepUpRequest(null)}>Cancel</button><button type="submit" className="ws-primary-button" disabled={verifyingStepUp}>{verifyingStepUp?"Verifying…":"Verify and continue"}</button></div>
    </form></div>}

  </div>;
}