import math

from app.models.baseline import NORMAL_BEHAVIOUR_SAMPLES
from app.models.isolation_forest import BehaviourAnomalyDetector


class BehaviourAnalysisService:
    FEATURE_NAMES = [
        "requests_per_minute",
        "unique_resources",
        "records_accessed",
        "download_volume_mb",
        "authorization_failures",
        "cross_domain_access",
    ]

    FEATURE_STD = {
        "requests_per_minute": 2.0,
        "unique_resources": 1.2,
        "records_accessed": 10.0,
        "download_volume_mb": 1.0,
        "authorization_failures": 0.25,
        "cross_domain_access": 0.25,
    }

    def __init__(self):
        self.detector = BehaviourAnomalyDetector()
        self.detector.fit(NORMAL_BEHAVIOUR_SAMPLES)
        self.baseline_means = self._calculate_baseline_means()

    def _calculate_baseline_means(self) -> dict:
        means = {}

        for feature in self.FEATURE_NAMES:
            values = [
                float(sample.get(feature, 0))
                for sample in NORMAL_BEHAVIOUR_SAMPLES
            ]

            means[feature] = (
                sum(values) / len(values)
                if values
                else 0.0
            )

        return means

    def _calculate_baseline_deviation(self, features: dict) -> dict:
        squared_deviations = []
        feature_deviations = {}

        for feature in self.FEATURE_NAMES:
            current = float(features.get(feature, 0))
            mean = self.baseline_means[feature]
            std = self.FEATURE_STD.get(feature, 1.0)

            if std <= 0:
                std = 1.0

            z_score = abs(current - mean) / std

            feature_deviations[feature] = round(z_score, 3)
            squared_deviations.append(z_score ** 2)

        distance = math.sqrt(
            sum(squared_deviations) / len(squared_deviations)
        )

        deviation_score = 1.0 - math.exp(-distance / 3.0)
        deviation_score = max(
            0.0,
            min(1.0, deviation_score),
        )

        if deviation_score >= 0.75:
            severity = "CRITICAL"
        elif deviation_score >= 0.55:
            severity = "HIGH"
        elif deviation_score >= 0.30:
            severity = "MEDIUM"
        else:
            severity = "LOW"

        return {
            "score": round(deviation_score, 4),
            "severity": severity,
            "feature_deviations": feature_deviations,
        }

    def analyze_ml(self, features: dict) -> dict:
        ml_result = self.detector.predict(features)
        baseline_result = self._calculate_baseline_deviation(features)

        return {
            "ml": ml_result,
            "baseline_deviation": baseline_result,
        }


behaviour_analysis_service = BehaviourAnalysisService()
