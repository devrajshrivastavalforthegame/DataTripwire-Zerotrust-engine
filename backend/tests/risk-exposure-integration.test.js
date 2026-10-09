import { jest } from "@jest/globals";

const query = jest.fn();
const getUserDataExposureRisk = jest.fn();
jest.unstable_mockModule("../src/config/database.js", () => ({ query }));
jest.unstable_mockModule("../src/services/risk/data-exposure.service.js", () => ({
    getUserDataExposureRisk
}));

const { calculateScores, evaluateAndSave, decisionForScore } =
    await import("../src/services/risk/risk.service.js");

describe("risk fusion with insider data exposure", () => {
    beforeEach(() => {
        query.mockReset();
        getUserDataExposureRisk.mockReset();
    });

    test("high exposure risk overrides low behavior risk", () => {
        const result = calculateScores({
            event: { event_type: "RESOURCE_ACCESS", request_count: 1 },
            baseline: null,
            previousScore: 10,
            dataExposureRisk: {
                score: 72,
                severity: "CRITICAL",
                factors: [{ code: "SENSITIVE_DATA_MOVEMENT", points: 20, detail: "Repeated sensitive downloads observed." }]
            }
        });

        expect(result.behaviorScore).toBe(5);
        expect(result.dataExposureScore).toBe(72);
        expect(result.score).toBe(72);
        expect(result.decision).toBe("RESTRICT");
        expect(result.ats).toBe(72);
        expect(result.sts).toBe(28);
        expect(result.factors.map(factor => factor.type)).toContain("data_exposure_risk");
        expect(result.factors.map(factor => factor.type)).toContain("data_exposure_sensitive_data_movement");
    });

    test("leaves behavior-only scoring unchanged when exposure is zero", () => {
        const withoutExposure = calculateScores({
            event: { request_count: 50 },
            baseline: null,
            previousScore: 5
        });
        const withZeroExposure = calculateScores({
            event: { request_count: 50 },
            baseline: null,
            previousScore: 5,
            dataExposureRisk: { score: 0, severity: "LOW", factors: [] }
        });

        expect(withoutExposure.score).toBe(withZeroExposure.score);
        expect(withoutExposure.decision).toBe(withZeroExposure.decision);
        expect(withZeroExposure.dataExposureScore).toBe(0);
    });

    test("decoy access still forces quarantine", () => {
        const result = calculateScores({
            event: { request_count: 1 },
            baseline: null,
            previousScore: 0,
            isDecoy: true,
            dataExposureRisk: { score: 0, factors: [] }
        });
        expect(result.decision).toBe("QUARANTINE");
    });

    test("existing decision thresholds remain unchanged", () => {
        expect(decisionForScore(29)).toBe("ALLOW");
        expect(decisionForScore(30)).toBe("MONITOR");
        expect(decisionForScore(50)).toBe("VERIFY");
        expect(decisionForScore(70)).toBe("RESTRICT");
        expect(decisionForScore(85)).toBe("QUARANTINE");
    });

    test("evaluateAndSave persists fused score and evidence factors", async () => {
        query.mockImplementation(async sql => {
            if (sql.includes("SELECT * FROM user_baselines")) return { rows: [] };
            if (sql.includes("SELECT risk_score, sts_score")) return { rows: [{ risk_score: 10 }] };
            if (sql.includes("INSERT INTO risk_decisions")) return { rows: [{ id: "decision-1" }] };
            throw new Error("Unexpected SQL in test: " + sql);
        });
        getUserDataExposureRisk.mockResolvedValue({
            score: 72,
            severity: "CRITICAL",
            factors: [{ code: "SENSITIVE_DATA_MOVEMENT", points: 20, detail: "Repeated downloads." }],
            metrics: { sensitive_access_count: 8 }
        });

        const result = await evaluateAndSave({
            userId: "user-1",
            sessionId: "session-1",
            event: { id: "event-1", request_count: 1 }
        });

        expect(result.score).toBe(72);
        expect(result.decision).toBe("RESTRICT");
        const insertCall = query.mock.calls.find(([sql]) => sql.includes("INSERT INTO risk_decisions"));
        expect(insertCall[1][3]).toBe(72);
        expect(insertCall[1][4]).toBe("RESTRICT");
        expect(JSON.parse(insertCall[1][12])).toEqual(
            expect.arrayContaining([expect.objectContaining({ type: "data_exposure_risk" })])
        );
    });

    test("falls back to the existing behavior path when exposure analytics fails", async () => {
        query.mockImplementation(async sql => {
            if (sql.includes("SELECT * FROM user_baselines")) return { rows: [] };
            if (sql.includes("SELECT risk_score, sts_score")) return { rows: [{ risk_score: 10 }] };
            if (sql.includes("INSERT INTO risk_decisions")) return { rows: [{ id: "decision-1" }] };
            throw new Error("Unexpected SQL in test");
        });
        getUserDataExposureRisk.mockRejectedValue(new Error("analytics unavailable"));
        const loggedError = jest.spyOn(console, "error").mockImplementation(() => {});

        try {
            const result = await evaluateAndSave({
                userId: "user-1",
                sessionId: "session-1",
                event: { id: "event-1", request_count: 1 }
            });
            expect(result.dataExposureScore).toBe(0);
            expect(result.score).toBe(5);
            expect(result.decision).toBe("ALLOW");
        } finally {
            loggedError.mockRestore();
        }
    });
});
