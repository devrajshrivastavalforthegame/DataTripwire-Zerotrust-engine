from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.services import behaviour_analysis_service
from app.assessment_service import security_assessment_service
from app.models.response import AnalyzeResponse
from app.fallback import build_safe_fallback


app = FastAPI(
    title="DataTripwire AI Service",
    description=(
        "Behavioural analytics and security intelligence service "
        "for the DataTripwire Zero Trust Engine."
    ),
    version="1.0.0",
)

# Keep browser access opt-in. In production, configure AI_ALLOWED_ORIGINS with
# exact HTTPS origins. Backend-to-AI service traffic does not use browser CORS.
_default_ai_origins = (
    "http://localhost:5173,http://127.0.0.1:5173"
    if __import__("os").environ.get("NODE_ENV", "development").lower() != "production"
    else ""
)
_ai_origins = [
    origin.strip()
    for origin in __import__("os").environ.get("AI_ALLOWED_ORIGINS", _default_ai_origins).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_ai_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)


class DeviceContext(BaseModel):
    is_new: bool = False


class LocationContext(BaseModel):
    is_new: bool = False


class TimeContext(BaseModel):
    is_unusual: bool = False


class ActivityContext(BaseModel):
    # None means "not measured"; zero means measured and none observed.
    requests_per_minute: float | None = Field(default=None, ge=0)
    unique_resources: int | None = Field(default=None, ge=0)
    records_accessed: int | None = Field(default=None, ge=0)
    download_volume_mb: float | None = Field(default=None, ge=0)
    authorization_failures: int | None = Field(default=None, ge=0)
    cross_domain_access: int | None = Field(default=None, ge=0)


class SecurityContext(BaseModel):
    role: str = ""
    responsibility: str = ""
    task: str = ""
    resource: str = ""
    action: str = ""
    scope: str = ""
    sts: float = 0
    ats: float = 0
    session_status: str = "active"

    # None means the backend has not measured/confirmed this relationship.
    task_match: bool | None = None
    responsibility_match: bool | None = None
    sensitive_resource: bool = False
    deception_interaction: bool = False


class AnalyzeRequest(BaseModel):
    user_id: str
    session_id: str = ""

    risk_score: float = Field(default=0, ge=0, le=100)
    decision: str = "ALLOW"
    reasons: list[str] = Field(default_factory=list)

    device: DeviceContext = DeviceContext()
    location: LocationContext = LocationContext()
    time_context: TimeContext = TimeContext()
    activity: ActivityContext = ActivityContext()
    context: SecurityContext = SecurityContext()

@app.get("/health")
def health():
    return {
        "service": "ai-service",
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def analyze_behaviour(data: AnalyzeRequest):
    signals = []
    score_by_signal = {}

    def add_signal(name, weight):
        if name not in signals:
            signals.append(name)
        # The same signal can arrive from backend reasons and derived context.
        # Keep the strongest single contribution rather than counting it twice.
        score_by_signal[name] = max(score_by_signal.get(name, 0.0), weight)

    # Consume evidence already identified by the backend Risk Engine.
    for reason in data.reasons:
        if reason not in signals:
            signals.append(reason)

    # Translate backend risk evidence into AI advisory signals.
    reason_weights = {
        "new_device": 0.10,
        "new_location": 0.08,
        "unusual_login_time": 0.08,
        "high_request_volume": 0.18,
        "unusual_resource": 0.12,
        "unusual_action": 0.08,
        "scope_violation": 0.15,
        "decoy_access": 0.25,
    }

    for reason in data.reasons:
        if reason in reason_weights:
            add_signal(reason, reason_weights[reason])


    if data.device.is_new:
        add_signal("new_device", 0.10)

    if data.location.is_new:
        add_signal("new_location", 0.08)

    if data.time_context.is_unusual:
        add_signal("unusual_time", 0.08)

    if data.activity.requests_per_minute is not None and data.activity.requests_per_minute >= 60:
        add_signal("high_request_volume", 0.18)
    elif data.activity.requests_per_minute is not None and data.activity.requests_per_minute >= 30:
        add_signal("elevated_request_volume", 0.10)

    if data.activity.authorization_failures is not None and data.activity.authorization_failures >= 5:
        add_signal("authorization_failures", 0.15)
    elif data.activity.authorization_failures is not None and data.activity.authorization_failures >= 2:
        add_signal("elevated_authorization_failures", 0.08)

    if data.activity.cross_domain_access is not None and data.activity.cross_domain_access >= 3:
        add_signal("cross_domain_access", 0.15)

    if data.activity.unique_resources is not None and data.activity.unique_resources >= 15:
        add_signal("resource_enumeration", 0.15)

    if data.activity.download_volume_mb is not None and data.activity.download_volume_mb >= 100:
        add_signal("high_download_volume", 0.12)

    if data.context.task_match is False:
        add_signal("task_mismatch", 0.12)

    if data.context.responsibility_match is False:
        add_signal("responsibility_mismatch", 0.15)

    if data.context.sensitive_resource:
        add_signal("sensitive_resource_access", 0.10)

    if data.context.deception_interaction:
        add_signal("deception_interaction", 0.25)

    ml_features = {
        key: value for key, value in {
            "requests_per_minute": data.activity.requests_per_minute,
            "unique_resources": data.activity.unique_resources,
            "records_accessed": data.activity.records_accessed,
            "download_volume_mb": data.activity.download_volume_mb,
            "authorization_failures": data.activity.authorization_failures,
            "cross_domain_access": data.activity.cross_domain_access,
        }.items() if value is not None
    }

    # The current ML model expects a complete feature vector. Partial telemetry
    # must not be silently padded with invented zeroes.
    has_activity_telemetry = bool(ml_features) and all(
        value is not None for value in [
            data.activity.requests_per_minute,
            data.activity.unique_resources,
            data.activity.records_accessed,
            data.activity.download_volume_mb,
            data.activity.authorization_failures,
            data.activity.cross_domain_access,
        ]
    )

    if has_activity_telemetry:
    	ml_analysis = behaviour_analysis_service.analyze_ml(ml_features)
    else:
    	ml_analysis = {
          "ml": {
             "anomaly_score": 0.0,
             "is_anomaly": False,
             "severity": "UNAVAILABLE",
             "model": "isolation_forest_not_run",
          },
          "baseline_deviation": {
              "score": 0.0,
              "severity": "UNAVAILABLE",
              "feature_deviations": {},
           },
     	}

    anomaly_score = min(1.0, sum(score_by_signal.values()))

    if anomaly_score >= 0.85:
        risk_level = "CRITICAL"
        recommendation = "QUARANTINE"
    elif anomaly_score >= 0.70:
        risk_level = "HIGH"
        recommendation = "RESTRICT"
    elif anomaly_score >= 0.50:
        risk_level = "MEDIUM"
        recommendation = "VERIFY"
    elif anomaly_score >= 0.30:
        risk_level = "LOW-MEDIUM"
        recommendation = "MONITOR"
    else:
        risk_level = "LOW"
        recommendation = "ALLOW"

    if not signals:
        explanation = (
            "Current activity is consistent with the expected "
            "behavioural pattern."
        )
    else:
        explanation = (
            "The session shows behavioural deviations involving: "
            + ", ".join(signals)
            + "."
        )

    confidence = min(
        0.99,
        0.70 + (len(signals) * 0.04),
    )

    assessment = security_assessment_service.build_assessment(
        risk_level=risk_level,
        anomaly_score=anomaly_score,
        confidence=confidence,
        baseline_score=ml_analysis["baseline_deviation"]["score"],
        signals=signals,
        recommendation=recommendation,
    )

    return {
        "risk_level": risk_level,
        "anomaly_score": round(anomaly_score, 4),
        "confidence": round(confidence, 2),
        "ml": ml_analysis["ml"],
        "baseline_deviation": ml_analysis["baseline_deviation"],
        "signals": signals,
        "explanation": explanation,
	"recommendation": recommendation,
	"recommendation_type": "ADVISORY_ONLY",
	"backend_decision": data.decision,
	"assessment": assessment,
    }


@app.post("/api/v1/analyze", response_model=AnalyzeResponse)
def analyze(data: AnalyzeRequest):
    try:
        result = analyze_behaviour(data)

        return {
            "user_id": data.user_id,
            "session_id": data.session_id,
            "analysis": result,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    except Exception as exc:
        print(f"[AI ERROR] {type(exc).__name__}: {exc}")

        return build_safe_fallback(
            user_id=data.user_id,
            session_id=data.session_id,
            reason=f"AI analysis failure: {type(exc).__name__}",
        )


class FeatureVector(BaseModel):
    requests_per_minute: float = 0
    unique_resources: int = 0
    records_returned: int = 0
    download_volume_mb: float = 0
    authorization_failures: int = 0
    cross_domain_access_count: int = 0
    resource_switch_rate: float = 0


@app.post("/v1/anomaly-score")
def anomaly_score(features: FeatureVector):
    signal = min(
        1.0,
        (
            (features.requests_per_minute / 120.0)
            + (features.authorization_failures / 20.0)
            + (features.cross_domain_access_count / 10.0)
        ) / 3.0,
    )

    return {
        "anomaly_score": round(signal, 4),
        "interpretation": "prototype anomaly signal only",
    }
