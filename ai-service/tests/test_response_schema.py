from pydantic import ValidationError

from app.models.response import AnalyzeResponse


def valid_analysis():
    return {
        "risk_level": "HIGH",
        "anomaly_score": 0.82,
        "confidence": 0.91,
        "ml": {
            "anomaly_score": 0.79,
            "is_anomaly": True,
            "severity": "HIGH",
            "model": "isolation_forest",
        },
        "baseline_deviation": {
            "score": 0.74,
            "severity": "HIGH",
            "feature_deviations": {
                "requests_per_minute": 4.2,
                "unique_resources": 3.1,
                "records_accessed": 2.8,
                "download_volume_mb": 1.9,
                "authorization_failures": 2.0,
                "cross_domain_access": 3.0,
            },
        },
        "signals": [
            "new_device",
            "high_request_volume",
        ],
        "explanation": "The session shows elevated behavioural risk.",
        "recommendation": "RESTRICT",
        "assessment": {
            "severity": "HIGH",
            "confidence": 0.91,
            "summary": "The session shows substantial behavioural deviations.",
            "primary_concerns": [
                "A new device was detected.",
                "Request volume is significantly above the expected level.",
            ],
            "signal_count": 2,
            "behavioural_deviation": 0.74,
            "anomaly_score": 0.82,
            "recommendation": "RESTRICT",
        },
    }


def valid_response():
    return {
        "user_id": "EMP001",
        "session_id": "TEST-SCHEMA",
        "analysis": valid_analysis(),
        "timestamp": "2026-10-08T00:00:00+00:00",
    }


def test_valid_analysis_response_is_accepted():
    result = AnalyzeResponse.model_validate(valid_response())

    assert result.user_id == "EMP001"
    assert result.analysis.risk_level == "HIGH"
    assert result.analysis.recommendation == "RESTRICT"
    assert result.analysis.ml.model == "isolation_forest"
    assert result.analysis.assessment.signal_count == 2


def test_invalid_anomaly_score_is_rejected():
    data = valid_response()
    data["analysis"]["anomaly_score"] = 1.5

    try:
        AnalyzeResponse.model_validate(data)
        assert False, "Invalid anomaly score should be rejected."
    except ValidationError:
        pass


def test_invalid_confidence_is_rejected():
    data = valid_response()
    data["analysis"]["confidence"] = -0.1

    try:
        AnalyzeResponse.model_validate(data)
        assert False, "Invalid confidence should be rejected."
    except ValidationError:
        pass


def test_missing_assessment_is_rejected():
    data = valid_response()
    del data["analysis"]["assessment"]

    try:
        AnalyzeResponse.model_validate(data)
        assert False, "Missing assessment should be rejected."
    except ValidationError:
        pass