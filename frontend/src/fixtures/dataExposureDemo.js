// Explicitly illustrative values for a local judging/demo walkthrough.
// Enabled only with VITE_DATA_EXPOSURE_DEMO=true in a development environment.
export const dataExposureDemo = {
  user_id: "demo-user-01",
  window: "7d",
  metrics: { sensitive_access_count: 24, download_count: 8, export_count: 2, unique_resources: 12, recorded_bytes: 18000000 },
  data_exposure_risk: 72,
  behavior_risk: 18,
  overall_risk: 72,
  decision: "VERIFY",
  reason_codes: ["ELEVATED_SENSITIVE_ACCESS", "CUMULATIVE_EXPOSURE"]
};
