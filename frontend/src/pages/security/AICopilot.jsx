import { motion } from "motion/react";
import { Bot, Send, Sparkles } from "lucide-react";
import { useState } from "react";
import { useSecurityStore } from "../../services/securityStore";

function answer(q,state){
 const x=q.toLowerCase();
 if(x.includes("high risk")) return "There are "+state.incidents.filter(i=>i.risk>=70).length+" incidents at high or critical risk. Aarav Sharma's financial-resource activity is currently risk 87.";
 if(x.includes("policy")) return "The enabled policy chain evaluates VERIFY at 50, RESTRICT at 70 and BLOCK at 85. Changes are reflected immediately in the console.";
 if(x.includes("resource")) return state.resources.filter(r=>r.protection).length+" of "+state.resources.length+" resources are protected. Restricted resources include HR Records and Payroll Sheet.";
 if(x.includes("incident")) return "There are "+state.incidents.length+" tracked incidents. Critical and high severity events should be investigated before resolution.";
 return "I can summarize current risk, incidents, protected resources and policy posture. Try asking about high risk, policies, resources or incidents.";
}
export default function AICopilot(){
 const state=useSecurityStore(s=>s);
 const [q,setQ]=useState("");
 const [messages,setMessages]=useState([{from:"ai",text:"Security Copilot is ready. Ask about current risk, incidents, resources or policies."}]);
 const suggestions=["What is high risk?","Show policy posture","How many resources are protected?"];
 const send=(text=q)=>{if(!text.trim())return;setMessages(m=>[...m,{from:"user",text},{from:"ai",text:answer(text,state)}]);setQ("")};
 return <motion.div className="page security-page" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
  <div className="security-page-heading"><div><span className="security-eyebrow">ANALYST ASSISTANCE</span><h1>AI Security Copilot</h1><p>Explain and summarize security state. The copilot does not authorize or enforce access.</p></div><span className="sec-live-badge"><Sparkles size={13}/> ANALYSIS ONLY</span></div>
  <section className="sec-copilot"><div className="sec-copilot-header"><Bot size={18}/><div><strong>DataTripwire Copilot</strong><span>Grounded in current console state</span></div></div><div className="sec-copilot-messages">{messages.map((m,i)=><div key={i} className={"sec-copilot-msg "+m.from}>{m.from==="ai"&&<Bot size={14}/>}<span>{m.text}</span></div>)}</div><div className="sec-suggestions">{suggestions.map(s=><button key={s} onClick={()=>send(s)}>{s}</button>)}</div><form className="sec-copilot-input" onSubmit={e=>{e.preventDefault();send()}}><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Ask about incidents, risk, resources or policy..." /><button><Send size={15}/></button></form></section>
 </motion.div>;
}
