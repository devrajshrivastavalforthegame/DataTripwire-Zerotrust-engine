from typing import List


class SecurityAssessmentService:
    """
    Converts behavioural analytics into a structured,
    human-readable security assessment.

    This service provides intelligence only.
    It does not enforce access control or security actions.
    """

    SIGNAL_DESCRIPTIONS = {
        "new_device": "A device not previously associated with the session was detected.",
        "new_location": "The session originated from a location not previously observed.",
        "unusual_time": "The activity occurred outside the expected working-time pattern.",
        "high_request_volume": "Request volume is significantly above the expected level.",
        "elevated_request_volume": "Request volume is moderately above the expected level.",
        "authorization_failures": "Multiple authorization failures were observed.",
        "elevated_authorization_failures": "Elevated authorization failures were observed.",
        "cross_domain_access": "The session accessed multiple unrelated resource domains.",
        "resource_enumeration": "The session accessed an unusually large number of resources.",
        "high_download_volume": "Download volume is significantly above the expected level.",
        "task_mismatch": "The accessed activity does not match the user's current task.",
        "responsibility_mismatch": "The activity falls outside the user's expected responsibility scope.",
        "sensitive_resource_access": "A sensitive resource was accessed.",
        "deception_interaction": "A deception or decoy resource was interacted with.",
    }

    def build_summary(
        self,
        risk_level: str,
        signals: List[str],
        anomaly_score: float,
        baseline_score: float,
    ) -> str:
        if not signals and risk_level == "LOW":
            return (
                "The session is consistent with the expected behavioural pattern "
                "and shows no significant security concerns."
            )

        if risk_level == "CRITICAL":
            return (
                "The session shows significant behavioural deviations and "
                "multiple security-relevant signals requiring immediate scrutiny."
            )

        if risk_level == "HIGH":
            return (
                "The session shows substantial behavioural deviations that "
                "indicate elevated security risk."
            )

        if risk_level == "MEDIUM":
            return (
                "The session shows moderate behavioural deviations that "
                "warrant additional verification."
            )

        return (
            "The session shows limited behavioural deviations that should "
            "be monitored."
        )

    def build_concerns(self, signals: List[str]) -> List[str]:
        concerns = []

        for signal in signals:
            description = self.SIGNAL_DESCRIPTIONS.get(signal)

            if description:
                concerns.append(description)

        return concerns

    def build_assessment(
        self,
        risk_level: str,
        anomaly_score: float,
        confidence: float,
        baseline_score: float,
        signals: List[str],
        recommendation: str,
    ) -> dict:
        concerns = self.build_concerns(signals)

        summary = self.build_summary(
            risk_level=risk_level,
            signals=signals,
            anomaly_score=anomaly_score,
            baseline_score=baseline_score,
        )

        return {
            "severity": risk_level,
            "confidence": confidence,
            "summary": summary,
            "primary_concerns": concerns,
            "signal_count": len(signals),
            "behavioural_deviation": round(baseline_score, 4),
            "anomaly_score": round(anomaly_score, 4),
            "recommendation": recommendation,
        }


security_assessment_service = SecurityAssessmentService()
