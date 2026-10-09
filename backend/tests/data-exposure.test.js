import { jest } from "@jest/globals";

const query = jest.fn();
jest.unstable_mockModule("../src/config/database.js", () => ({ query }));

const {
    calculateDataExposureRisk,
    getDataExposureReport,
    parseExposureWindow
} = await import("../src/services/risk/data-exposure.service.js");

describe("parseExposureWindow", () => {
    test.each([
        ["24h", 24],
        ["7d", 168],
        ["30d", 720]
    ])("accepts %s", (key, hours) => {
        expect(parseExposureWindow(key)).toEqual({ key, hours });
    });

    test("defaults to 7 days", () => {
        expect(parseExposureWindow()).toEqual({ key: "7d", hours: 168 });
    });

    test("rejects unsupported windows", () => {
        expect(parseExposureWindow("all")).toBeNull();
    });
});

describe("calculateDataExposureRisk", () => {
    test("returns LOW with no sensitive activity", () => {
        expect(calculateDataExposureRisk({})).toMatchObject({
            score: 0,
            severity: "LOW",
            factors: []
        });
    });

    test("one sensitive open alone remains LOW", () => {
        const result = calculateDataExposureRisk({
            sensitive_access_count: 1,
            unique_sensitive_resources: 1
        }, 0);
        expect(result.score).toBe(2);
        expect(result.severity).toBe("LOW");
    });

    test("repeated movement across many resources raises the score", () => {
        const result = calculateDataExposureRisk({
            sensitive_access_count: 12,
            sensitive_download_count: 3,
            sensitive_copy_count: 1,
            sensitive_export_count: 1,
            unique_sensitive_resources: 6
        }, 4);
        expect(result.score).toBe(100);
        expect(result.severity).toBe("CRITICAL");
        expect(result.factors.map(item => item.code)).toContain("SENSITIVE_DATA_MOVEMENT");
    });

    test("adds a first-window trend bonus for a sudden burst of sensitive downloads", () => {
        const result = calculateDataExposureRisk({
            sensitive_access_count: 7,
            sensitive_download_count: 7,
            unique_sensitive_resources: 1
        }, 0);

        // Access: 14, movement: 40, first-window burst trend: 10.
        expect(result.score).toBe(64);
        expect(result.severity).toBe("HIGH");
        expect(result.factors.map(item => item.code)).toContain("EXPOSURE_INCREASE");
    });

    test("adds an explainable factor when activity rises", () => {
        const result = calculateDataExposureRisk({
            sensitive_access_count: 8,
            unique_sensitive_resources: 1
        }, 4);
        expect(result.factors.map(item => item.code)).toContain("EXPOSURE_INCREASE");
    });

    test("caps the score at 100", () => {
        const result = calculateDataExposureRisk({
            sensitive_access_count: 100,
            sensitive_download_count: 100,
            sensitive_copy_count: 100,
            sensitive_export_count: 100,
            sensitive_bulk_download_count: 100,
            unique_sensitive_resources: 100
        }, 1);
        expect(result.score).toBe(100);
        expect(result.severity).toBe("CRITICAL");
    });
});

describe("getDataExposureReport", () => {
    beforeEach(() => query.mockReset());

    test("uses the trusted resource catalogue and returns missing byte telemetry as null", async () => {
        query.mockResolvedValue({
            rows: [{
                user_id: "u-1",
                username: "employee",
                role: "employee",
                current_sensitive_access_count: 5,
                current_sensitive_download_count: 2,
                current_sensitive_copy_count: 0,
                current_sensitive_export_count: 0,
                current_sensitive_bulk_download_count: 0,
                current_unique_sensitive_resources: 2,
                previous_sensitive_access_count: 2,
                previous_sensitive_download_count: 0,
                previous_sensitive_copy_count: 0,
                previous_sensitive_export_count: 0,
                previous_sensitive_bulk_download_count: 0,
                previous_unique_sensitive_resources: 1,
                last_event_at: "2026-10-10T00:00:00.000Z"
            }]
        });

        const report = await getDataExposureReport({ windowHours: 168, limit: 10 });
        expect(query).toHaveBeenCalledWith(
            expect.stringContaining("JOIN resources r"),
            [168, 10]
        );
        expect(report.count).toBe(1);
        expect(report.users[0].current.metrics.recorded_bytes).toBeNull();
        expect(report.users[0].current.metrics.byte_volume_status).toBe("NOT_CAPTURED");
        expect(report.users[0].trend.direction).toBe("RISING");
    });
});
