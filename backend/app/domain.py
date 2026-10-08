from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db import Base

class Resource(Base):
    __tablename__="resources"
    id: Mapped[int]=mapped_column(Integer,primary_key=True)
    external_id: Mapped[str]=mapped_column(String(80),unique=True,index=True)
    name: Mapped[str]=mapped_column(String(160))
    resource_type: Mapped[str]=mapped_column(String(80))
    sensitivity: Mapped[str]=mapped_column(String(40),index=True)
    owner: Mapped[str]=mapped_column(String(120))
    protected: Mapped[bool]=mapped_column(Boolean,default=True)
    required_roles: Mapped[str]=mapped_column(String(500),default="Employee")
    access_count: Mapped[int]=mapped_column(Integer,default=0)

class AccessSession(Base):
    __tablename__="access_sessions"
    id: Mapped[int]=mapped_column(Integer,primary_key=True)
    session_id: Mapped[str]=mapped_column(String(120),unique=True,index=True)
    user_id: Mapped[int]=mapped_column(Integer,index=True)
    risk_score: Mapped[float]=mapped_column(Float,default=0)
    decision: Mapped[str]=mapped_column(String(20),default="ALLOW")
    status: Mapped[str]=mapped_column(String(40),default="ACTIVE")
    last_seen_at: Mapped[datetime]=mapped_column(DateTime(timezone=True),default=lambda:datetime.now(timezone.utc))

class AuditEvent(Base):
    __tablename__="audit_events"
    id: Mapped[int]=mapped_column(Integer,primary_key=True)
    event_id: Mapped[str]=mapped_column(String(120),unique=True,index=True)
    user_id: Mapped[int|None]=mapped_column(Integer,index=True,nullable=True)
    session_id: Mapped[str|None]=mapped_column(String(120),index=True,nullable=True)
    action: Mapped[str]=mapped_column(String(40))
    resource: Mapped[str]=mapped_column(String(160))
    sensitivity: Mapped[str]=mapped_column(String(40))
    risk_score: Mapped[float]=mapped_column(Float,default=0)
    decision: Mapped[str]=mapped_column(String(20))
    result: Mapped[str]=mapped_column(String(40))
    severity: Mapped[str]=mapped_column(String(30))
    explanation: Mapped[str]=mapped_column(Text,default="")
    signals: Mapped[str]=mapped_column(Text,default="")
    created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True),default=lambda:datetime.now(timezone.utc))

class Incident(Base):
    __tablename__="incidents"
    id: Mapped[int]=mapped_column(Integer,primary_key=True)
    incident_id: Mapped[str]=mapped_column(String(120),unique=True,index=True)
    event_id: Mapped[str]=mapped_column(String(120),index=True)
    user_id: Mapped[int]=mapped_column(Integer,index=True)
    title: Mapped[str]=mapped_column(String(200))
    severity: Mapped[str]=mapped_column(String(30))
    risk_score: Mapped[float]=mapped_column(Float)
    status: Mapped[str]=mapped_column(String(40),default="Open")
    trigger: Mapped[str]=mapped_column(Text,default="")
    resource: Mapped[str]=mapped_column(String(160))
    created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True),default=lambda:datetime.now(timezone.utc))

class Policy(Base):
    __tablename__="policies"
    id: Mapped[int]=mapped_column(Integer,primary_key=True)
    policy_id: Mapped[str]=mapped_column(String(80),unique=True,index=True)
    name: Mapped[str]=mapped_column(String(160))
    effect: Mapped[str]=mapped_column(String(20))
    threshold: Mapped[float]=mapped_column(Float)
    scope: Mapped[str]=mapped_column(String(160))
    enabled: Mapped[bool]=mapped_column(Boolean,default=True)
    version: Mapped[int]=mapped_column(Integer,default=1)

class WorkspaceState(Base):
    __tablename__="workspace_states"
    id: Mapped[int]=mapped_column(Integer,primary_key=True)
    user_id: Mapped[int]=mapped_column(Integer,index=True,unique=True)
    data: Mapped[str]=mapped_column(Text,default="{}")
    updated_at: Mapped[datetime]=mapped_column(DateTime(timezone=True),default=lambda:datetime.now(timezone.utc))
