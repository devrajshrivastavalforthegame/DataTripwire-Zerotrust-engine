from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_root_health():
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["service"] == "datatripwire-backend"
    assert body["status"] == "ok"


def test_versioned_health():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_request_id_is_returned():
    response = client.get("/health", headers={"X-Request-ID": "phase-a-test"})
    assert response.status_code == 200
    assert response.headers["X-Request-ID"] == "phase-a-test"


def test_validation_errors_use_standard_shape():
    response = client.get("/api/v1/health", headers={"X-Request-ID": "validation-test"})
    assert response.status_code == 200


def test_not_found_uses_standard_shape():
    response = client.get("/does-not-exist", headers={"X-Request-ID": "missing-test"})
    assert response.status_code == 404
    body = response.json()
    assert body["error"]["code"] == "NOT_FOUND"
    assert body["error"]["request_id"] == "missing-test"
