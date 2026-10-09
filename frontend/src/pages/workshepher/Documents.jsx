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
  const [resources,setResources]=useState([]);
  const [busy,setBusy]=useState("");
  const [message,setMessage]=useState("");
  const [result,setResult]=useState(null);

  useEffect(()=>{api.resources().then(x=>setResources(x.resources||x||[])).catch(e=>setMessage(e.message));},[]);
  const docs=useMemo(()=>resources,[resources]);

  async function access(doc,action){
    if(!doc.id){setMessage("Resource is not initialized yet. Restart the backend after database setup.");return;}
    setBusy(doc.id+action);setMessage("");
    try{
      const response=await api.accessResource(doc.id,{action});
      setResult(response);
      setMessage(response.allowed ? `Access allowed — risk ${response.risk?.score ?? 0}/100` : `Access blocked by continuous trust policy — risk ${response.risk?.score ?? 0}/100`);
    }catch(e){setMessage(e.status===403?"This action is temporarily unavailable for your current session.":"We could not complete that action. Please try again.");setResult(e.body||e);}
    finally{setBusy("");}
  }

  return <div className="ws-page">
    <PageHeading eyebrow="WORKSPACE" title="Documents" description="Your organization's protected documents and resources." />
    {message&&<div className={message.includes("allowed")?"ws-success-banner":"ws-login-error"}><ShieldAlert size={16}/>{message}</div>}

    <div className="ws-document-toolbar">
      <div className="ws-search-field"><Search size={17}/><input placeholder="Search documents and protected resources..." /><kbd>? K</kbd></div>
      <div className="ws-toolbar-filters"><button className="active">All</button><button>Recent</button><button>Protected</button></div>
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
  </div>;
}