import {motion} from "motion/react";
import {Check,X,Eye,Clock3,FileText} from "lucide-react";
import {useState} from "react";
import {api} from "../../api";
const seed=[["ap-1","Q4 Marketing Budget","Sarah Kapoor","Finance","$48,000","Today","PENDING"],["ap-2","Client Contract Renewal","Aarav Sharma","Northwind","$120,000","Today","PENDING"],["ap-3","Design System Update","Meera Iyer","Product","Internal","Yesterday","PENDING"]];
export default function Approvals(){
 const [rows,setRows]=useState(seed);
 const decide=async(id,d)=>{try{await api.decideApproval(id,d)}catch{}setRows(x=>x.map(r=>r[0]===id?[...r,d.toUpperCase()]:r))};
 return <div className="ws-page"><div className="ws-page-heading"><div><span className="ws-eyebrow">WORKSPACE</span><h1>Approvals</h1><p>Review requests waiting for your decision.</p></div></div><section className="ws-panel ws-approval-panel">{rows.map(item=><motion.div className="ws-approval-row" key={item[0]}><div className="ws-approval-name"><div className="ws-document-icon"><FileText size={17}/></div><div><strong>{item[1]}</strong><span>{item[2]}</span></div></div><span>{item[3]}</span><strong>{item[4]}</strong><span className="ws-approval-date"><Clock3 size={13}/>{item[5]}</span><span>{item[6]}</span><div className="ws-approval-actions"><button className="approve" onClick={()=>decide(item[0],"approve")}><Check size={15}/></button><button className="reject" onClick={()=>decide(item[0],"reject")}><X size={15}/></button><button className="view" onClick={()=>alert(item[1]+"\nRequester: "+item[2])}><Eye size={15}/></button></div></motion.div>)}</section></div>;
}