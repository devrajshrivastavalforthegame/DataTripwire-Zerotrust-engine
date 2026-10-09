import {motion} from "motion/react";
import {Shield,Check,X,RefreshCw,Users,KeyRound} from "lucide-react";
import {useEffect,useMemo,useState} from "react";
import {api} from "../../api";

const keys=[
  ["overview","Overview"],
  ["users","Users & Risk"],
  ["resources","Resources"],
  ["incidents","Incidents"],
  ["policies","Policy Engine"],
  ["rbac","RBAC"],
  ["audit","Audit Logs"],
  ["response","Adaptive Response"]
];

export default function RBAC(){
  const [data,setData]=useState(null),[selected,setSelected]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState("");
  const load=async()=>{try{setError("");setData(await api.rbac())}catch(e){setError(e.message)}};
  useEffect(()=>{load()},[]);
  const role=data?.roles?.find(r=>String(r.id)===String(selected))||data?.roles?.[0];
  const rolePermissions=useMemo(()=>new Set((data?.rolePermissions||[]).filter(x=>String(x.role_id)===String(role?.id)).map(x=>x.permission_id)),[data,role]);
  const assignments=useMemo(()=>data?.assignments?.filter(x=>String(x.role_id)===String(role?.id))||[],[data,role]);

  const permissionGroups=useMemo(()=>keys.map(([resource,label])=>{
    const items=(data?.permissions||[]).filter(p=>p.resource===resource);
    return {resource,label,items,granted:items.length>0&&items.every(p=>rolePermissions.has(p.id))};
  }),[data,rolePermissions]);

  const toggle=async(group)=>{
    if(!role||!group.items.length)return;
    setBusy(group.resource);
    try{
      const shouldGrant=!group.granted;
      for(const p of group.items){
        const has=rolePermissions.has(p.id);
        if(has!==shouldGrant) await api.toggleRolePermission(role.id,p.id);
      }
      await load();
    }catch(e){setError(e.message)}finally{setBusy("")}
  };

  return <motion.div className="page security-page" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
    <div className="security-page-heading">
      <div><span className="security-eyebrow">ACCESS GOVERNANCE</span><h1>RBAC</h1><p>Manage effective permissions by security responsibility.</p></div>
      <button className="sec-secondary-button" onClick={load}><RefreshCw size={14}/> Refresh</button>
    </div>
    {error&&<div className="sec-empty-state"><strong>RBAC action unavailable</strong><span>{error}</span></div>}
    <div className="sec-rbac-layout">
      <section className="sec-panel sec-role-list">
        <div className="sec-panel-header"><div><span className="security-eyebrow">ROLES</span><h2>Security roles</h2></div><KeyRound size={17}/></div>
        {(data?.roles||[]).map(r=><button className={String(role?.id)===String(r.id)?"selected":""} key={r.id} onClick={()=>setSelected(r.id)}>
          <Shield size={16}/><div><strong>{r.name}</strong><small>{data?.assignments?.filter(a=>String(a.role_id)===String(r.id)).length||0} assigned users</small></div>
        </button>)}
      </section>
      {role&&<section className="sec-panel">
        <div className="sec-panel-header">
          <div><span className="security-eyebrow">EFFECTIVE PERMISSIONS</span><h2>{role.name}</h2></div>
          <span className="sec-live-badge"><Users size={13}/> {assignments.length} users</span>
        </div>
        <div className="sec-permission-grid sec-rbac-legacy-grid">
          {permissionGroups.map(g=><button key={g.resource} className={"sec-rbac-permission "+(g.granted?"granted":"denied")} onClick={()=>toggle(g)} disabled={busy===g.resource||!g.items.length}>
            <span>{g.granted?<Check size={14}/>:<X size={14}/>}</span>
            <strong>{g.label}</strong>
            <small>{busy===g.resource?"Updating…":g.granted?"Granted":"Denied"}</small>
          </button>)}
        </div>
      </section>}
    </div>
  </motion.div>;
}
