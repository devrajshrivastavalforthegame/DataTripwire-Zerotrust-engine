from datetime import datetime, timezone


def build_safe_fallback(
    user_id: str,
    session_id: str,
    reason: str,
) -> dict:
    """
    Returns a safe degraded AI response.

    AI is advisory only. The backend Policy Engine remains
    responsible for the final access-control decision.
    """

    return {
        "user_id": user_id,
        "session_id": session_id,
        "analysis": {
            "risk_level": "UNKNOWN",
            "anomaly_score": 0.0,
            "confidence": 0.0,
            "ml": {
                "anomaly_score": 0.0,
                "is_anomaly": False,
                "severity": "UNKNOWN",
                "model": "unavailable",
            },
            "baseline_deviation": {
                "score": 0.0,
                "severity": "UNKNOWN",
                "feature_deviations": {},
            },
            "signals": ["ai_service_unavailable"],
            "explanation": (
                "AI behavioural analysis was unavailable. "
                "The session must be evaluated by the backend "
                "Policy Engine using its deterministic controls."
            ),
            "recommendation": "VERIFY",
            "assessment": {
                "severity": "UNKNOWN",
                "confidence": 0.0,
                "summary": (
                    "AI analysis could not be completed safely."
                ),
                "primary_concerns": [
                    reason,
                    "AI output must not be treated as trusted evidence.",
                ],
                "signal_count": 1,
                "behavioural_deviation": 0.0,
                "anomaly_score": 0.0,
                "recommendation": "VERIFY",
            },
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
