import json
from datetime import datetime, timezone
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.domain import WorkspaceState, AuditEvent
from app.security import User, get_current_user

router=APIRouter(prefix="/workspace",tags=["workspace"])

DEFAULT={
 "tasks":[],"projects":[],"documents":[],"approvals":[],"team":[],"calendar":[],"messages":[],
 "profile":{"display_name":"Workspace User","job_title":"Employee","location":"Indore, India"},
 "settings":{"notifications":True,"mentions":True,"project_updates":True,"weekly_summary":False},
}

def clean(data):
    value=dict(DEFAULT); value.update(data or {})
    return value

async def row_for(user,db):
    row=await db.scalar(select(WorkspaceState).where(WorkspaceState.user_id==user.id))
    if not row:
        row=WorkspaceState(user_id=user.id,data=json.dumps(DEFAULT),updated_at=datetime.now(timezone.utc)); db.add(row); await db.commit(); await db.refresh(row)
    return row

class WorkspaceActionPayload(BaseModel):
    action:str=Field(min_length=1,max_length=120)
    target:str|None=None
    metadata:dict=dict

class StatePatch(BaseModel):
    data:dict

@router.get("/state")
async def get_state(user:User=Depends(get_current_user),db:AsyncSession=Depends(get_db)):
    row=await row_for(user,db)
    return {"data":clean(json.loads(row.data)),"updated_at":row.updated_at.isoformat()}

@router.put("/state")
async def update_state(payload:StatePatch,user:User=Depends(get_current_user),db:AsyncSession=Depends(get_db)):
    row=await row_for(user,db)
    data=clean(payload.data); row.data=json.dumps(data); row.updated_at=datetime.now(timezone.utc)
    await db.commit()
    return {"data":data,"updated_at":row.updated_at.isoformat()}

@router.post("/actions")
async def action(payload:WorkspaceActionPayload,user:User=Depends(get_current_user),db:AsyncSession=Depends(get_db)):
    event_id="wsevt-"+uuid4().hex
    db.add(AuditEvent(event_id=event_id,user_id=user.id,session_id=None,action="WORKSPACE:"+payload.action,resource=payload.target or "workspace",sensitivity="Internal",risk_score=0,decision="ALLOW",result="RECORDED",severity="LOW",explanation="Workspace control action recorded.",signals=json.dumps(payload.metadata)))
    await db.commit()
    return {"ok":True,"event_id":event_id,"action":payload.action,"target":payload.target}

@router.post("/tasks")
async def create_task(payload:dict,user:User=Depends(get_current_user),db:AsyncSession=Depends(get_db)):
    row=await row_for(user,db); data=clean(json.loads(row.data)); item={"id":"task-"+uuid4().hex[:8],**payload}; data["tasks"].append(item); row.data=json.dumps(data); row.updated_at=datetime.now(timezone.utc); await db.commit(); return item

@router.patch("/tasks/{item_id}")
async def update_task(item_id:str,payload:dict,user:User=Depends(get_current_user),db:AsyncSession=Depends(get_db)):
    row=await row_for(user,db); data=clean(json.loads(row.data)); item=next((x for x in data["tasks"] if x.get("id")==item_id),None)
    if not item: raise HTTPException(404,"Task not found")
    item.update(payload); row.data=json.dumps(data); row.updated_at=datetime.now(timezone.utc); await db.commit(); return item

@router.post("/messages")
async def send_message(payload:dict,user:User=Depends(get_current_user),db:AsyncSession=Depends(get_db)):
    row=await row_for(user,db); data=clean(json.loads(row.data)); item={"id":"msg-"+uuid4().hex[:8],"sender":user.full_name,"created_at":datetime.now(timezone.utc).isoformat(),**payload}; data["messages"].append(item); row.data=json.dumps(data); row.updated_at=datetime.now(timezone.utc); await db.commit(); return item

@router.post("/approvals/{item_id}/{decision}")
async def approval(item_id:str,decision:str,user:User=Depends(get_current_user),db:AsyncSession=Depends(get_db)):
    if decision not in {"approve","reject","return"}: raise HTTPException(400,"Invalid approval decision")
    row=await row_for(user,db); data=clean(json.loads(row.data)); item=next((x for x in data["approvals"] if x.get("id")==item_id),None)
    if not item: raise HTTPException(404,"Approval not found")
    item["status"]=decision.upper(); item["decided_by"]=user.full_name; item["decided_at"]=datetime.now(timezone.utc).isoformat(); row.data=json.dumps(data); row.updated_at=datetime.now(timezone.utc); await db.commit(); return item

@router.put("/profile")
async def profile(payload:dict,user:User=Depends(get_current_user),db:AsyncSession=Depends(get_db)):
    row=await row_for(user,db); data=clean(json.loads(row.data)); data["profile"].update(payload); row.data=json.dumps(data); row.updated_at=datetime.now(timezone.utc); await db.commit(); return data["profile"]

@router.put("/settings")
async def settings(payload:dict,user:User=Depends(get_current_user),db:AsyncSession=Depends(get_db)):
    row=await row_for(user,db); data=clean(json.loads(row.data)); data["settings"].update(payload); row.data=json.dumps(data); row.updated_at=datetime.now(timezone.utc); await db.commit(); return data["settings"]
