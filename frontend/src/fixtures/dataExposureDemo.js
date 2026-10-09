// Explicitly illustrative values for a local judging/demo walkthrough.
// Enabled only with VITE_DATA_EXPOSURE_DEMO=true in a development environment.
export const dataExposureDemo = {
  generated_at: new Date().toISOString(),
  window: { hours: 168, key: "7d", comparison: "current window versus preceding equal-length window" },
  count: 1,
  classification_source: "resources.sensitivity",
  telemetry_note: "DEMO ONLY: byte volume is not captured and recorded_bytes is null.",
  risk_note: "Illustrative heuristic report only. This fixture is not live employee telemetry.",
  demo: true,
  users: [{
    user_id: "demo-user-01",
    username: "demo.employee",
    role: "employee",
    current: {
      metrics: {
        sensitive_access_count: 24,
        sensitive_download_count: 8,
        sensitive_copy_count: 2,
        sensitive_export_count: 1,
        sensitive_bulk_download_count: 1,
        unique_sensitive_resources: 12,
        recorded_bytes: null,
        byte_volume_status: "NOT_CAPTURED"
      },
      data_exposure_risk: 72,
      severity: "CRITICAL",
      factors: [
        { code: "SENSITIVE_ACCESS_ACTIVITY", points: 20, detail: "Illustrative repeated access to sensitive resources." },
        { code: "SENSITIVE_DATA_MOVEMENT", points: 42, detail: "Illustrative download, copy, and export activity." },
        { code: "EXPOSURE_INCREASE", points: 10, detail: "Illustrative increase compared with the previous window." }
      ]
    },
    previous: {
      metrics: {
        sensitive_access_count: 6,
        sensitive_download_count: 1,
        sensitive_copy_count: 0,
        sensitive_export_count: 0,
        sensitive_bulk_download_count: 0,
        unique_sensitive_resources: 3,
        recorded_bytes: null,
        byte_volume_status: "NOT_CAPTURED"
      },
      data_exposure_risk: 20,
      severity: "LOW",
      factors: []
    },
    trend: { direction: "RISING", activity_signal_delta: 18 },
    last_event_at: new Date().toISOString()
  }]
};
