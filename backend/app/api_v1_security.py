from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.domain import AccessSession, AuditEvent, Incident, Policy, Resource
from app.security import User, require_roles
router=APIRouter(prefix="/security",tags=["security console"])
ADMIN=Depends(require_roles("Security Manager","Security Analyst","Auditor"))
@router.get("/overview")
async def overview(db:AsyncSession=Depends(get_db),_admin:User=ADMIN):
 from app.security import User as UserModel
 return {"active_users":await db.scalar(select(func.count()).select_from(UserModel)) or 0,"active_sessions":await db.scalar(select(func.count()).select_from(AccessSession).where(AccessSession.status!="BLOCKED")) or 0,"high_risk_users":await db.scalar(select(func.count()).select_from(AccessSession).where(AccessSession.risk_score>=70)) or 0,"open_incidents":await db.scalar(select(func.count()).select_from(Incident).where(Incident.status=="Open")) or 0,"restricted_sessions":await db.scalar(select(func.count()).select_from(AccessSession).where(AccessSession.status=="RESTRICTED")) or 0,"policy_decisions":await db.scalar(select(func.count()).select_from(AuditEvent)) or 0}
@router.get("/activity")
async def activity(db:AsyncSession=Depends(get_db),_admin:User=ADMIN):
 rows=list((await db.scalars(select(AuditEvent).order_by(desc(AuditEvent.created_at)).limit(250))).all()); return [{"event_id":x.event_id,"time":x.created_at.isoformat(),"user_id":x.user_id,"session_id":x.session_id,"action":x.action,"resource":x.resource,"sensitivity":x.sensitivity,"risk":x.risk_score,"decision":x.decision,"result":x.result,"severity":x.severity,"explanation":x.explanation,"signals":x.signals.split(",") if x.signals else []} for x in rows]
@router.get("/incidents")
async def incidents(db:AsyncSession=Depends(get_db),_admin:User=ADMIN):
 rows=list((await db.scalars(select(Incident).order_by(desc(Incident.created_at)).limit(100))).all()); return [{"incident_id":x.incident_id,"title":x.title,"severity":x.severity,"user_id":x.user_id,"risk":x.risk_score,"status":x.status,"trigger":x.trigger,"resource":x.resource,"time":x.created_at.isoformat()} for x in rows]
@router.patch("/incidents/{incident_id}")
async def update_incident(incident_id:str,payload:dict,db:AsyncSession=Depends(get_db),_admin:User=ADMIN):
 x=await db.scalar(select(Incident).where(Incident.incident_id==incident_id))
 if not x: raise HTTPException(404,"Incident not found")
 x.status=payload.get("status",x.status); await db.commit(); return {"incident_id":x.incident_id,"status":x.status}
@router.get("/audit")
async def audit(db:AsyncSession=Depends(get_db),_admin:User=ADMIN):
 rows=list((await db.scalars(select(AuditEvent).order_by(desc(AuditEvent.created_at)).limit(500))).all()); return [{"event_id":x.event_id,"time":x.created_at.isoformat(),"actor_user_id":x.user_id,"action":x.action,"target":x.resource,"result":x.result,"severity":x.severity,"risk":x.risk_score} for x in rows]
@router.get("/sessions")
async def sessions(db:AsyncSession=Depends(get_db),_admin:User=ADMIN):
 rows=list((await db.scalars(select(AccessSession).order_by(desc(AccessSession.last_seen_at)).limit(100))).all()); return [{"session_id":x.session_id,"user_id":x.user_id,"risk":x.risk_score,"decision":x.decision,"status":x.status,"last_seen":x.last_seen_at.isoformat()} for x in rows]
@router.patch("/sessions/{session_id}")
async def update_session(session_id:str,payload:dict,db:AsyncSession=Depends(get_db),_admin:User=ADMIN):
 x=await db.scalar(select(AccessSession).where(AccessSession.session_id==session_id))
 if not x: raise HTTPException(404,"Session not found")
 d=payload.get("decision","ALLOW"); x.decision=d; x.status={"ALLOW":"ACTIVE","VERIFY":"VERIFY","RESTRICT":"RESTRICTED","BLOCK":"BLOCKED"}.get(d,"ACTIVE"); await db.commit(); return {"session_id":x.session_id,"decision":x.decision,"status":x.status}
@router.get("/resources")
async def resources(db:AsyncSession=Depends(get_db),_admin:User=ADMIN):
 rows=list((await db.scalars(select(Resource).order_by(Resource.id))).all()); return [{"id":x.id,"external_id":x.external_id,"name":x.name,"type":x.resource_type,"sensitivity":x.sensitivity,"owner":x.owner,"protected":x.protected,"accesses":x.access_count} for x in rows]
@router.patch("/resources/{resource_id}")
async def update_resource(resource_id:int,payload:dict,db:AsyncSession=Depends(get_db),_admin:User=ADMIN):
 x=await db.scalar(select(Resource).where(Resource.id==resource_id))
 if not x: raise HTTPException(404,"Resource not found")
 if "protected" in payload:x.protected=bool(payload["protected"])
 await db.commit(); return {"id":x.id,"protected":x.protected}
@router.get("/policies")
async def policies(db:AsyncSession=Depends(get_db),_admin:User=ADMIN):
 rows=list((await db.scalars(select(Policy).order_by(Policy.id))).all()); return [{"policy_id":x.policy_id,"name":x.name,"effect":x.effect,"threshold":x.threshold,"scope":x.scope,"enabled":x.enabled,"version":x.version} for x in rows]
@router.patch("/policies/{policy_id}")
async def update_policy(policy_id:str,payload:dict,db:AsyncSession=Depends(get_db),_admin:User=ADMIN):
 x=await db.scalar(select(Policy).where(Policy.policy_id==policy_id))
 if not x: raise HTTPException(404,"Policy not found")
 if "enabled" in payload:x.enabled=bool(payload["enabled"])
 if "threshold" in payload:x.threshold=max(0,min(100,float(payload["threshold"])))
 x.version+=1; await db.commit(); return {"policy_id":x.policy_id,"enabled":x.enabled,"threshold":x.threshold,"version":x.version}
@router.post("/responses/{session_id}")
async def response(session_id:str,payload:dict,db:AsyncSession=Depends(get_db),_admin:User=ADMIN):
 x=await db.scalar(select(AccessSession).where(AccessSession.session_id==session_id))
 if not x: raise HTTPException(404,"Session not found")
 d=payload.get("decision","BLOCK"); x.decision=d; x.status={"ALLOW":"ACTIVE","VERIFY":"VERIFY","RESTRICT":"RESTRICTED","BLOCK":"BLOCKED"}.get(d,"BLOCKED"); await db.commit(); return {"ok":True,"session_id":x.session_id,"decision":d,"status":x.status}
