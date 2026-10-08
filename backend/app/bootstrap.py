from sqlalchemy import select
from app.core.config import get_settings
from app.db import SessionLocal
from app.domain import Resource, Policy
from app.security import Role, User, hash_password

async def seed_demo_data():
    settings=get_settings()
    if not settings.seed_demo_data: return
    role_data={"Employee":"Standard WorkShepher employee access.","Security Analyst":"Security investigation and monitoring access.","Security Manager":"Security governance and response access.","Auditor":"Read-only security audit access."}
    async with SessionLocal() as db:
        roles={}
        for name,desc in role_data.items():
            role=await db.scalar(select(Role).where(Role.name==name))
            if not role:
                role=Role(name=name,description=desc); db.add(role); await db.flush()
            roles[name]=role
        users=[("employee@workshepher.local","Aarav Sharma","Employee@123",["Employee"]),("admin@datatripwire.local","Security Administrator","Admin@123",["Security Manager","Security Analyst"])]
        for email,full_name,password,role_names in users:
            user=await db.scalar(select(User).where(User.email==email))
            if not user:
                user=User(email=email,full_name=full_name,password_hash=hash_password(password)); user.roles=[roles[n] for n in role_names]; db.add(user)
        resource_data=[("res-fin","Financial Report","Report","Confidential","Finance","Employee"),("res-hr","HR Records","Records","Restricted","People Ops","Employee"),("res-pay","Payroll Sheet","Spreadsheet","Restricted","Finance","Employee"),("res-road","Product Roadmap","Document","Internal","Product","Employee")]
        for ext,name,typ,sens,owner,required in resource_data:
            row=await db.scalar(select(Resource).where(Resource.external_id==ext))
            if not row: db.add(Resource(external_id=ext,name=name,resource_type=typ,sensitivity=sens,owner=owner,required_roles=required,protected=True))
        policies=[("pol-001","High Risk Containment","RESTRICT",70,"Confidential + Restricted"),("pol-002","Critical Session Quarantine","BLOCK",85,"Restricted resources"),("pol-003","Step-up Verification","VERIFY",50,"Sensitive actions"),("pol-004","Normal Baseline Access","ALLOW",0,"Internal resources")]
        for pid,name,effect,threshold,scope in policies:
            row=await db.scalar(select(Policy).where(Policy.policy_id==pid))
            if not row: db.add(Policy(policy_id=pid,name=name,effect=effect,threshold=threshold,scope=scope,enabled=True,version=1))
        await db.commit()
