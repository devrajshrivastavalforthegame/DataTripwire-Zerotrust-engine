import { calculateExposureRisk } from "../src/controllers/exposure.controller.js";

describe("calculateExposureRisk", () => {
  test("returns null transfer totals when no event has measured bytes", () => {
    const result = calculateExposureRisk([
      { action: "VIEW", classification: "CONFIDENTIAL", bytes_transferred: null, resource_id: "r1" },
    ]);
    expect(result.eventCount).toBe(1);
    expect(result.totalBytes).toBeNull();
    expect(result.sensitiveBytes).toBeNull();
    expect(result.DBR).toBeGreaterThan(0);
  });

  test("uses measured transfer bytes without inventing volume for unknown events", () => {
    const result = calculateExposureRisk([
      { action: "DOWNLOAD", classification: "RESTRICTED", bytes_transferred: 1024, resource_id: "r1" },
      { action: "VIEW", classification: "INTERNAL", bytes_transferred: null, resource_id: "r2" },
    ]);
    expect(result.totalBytes).toBe(1024);
    expect(result.sensitiveBytes).toBe(1024);
    expect(result.downloads).toBe(1);
  });

  test("ignores negative or non-numeric byte measurements", () => {
    const result = calculateExposureRisk([
      { action: "VIEW", classification: "INTERNAL", bytes_transferred: -50 },
      { action: "VIEW", classification: "INTERNAL", bytes_transferred: "unknown" },
    ]);
    expect(result.totalBytes).toBeNull();
    expect(result.sensitiveBytes).toBeNull();
  });
});
