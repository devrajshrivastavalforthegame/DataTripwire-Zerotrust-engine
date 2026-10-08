from typing import List

from pydantic import BaseModel, Field


class MLResult(BaseModel):
    anomaly_score: float = Field(ge=0.0, le=1.0)
    is_anomaly: bool
    severity: str
    model: str


class BaselineDeviation(BaseModel):
    score: float = Field(ge=0.0, le=1.0)
    severity: str
    feature_deviations: dict[str, float]


class SecurityAssessment(BaseModel):
    severity: str
    confidence: float = Field(ge=0.0, le=1.0)
    summary: str
    primary_concerns: List[str]
    signal_count: int = Field(ge=0)
    behavioural_deviation: float = Field(ge=0.0, le=1.0)
    anomaly_score: float = Field(ge=0.0, le=1.0)
    recommendation: str


class AnalysisResult(BaseModel):
    risk_level: str
    anomaly_score: float = Field(ge=0.0, le=1.0)
    confidence: float = Field(ge=0.0, le=1.0)
    ml: MLResult
    baseline_deviation: BaselineDeviation
    signals: List[str]
    explanation: str
    recommendation: str
    assessment: SecurityAssessment


class AnalyzeResponse(BaseModel):
    user_id: str
    session_id: str
    analysis: AnalysisResult
    timestamp: str