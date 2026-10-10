import { assertSecureProductionOrigins } from "../src/config/production-origins.js";

describe("assertSecureProductionOrigins", () => {
  test("accepts HTTPS origins in production", () => {
    expect(() =>
      assertSecureProductionOrigins(
        new Set(["https://datatripwire.vercel.app", "https://admin.example.com"]),
        "production"
      )
    ).not.toThrow();
  });

  test("rejects HTTP origins in production", () => {
    expect(() =>
      assertSecureProductionOrigins(
        new Set(["https://datatripwire.vercel.app", "http://localhost:5173"]),
        "production"
      )
    ).toThrow("Production CORS_ORIGINS must contain only valid HTTPS origins.");
  });

  test("rejects malformed origins in production", () => {
    expect(() =>
      assertSecureProductionOrigins(new Set(["not-a-valid-origin"]), "production")
    ).toThrow("Production CORS_ORIGINS must contain only valid HTTPS origins.");
  });

  test("rejects non-HTTPS schemes in production", () => {
    expect(() =>
      assertSecureProductionOrigins(new Set(["ftp://example.com"]), "production")
    ).toThrow("Production CORS_ORIGINS must contain only valid HTTPS origins.");
  });

  test("does not block local HTTP origins outside production", () => {
    expect(() =>
      assertSecureProductionOrigins(
        new Set(["http://localhost:5173", "http://127.0.0.1:5173"]),
        "development"
      )
    ).not.toThrow();
  });

  test("treats production environment matching as case-insensitive", () => {
    expect(() =>
      assertSecureProductionOrigins(new Set(["http://localhost:5173"]), "PRODUCTION")
    ).toThrow("Production CORS_ORIGINS must contain only valid HTTPS origins.");
  });
});
