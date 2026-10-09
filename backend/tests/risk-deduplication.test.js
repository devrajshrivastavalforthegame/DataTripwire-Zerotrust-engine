import { calculateScores } from "../src/services/risk/risk.service.js";

describe("risk factor accumulation", () => {
    test("repeated known factor types decay rather than stack on every request", () => {
        const event = {
            device_fingerprint: "new-device",
            location: "new-place",
            request_count: 1,
            metadata: { resource_type: "confidential" },
            action: "OPEN",
            created_at: new Date().toISOString()
        };
        const baseline = { known_devices: [], known_locations: [], common_resource_types: [] };
        const first = calculateScores({
            event,
            baseline,
            previousScore: 0,
            additionalFactors: [{ type: "protected_resource", points: 14, detail: "Confidential resource accessed." }]
        });
        const second = calculateScores({
            event,
            baseline,
            previousScore: first.score,
            previousFactors: first.factors,
            additionalFactors: [{ type: "protected_resource", points: 14, detail: "Confidential resource accessed." }]
        });

        expect(first.score).toBeGreaterThan(0);
        expect(second.score).toBe(first.score - 5);
        expect(second.decision).not.toBe("QUARANTINE");
        expect(second.factors.filter((factor) => factor.type === "protected_resource")).toHaveLength(1);
    });

    test("new high-impact factor increases risk while existing factors do not stack again", () => {
        const baseline = { known_devices: [], known_locations: [], common_resource_types: [] };
        const event = { device_fingerprint: "d1", location: "l1", request_count: 1, metadata: { resource_type: "confidential" }, action: "DOWNLOAD" };
        const result = calculateScores({
            event,
            baseline,
            previousScore: 51,
            previousFactors: ["new_device", "new_location", "unusual_resource", "protected_resource"],
            additionalFactors: [
                { type: "protected_resource", points: 14, detail: "Confidential resource accessed." },
                { type: "high_impact_action", points: 12, detail: "Download of protected resource." }
            ]
        });

        expect(result.factors.map((factor) => factor.type)).toContain("high_impact_action");
        expect(result.score).toBe(63);
        expect(result.decision).toBe("VERIFY");
    });

    test("decoy access always produces quarantine", () => {
        const result = calculateScores({ event: {}, baseline: {}, previousScore: 0, isDecoy: true });
        expect(result.decision).toBe("QUARANTINE");
        expect(result.score).toBeGreaterThanOrEqual(60);
    });
});
