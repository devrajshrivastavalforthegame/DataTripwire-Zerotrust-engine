from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


NORMAL_PAYLOAD = {
    "user_id": "EMP001",
    "session_id": "TEST-NORMAL",
    "device": {
        "is_new": False
    },
    "location": {
        "is_new": False
    },
    "time_context": {
        "is_unusual": False
    },
    "activity": {
        "requests_per_minute": 8,
        "unique_resources": 4,
        "records_accessed": 35,
        "download_volume_mb": 2,
        "authorization_failures": 0,
        "cross_domain_access": 0
    },
    "context": {
        "task_match": True,
        "responsibility_match": True,
        "sensitive_resource": False,
        "deception_interaction": False
    }
}


SUSPICIOUS_PAYLOAD = {
    "user_id": "EMP001",
    "session_id": "TEST-SUSPICIOUS",
    "device": {
        "is_new": True
    },
    "location": {
        "is_new": True
    },
    "time_context": {
        "is_unusual": True
    },
    "activity": {
        "requests_per_minute": 75,
        "unique_resources": 20,
        "records_accessed": 500,
        "download_volume_mb": 150,
        "authorization_failures": 6,
        "cross_domain_access": 4
    },
    "context": {
        "task_match": False,
        "responsibility_match": False,
        "sensitive_resource": True,
        "deception_interaction": False
    }
}


def test_health():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_normal_session():
    response = client.post(
        "/api/v1/analyze",
        json=NORMAL_PAYLOAD,
    )

    assert response.status_code == 200

    analysis = response.json()["analysis"]

    assert analysis["risk_level"] == "LOW"
    assert analysis["recommendation"] == "ALLOW"
    assert analysis["ml"]["model"] == "isolation_forest"
    assert analysis["ml"]["is_anomaly"] is False
    assert analysis["baseline_deviation"]["severity"] == "LOW"
    assert analysis["signals"] == []


def test_suspicious_session():
    response = client.post(
        "/api/v1/analyze",
        json=SUSPICIOUS_PAYLOAD,
    )

    assert response.status_code == 200

    analysis = response.json()["analysis"]

    assert analysis["risk_level"] == "CRITICAL"
    assert analysis["recommendation"] == "QUARANTINE"
    assert analysis["ml"]["is_anomaly"] is True
    assert analysis["ml"]["model"] == "isolation_forest"
    assert analysis["baseline_deviation"]["severity"] == "CRITICAL"

    assert "new_device" in analysis["signals"]
    assert "new_location" in analysis["signals"]
    assert "high_request_volume" in analysis["signals"]
    assert "task_mismatch" in analysis["signals"]
    assert "responsibility_mismatch" in analysis["signals"]


def test_ai_does_not_enforce_action():
    response = client.post(
        "/api/v1/analyze",
        json=SUSPICIOUS_PAYLOAD,
    )

    assert response.status_code == 200

    analysis = response.json()["analysis"]

    assert analysis["recommendation"] == "QUARANTINE"
    assert "blocked" not in analysis
    assert "account_disabled" not in analysis
    assert "enforcement_executed" not in analysis


def test_legacy_anomaly_endpoint():
    response = client.post(
        "/v1/anomaly-score",
        json={
            "requests_per_minute": 10,
            "unique_resources": 4,
            "records_returned": 30,
            "download_volume_mb": 2,
            "authorization_failures": 0,
            "cross_domain_access_count": 0,
            "resource_switch_rate": 0
        },
    )

    assert response.status_code == 200
    assert "anomaly_score" in response.json()
def test_backend_payload_without_telemetry():
    payload = {
        "user_id": "demo-user-001",
        "risk_score": 42,
        "decision": "MONITOR",
        "reasons": ["new_device", "high_request_volume"],
        "context": {
            "role": "employee",
            "responsibility": "finance",
            "task": "reporting",
            "resource": "reports",
            "action": "read",
            "scope": "finance",
            "sts": 58,
            "ats": 25,
            "session_status": "active",
        },
    }

    response = client.post("/api/v1/analyze", json=payload)

    assert response.status_code == 200

    analysis = response.json()["analysis"]

    assert analysis["recommendation_type"] == "ADVISORY_ONLY"
    assert analysis["backend_decision"] == "MONITOR"
    assert analysis["ml"]["severity"] == "UNAVAILABLE"


def test_anomaly_with_real_telemetry():
    payload = {
        "user_id": "demo-user-001",
        "session_id": "sess-001",
        "activity": {
            "requests_per_minute": 80,
            "unique_resources": 20,
            "records_accessed": 500,
            "download_volume_mb": 150,
            "authorization_failures": 6,
            "cross_domain_access": 4,
        },
    }

    response = client.post("/api/v1/analyze", json=payload)

    assert response.status_code == 200

    analysis = response.json()["analysis"]

    assert analysis["ml"]["is_anomaly"] is True
    assert analysis["ml"]["anomaly_score"] > 0.8
    assert analysis["baseline_deviation"]["severity"] == "CRITICAL"



def test_missing_telemetry_is_not_coerced_to_zero():
    payload = {
        "user_id": "demo-user-001",
        "risk_score": 10,
        "decision": "ALLOW",
        "reasons": [],
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 200
    analysis = response.json()["analysis"]
    assert analysis["ml"]["severity"] == "UNAVAILABLE"
    assert analysis["ml"]["model"] == "isolation_forest_not_run"


def test_same_reason_and_context_signal_is_scored_once():
    payload = {
        "user_id": "demo-user-001",
        "reasons": ["new_device"],
        "device": {"is_new": True},
        "activity": {
            "requests_per_minute": 1,
            "unique_resources": 1,
            "records_accessed": 1,
            "download_volume_mb": 1,
            "authorization_failures": 0,
            "cross_domain_access": 0,
        },
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 200
    analysis = response.json()["analysis"]
    assert analysis["signals"].count("new_device") == 1
    assert analysis["anomaly_score"] == 0.1


def test_partial_telemetry_does_not_run_ml_model():
    payload = {
        "user_id": "demo-user-001",
        "activity": {"requests_per_minute": 12},
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 200
    analysis = response.json()["analysis"]
    assert analysis["ml"]["severity"] == "UNAVAILABLE"



def test_ai_cors_does_not_reflect_untrusted_origin():
    response = client.options(
        "/api/v1/analyze",
        headers={
            "Origin": "https://attacker.invalid",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert "access-control-allow-origin" not in response.headers
