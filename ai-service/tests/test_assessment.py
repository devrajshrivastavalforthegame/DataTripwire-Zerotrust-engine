from app.assessment_service import security_assessment_service


def test_low_risk_assessment():
    result = security_assessment_service.build_assessment(
        risk_level="LOW",
        anomaly_score=0.0,
        confidence=0.70,
        baseline_score=0.09,
        signals=[],
        recommendation="ALLOW",
    )

    assert result["severity"] == "LOW"
    assert result["recommendation"] == "ALLOW"
    assert result["signal_count"] == 0
    assert result["primary_concerns"] == []
    assert result["behavioural_deviation"] == 0.09


def test_critical_assessment_identifies_primary_concerns():
    signals = [
        "new_device",
        "high_request_volume",
        "resource_enumeration",
        "responsibility_mismatch",
        "sensitive_resource_access",
    ]

    result = security_assessment_service.build_assessment(
        risk_level="CRITICAL",
        anomaly_score=1.0,
        confidence=0.99,
        baseline_score=1.0,
        signals=signals,
        recommendation="QUARANTINE",
    )

    assert result["severity"] == "CRITICAL"
    assert result["recommendation"] == "QUARANTINE"
    assert result["signal_count"] == 5
    assert len(result["primary_concerns"]) == 5
    assert any("device" in item.lower() for item in result["primary_concerns"])
    assert any("request volume" in item.lower() for item in result["primary_concerns"])
    assert any("responsibility" in item.lower() for item in result["primary_concerns"])


def test_unknown_signal_does_not_break_assessment():
    result = security_assessment_service.build_assessment(
        risk_level="HIGH",
        anomaly_score=0.80,
        confidence=0.90,
        baseline_score=0.75,
        signals=["unknown_signal"],
        recommendation="RESTRICT",
    )

    assert result["severity"] == "HIGH"
    assert result["signal_count"] == 1
    assert result["primary_concerns"] == []
    assert result["recommendation"] == "RESTRICT"


def test_assessment_preserves_non_enforcement_architecture():
    result = security_assessment_service.build_assessment(
        risk_level="CRITICAL",
        anomaly_score=1.0,
        confidence=0.99,
        baseline_score=1.0,
        signals=["deception_interaction"],
        recommendation="QUARANTINE",
    )

    assert result["recommendation"] == "QUARANTINE"
    assert "blocked" not in result
    assert "account_disabled" not in result
    assert "enforcement_executed" not in result
