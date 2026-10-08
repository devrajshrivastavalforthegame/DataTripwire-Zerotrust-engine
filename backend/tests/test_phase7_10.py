from fastapi.testclient import TestClient
from app.main import app

def login(c,email,password):
    r=c.post("/api/v1/auth/login",json={"email":email,"password":password}); assert r.status_code==200; return r.json()["access_token"]

def test_workspace_requires_auth():
    with TestClient(app) as c:
        assert c.get("/api/v1/workspace/state").status_code==401

def test_workspace_action_and_profile():
    with TestClient(app) as c:
        t=login(c,"employee@workshepher.local","Employee@123"); h={"Authorization":f"Bearer {t}"}
        assert c.post("/api/v1/workspace/actions",headers=h,json={"action":"BUTTON_CLICK","target":"/tasks"}).status_code==200
        r=c.put("/api/v1/workspace/profile",headers=h,json={"display_name":"Om"}); assert r.status_code==200

def test_admin_console_requires_role():
    with TestClient(app) as c:
        t=login(c,"employee@workshepher.local","Employee@123")
        r=c.get("/api/v1/security/overview",headers={"Authorization":f"Bearer {t}"})
        assert r.status_code==403

def test_security_admin_can_read_resources():
    with TestClient(app) as c:
        t=login(c,"admin@datatripwire.local","Admin@123")
        r=c.get("/api/v1/security/resources",headers={"Authorization":f"Bearer {t}"})
        assert r.status_code==200 and len(r.json())>=4
