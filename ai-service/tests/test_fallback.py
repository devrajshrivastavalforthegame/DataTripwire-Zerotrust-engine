from app.fallback import build_safe_fallback
from app.models.response import AnalyzeResponse


def test_fallback_returns_safe_response():
    result = build_safe_fallback(
        user_id="EMP001",
        session_id="FALLBACK-001",
        reason="AI service unavailable",
    )

    assert result["user_id"] == "EMP001"
    assert result["session_id"] == "FALLBACK-001"
    assert result["analysis"]["risk_level"] == "UNKNOWN"
    assert result["analysis"]["recommendation"] == "VERIFY"
    assert result["analysis"]["confidence"] == 0.0


def test_fallback_does_not_grant_access():
    result = build_safe_fallback(
        user_id="EMP001",
        session_id="FALLBACK-002",
        reason="Malformed AI response",
    )

    assert result["analysis"]["recommendation"] != "ALLOW"


def test_fallback_matches_response_contract():
    result = build_safe_fallback(
        user_id="EMP001",
        session_id="FALLBACK-003",
        reason="AI timeout",
    )

    validated = AnalyzeResponse.model_validate(result)

    assert validated.user_id == "EMP001"
    assert validated.analysis.recommendation == "VERIFY"
    assert validated.analysis.ml.model == "unavailable"
