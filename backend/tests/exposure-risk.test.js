import { calculateExposureRisk } from "../src/controllers/exposure.controller.js";

describe("cumulative data exposure risk", () => {
    test("sensitive movement increases exposure risk over a public view", () => {
        const low = calculateExposureRisk([
            { action: "VIEW", classification: "PUBLIC", resource_id: "a" }
        ]);
        const high = calculateExposureRisk([
            { action: "DOWNLOAD", classification: "CRITICAL", resource_id: "a", department: "Finance" },
            { action: "COPY", classification: "RESTRICTED", resource_id: "b", department: "HR" },
            { action: "BULK_DOWNLOAD", classification: "CRITICAL", resource_id: "c", department: "Engineering" }
        ]);

        expect(high.DER).toBeGreaterThan(low.DER);
        expect(high.ER).toBeGreaterThan(low.ER);
        expect(high.DBR).toBeGreaterThan(low.DBR);
        expect(["HIGH", "CRITICAL"]).toContain(high.level);
    });

    test("empty telemetry is a stable zero-risk baseline", () => {
        expect(calculateExposureRisk([])).toMatchObject({
            eventCount: 0,
            DER: 0,
            ER: 0,
            DBR: 0,
            level: "LOW",
            totalBytes: null,
            bytesVolumeStatus: "NOT_CAPTURED"
        });
    });

    test("unknown transfer volume is not represented as a measured zero", () => {
        const result = calculateExposureRisk([
            { action: "DOWNLOAD", classification: "CONFIDENTIAL", resource_id: "r1", bytes_transferred: null }
        ]);
        expect(result.totalBytes).toBeNull();
        expect(result.sensitiveBytes).toBeNull();
        expect(result.bytesVolumeStatus).toBe("NOT_CAPTURED");
    });

    test("uses only finite non-negative measured byte values", () => {
        const result = calculateExposureRisk([
            { action: "DOWNLOAD", classification: "CONFIDENTIAL", bytes_transferred: 1024 },
            { action: "COPY", classification: "RESTRICTED", bytes_transferred: null },
            { action: "EXPORT", classification: "CRITICAL", bytes_transferred: -5 }
        ]);
        expect(result.totalBytes).toBe(1024);
        expect(result.bytesMeasuredEvents).toBe(1);
        expect(result.bytesVolumeStatus).toBe("PARTIALLY_OR_FULLY_MEASURED");
    });
});
