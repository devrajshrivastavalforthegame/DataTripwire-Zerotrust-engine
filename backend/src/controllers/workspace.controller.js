import { query } from "../config/database.js";
import { randomUUID } from "crypto";

const seedState=()=>({
  profile:{display_name:"Workspace User",job_title:"Employee",location:"Indore, India"},
  settings:{notifications:true,mentions:true,project_updates:true,weekly_summary:false},
  tasks:[
    {id:randomUUID(),title:"Prepare quarterly budget",project:"Finance Operations",priority:"High",status:"todo",due:"Today",progress:0},
    {id:randomUUID(),title:"Review onboarding flow",project:"Product",priority:"Medium",status:"todo",due:"Tomorrow",progress:0},
    {id:randomUUID(),title:"Q4 financial report",project:"Finance Operations",priority:"High",status:"progress",due:"Today",progress:72},
    {id:randomUUID(),title:"Mobile experience",project:"Product",priority:"Medium",status:"progress",due:"Thu",progress:54},
    {id:randomUUID(),title:"Security requirements",project:"Engineering",priority:"High",status:"review",due:"Today",progress:90},
    {id:randomUUID(),title:"Brand guidelines",project:"Marketing",priority:"Low",status:"review",due:"Tomorrow",progress:80},
    {id:randomUUID(),title:"Project kickoff",project:"Northwind",priority:"Medium",status:"completed",due:"Done",progress:100}
  ],
  projects:[
    {id:randomUUID(),name:"Northwind Client Portal",description:"New customer experience and account workspace.",progress:78,status:"On track",due:"Oct 24",team:8,type:"Product"},
    {id:randomUUID(),name:"Q4 Finance Operations",description:"Quarterly reporting, budgeting and compliance.",progress:61,status:"On track",due:"Oct 28",team:5,type:"Finance"},
    {id:randomUUID(),name:"Workplace Experience",description:"Internal tools and employee experience improvements.",progress:43,status:"At risk",due:"Nov 03",team:12,type:"People"},
    {id:randomUUID(),name:"Brand Refresh",description:"Visual identity, templates and communication system.",progress:31,status:"Planning",due:"Nov 14",team:6,type:"Marketing"}
  ],
  approvals:[
    {id:randomUUID(),title:"Q4 Marketing Budget",requester:"Sarah Kapoor",department:"Finance",amount:"$48,000",due:"Today",status:"PENDING"},
    {id:randomUUID(),title:"Client Contract Renewal",requester:"Aarav Sharma",department:"Northwind",amount:"$120,000",due:"Today",status:"PENDING"},
    {id:randomUUID(),title:"Design System Update",requester:"Meera Iyer",department:"Product",amount:"Internal",due:"Yesterday",status:"PENDING"}
  ],
  calendar:[
    {id:randomUUID(),day:0,start:0,span:1,title:"Team stand-up",type:"Meeting"},
    {id:randomUUID(),day:1,start:1,span:1,title:"Design review",type:"Review"},
    {id:randomUUID(),day:2,start:2,span:2,title:"Product planning",type:"Planning"},
    {id:randomUUID(),day:3,start:3,span:1,title:"Client sync",type:"Meeting"},
    {id:randomUUID(),day:4,start:5,span:1,title:"Finance review",type:"Review"}
  ],
  messages:{
    conversations:[
      {id:"meera",initials:"MI",name:"Meera Iyer",preview:"The new designs look great!",time:"2m"},
      {id:"aarav",initials:"AS",name:"Aarav Sharma",preview:"Can you review the roadmap?",time:"18m"},
      {id:"sarah",initials:"SK",name:"Sarah Kapoor",preview:"Finance report is ready.",time:"1h"}
    ],
    threads:{
      meera:[
        {id:randomUUID(),from:"them",text:"Hey! Did you get a chance to look at the new designs?",time:"10:31 AM"},
        {id:randomUUID(),from:"me",text:"Yes, just checked them. The new direction looks really clean.",time:"10:34 AM"},
        {id:randomUUID(),from:"them",text:"Perfect. I’ll update the final screens and share them shortly.",time:"10:35 AM"}
      ]
    }
  },
  notifications:[
    {id:randomUUID(),title:"Task completed",text:"Rohan completed Security requirements.",time:"8m",read:false},
    {id:randomUUID(),title:"New message",text:"Meera mentioned you in Product Strategy.",time:"24m",read:false},
    {id:randomUUID(),title:"Document updated",text:"Q4 Financial Report was updated.",time:"1h",read:false}
  ],
  invites:[]
});

async function ensureState(userId){
  await query(`CREATE TABLE IF NOT EXISTS workspace_states(
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  const existing=await query("SELECT data FROM workspace_states WHERE user_id=$1",[userId]);
  if(existing.rows[0]) return existing.rows[0].data;
  const state=seedState();
  await query("INSERT INTO workspace_states(user_id,data) VALUES($1,$2::jsonb)",[userId,JSON.stringify(state)]);
  return state;
}
async function save(userId,data){await query("UPDATE workspace_states SET data=$2::jsonb,updated_at=NOW() WHERE user_id=$1",[userId,JSON.stringify(data)]);return data;}

export async function getState(req,res){res.json({data:await ensureState(req.auth.user.id)});}

export async function updateState(req,res){
  const data = req.body?.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return res.status(400).json({ error: "data must be an object containing profile and/or settings" });
  }

  const allowedKeys = new Set(["profile", "settings"]);
  const unexpectedKeys = Object.keys(data).filter(key => !allowedKeys.has(key));
  if (unexpectedKeys.length) {
    return res.status(400).json({
      error: "Workspace collections must be changed through their dedicated endpoints",
      blockedFields: unexpectedKeys
    });
  }

  const current = await ensureState(req.auth.user.id);
  const next = { ...current };

  if (data.profile !== undefined) {
    if (!data.profile || typeof data.profile !== "object" || Array.isArray(data.profile)) {
      return res.status(400).json({ error: "profile must be an object" });
    }
    const profileFields = ["display_name", "job_title", "location"];
    const invalid = Object.keys(data.profile).filter(key => !profileFields.includes(key));
    if (invalid.length || Object.values(data.profile).some(value => typeof value !== "string" || value.length > 160)) {
      return res.status(400).json({ error: "profile contains unsupported fields or invalid values" });
    }
    next.profile = { ...current.profile, ...data.profile };
  }

  if (data.settings !== undefined) {
    if (!data.settings || typeof data.settings !== "object" || Array.isArray(data.settings)) {
      return res.status(400).json({ error: "settings must be an object" });
    }
    const settingsFields = ["notifications", "mentions", "project_updates", "weekly_summary"];
    const invalid = Object.keys(data.settings).filter(key => !settingsFields.includes(key));
    if (invalid.length || Object.values(data.settings).some(value => typeof value !== "boolean")) {
      return res.status(400).json({ error: "settings contains unsupported fields or invalid values" });
    }
    next.settings = { ...current.settings, ...data.settings };
  }

  return res.json({ data: await save(req.auth.user.id, next) });
}

export async function workspaceAction(req,res){
  const userId=req.auth.user.id;const state=await ensureState(userId);
  const {action,target,metadata={}}=req.body||{};
  if(action==="complete_task"){const t=state.tasks.find(x=>x.id===target);if(!t)return res.status(404).json({error:"Task not found"});t.status="completed";t.progress=100;}
  else if(action==="advance_task"){const t=state.tasks.find(x=>x.id===target);if(!t)return res.status(404).json({error:"Task not found"});const order=["todo","progress","review","completed"];const i=order.indexOf(t.status);t.status=order[Math.min(i+1,3)];t.progress=t.status==="completed"?100:Math.max(t.progress||0,50);}
  else if(action==="mark_notification_read"){const n=state.notifications.find(x=>x.id===target);if(n)n.read=true;}
  else if(action==="mark_all_notifications_read"){state.notifications.forEach(x=>x.read=true);}
  else if(action==="invite_member"){state.invites.push({id:randomUUID(),email:metadata.email,status:"PENDING",created_at:new Date().toISOString()});}
  else return res.status(400).json({error:"Unsupported workspace action"});
  await save(userId,state);res.json({status:"ok",data:state});
}

export async function createTask(req,res){const state=await ensureState(req.auth.user.id);const task={id:randomUUID(),status:"todo",progress:0,priority:"Medium",...req.body};state.tasks.unshift(task);res.status(201).json(await save(req.auth.user.id,state));}
export async function updateTask(req,res){const state=await ensureState(req.auth.user.id);const t=state.tasks.find(x=>x.id===req.params.id);if(!t)return res.status(404).json({error:"Task not found"});Object.assign(t,req.body||{});res.json(await save(req.auth.user.id,state));}
export async function createProject(req,res){const state=await ensureState(req.auth.user.id);const p={id:randomUUID(),progress:0,status:"Planning",team:1,...req.body};state.projects.unshift(p);res.status(201).json(await save(req.auth.user.id,state));}
export async function updateProject(req,res){const state=await ensureState(req.auth.user.id);const p=state.projects.find(x=>x.id===req.params.id);if(!p)return res.status(404).json({error:"Project not found"});Object.assign(p,req.body||{});res.json(await save(req.auth.user.id,state));}
export async function decideApproval(req,res){const state=await ensureState(req.auth.user.id);const a=state.approvals.find(x=>x.id===req.params.id);if(!a)return res.status(404).json({error:"Approval not found"});a.status=req.params.decision.toUpperCase();res.json(await save(req.auth.user.id,state));}
export async function sendMessage(req,res){const state=await ensureState(req.auth.user.id);const conversationId=req.body?.conversationId||"meera";state.messages.threads[conversationId] ||= [];const m={id:randomUUID(),from:"me",text:String(req.body?.text||"").trim(),time:new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})};if(!m.text)return res.status(400).json({error:"Message text is required"});state.messages.threads[conversationId].push(m);const c=state.messages.conversations.find(x=>x.id===conversationId);if(c){c.preview=m.text;c.time="now";}res.status(201).json(await save(req.auth.user.id,state));}
export async function updateProfile(req,res){const state=await ensureState(req.auth.user.id);state.profile={...state.profile,...req.body};await save(req.auth.user.id,state);res.json(state.profile);}
export async function updateSettings(req,res){const state=await ensureState(req.auth.user.id);state.settings={...state.settings,...req.body};await save(req.auth.user.id,state);res.json(state.settings);}
export async function createCalendarEvent(req,res){const state=await ensureState(req.auth.user.id);state.calendar.push({id:randomUUID(),day:0,start:0,span:1,type:"Meeting",...req.body});res.status(201).json(await save(req.auth.user.id,state));}

export async function listTeam(req,res){const r=await query("SELECT id,username,email,role,status,created_at FROM users WHERE status='active' ORDER BY username");res.json({users:r.rows});}
export async function listReports(req,res){const uid=req.auth.user.id;const state=await ensureState(uid);const counts={};for(const t of state.tasks)counts[t.status]=(counts[t.status]||0)+1;res.json({tasks:Object.entries(counts).map(([status,count])=>({status,count})),projects:state.projects});}
