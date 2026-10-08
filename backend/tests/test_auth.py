from fastapi.testclient import TestClient
from app.main import app

def test_employee_login_and_me():
    with TestClient(app) as client:
        r=client.post("/api/v1/auth/login",json={"email":"employee@workshepher.local","password":"Employee@123"})
        assert r.status_code==200
        token=r.json()["access_token"]
        me=client.get("/api/v1/auth/me",headers={"Authorization":f"Bearer {token}"})
        assert me.status_code==200
        assert me.json()["roles"]==["Employee"]

def test_invalid_password():
    with TestClient(app) as client:
        assert client.post("/api/v1/auth/login",json={"email":"employee@workshepher.local","password":"WrongPass@123"}).status_code==401

def test_employee_is_denied_admin():
    with TestClient(app) as client:
        token=client.post("/api/v1/auth/login",json={"email":"employee@workshepher.local","password":"Employee@123"}).json()["access_token"]
        assert client.get("/api/v1/admin/users",headers={"Authorization":f"Bearer {token}"}).status_code==403

def test_security_manager_can_list_users():
    with TestClient(app) as client:
        r=client.post("/api/v1/auth/login",json={"email":"admin@datatripwire.local","password":"Admin@123"})
        assert r.status_code==200
        token=r.json()["access_token"]
        users=client.get("/api/v1/admin/users",headers={"Authorization":f"Bearer {token}"})
        assert users.status_code==200
        assert len(users.json())>=2
