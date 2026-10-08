from datetime import datetime, timezone
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.ai_client import AIServiceError, analyze
from app.core.config import get_settings
from app.db import get_db
from app.domain import AccessSession, AuditEvent, Incident, Resource
from app.security import User, get_current_user
from app.decision_engine import decide

router=APIRouter(prefix="/resources",tags=["resource protection"])

class Activity(BaseModel):
    requests_per_minute:float=Field(default=1,ge=0)
    unique_resources:int=Field(default=1,ge=0)
    records_accessed:int=Field(default=0,ge=0)
    download_volume_mb:float=Field(default=0,ge=0)
    authorization_failures:int=Field(default=0,ge=0)
    cross_domain_access:int=Field(default=0,ge=0)

class AccessRequest(BaseModel):
    action:str=Field(default="VIEW",pattern="^(VIEW|DOWNLOAD|SHARE|EDIT)$")
    session_id:str|None=None
    device_is_new:bool=False
    location_is_new:bool=False
    unusual_time:bool=False
    activity:Activity=Activity()
    task_match:bool=True
    responsibility_match:bool=True
    deception_interaction:bool=False

def role_names(user): return {r.name for r in user.roles}

def allowed_by_rbac(user,resource,action):
    roles=role_names(user)
    if roles & {"Security Manager","Security Analyst"}: return True
    required=set(x.strip() for x in resource.required_roles.split(",") if x.strip())
    if required and not required.intersection(roles): return False
    return not (action=="SHARE" and resource.sensitivity=="Restricted")

@router.get("")
async def resources(user:User=Depends(get_current_user),db:AsyncSession=Depends(get_db)):
    rows=list((await db.scalars(select(Resource).order_by(Resource.id))).all())
    return [{"id":r.id,"external_id":r.external_id,"name":r.name,"type":r.resource_type,"sensitivity":r.sensitivity,"owner":r.owner,"protected":r.protected,"accesses":r.access_count} for r in rows]

@router.post("/{resource_id}/access")
async def protected_access(resource_id:int,payload:AccessRequest,user:User=Depends(get_current_user),db:AsyncSession=Depends(get_db)):
    settings=get_settings()
    resource=await db.scalar(select(Resource).where(Resource.id==resource_id))
    if not resource: raise HTTPException(404,"Resource not found.")
    session_id=payload.session_id or "sess-"+uuid4().hex[:10]
    if not allowed_by_rbac(user,resource,payload.action):
        event_id="evt-"+uuid4().hex
        db.add(AuditEvent(event_id=event_id,user_id=user.id,session_id=session_id,action=payload.action,resource=resource.name,sensitivity=resource.sensitivity,risk_score=0,decision="BLOCK",result="RBAC_DENIED",severity="HIGH",explanation="RBAC denied this action before behavioural evaluation.",signals="rbac_denied"))
        await db.commit()
        raise HTTPException(403,detail={"code":"RBAC_DENIED","decision":"BLOCK","event_id":event_id,"message":"Your role does not permit this action."})
    if not resource.protected:
        analysis={"anomaly_score":0,"risk_level":"LOW","signals":[],"explanation":"Resource protection is disabled."}
    else:
        ai_payload={"user_id":str(user.id),"session_id":session_id,"device":{"is_new":payload.device_is_new},"location":{"is_new":payload.location_is_new},"time_context":{"is_unusual":payload.unusual_time},"activity":payload.activity.model_dump(),"context":{"task_match":payload.task_match,"responsibility_match":payload.responsibility_match,"sensitive_resource":resource.sensitivity in {"Confidential","Restricted"},"deception_interaction":payload.deception_interaction}}
        try: analysis=await analyze(ai_payload)
        except AIServiceError as exc: raise HTTPException(503,detail={"code":"AI_SERVICE_UNAVAILABLE","message":"Behaviour analysis is unavailable; protected access is fail-closed.","detail":str(exc)})
    decision=decide(analysis["anomaly_score"],resource.sensitivity,analysis.get("signals",[]),settings.verify_threshold,settings.restrict_threshold,settings.block_threshold)
    result={"ALLOW":"ALLOWED","VERIFY":"STEP_UP_REQUIRED","RESTRICT":"RESTRICTED","BLOCK":"BLOCKED"}[decision.action]
    event_id="evt-"+uuid4().hex
    now=datetime.now(timezone.utc)
    db.add(AuditEvent(event_id=event_id,user_id=user.id,session_id=session_id,action=payload.action,resource=resource.name,sensitivity=resource.sensitivity,risk_score=decision.risk_score,decision=decision.action,result=result,severity=decision.risk_level,explanation=decision.explanation,signals=",".join(analysis.get("signals",[])),created_at=now))
    session=await db.scalar(select(AccessSession).where(AccessSession.session_id==session_id))
    if not session: session=AccessSession(session_id=session_id,user_id=user.id)
    session.risk_score=decision.risk_score; session.decision=decision.action; session.status="ACTIVE" if decision.action=="ALLOW" else "VERIFY" if decision.action=="VERIFY" else "RESTRICTED" if decision.action=="RESTRICT" else "BLOCKED"; session.last_seen_at=now; db.add(session)
    if decision.action in {"RESTRICT","BLOCK"}:
        db.add(Incident(incident_id="inc-"+uuid4().hex,event_id=event_id,user_id=user.id,title=f"{decision.action.title()}ed {payload.action.lower()} on {resource.name}",severity=decision.risk_level,risk_score=decision.risk_score,status="Open",trigger=decision.explanation,resource=resource.name,created_at=now))
    resource.access_count+=1
    await db.commit()
    return {"allowed":decision.action=="ALLOW","decision":decision.action,"risk_score":decision.risk_score,"risk_level":decision.risk_level,"result":result,"event_id":event_id,"session_id":session_id,"resource":resource.name,"sensitivity":resource.sensitivity,"explanation":decision.explanation,"analysis":analysis}
