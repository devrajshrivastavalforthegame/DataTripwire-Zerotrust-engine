import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, ArrowDownToLine, Database, FileWarning, RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react";
import { api } from "../../api";
import "./DataExposureRisk.css";
import { dataExposureDemo } from "../../fixtures/dataExposureDemo";

const DEMO_ENABLED = import.meta.env.DEV && import.meta.env.VITE_DATA_EXPOSURE_DEMO === "true";
const number = value => value == null || !Number.isFinite(Number(value)) ? "—" : Number(value).toLocaleString();
const formatBytes = value => {
  if (value == null || !Number.isFinite(Number(value))) return null;
  const bytes = Number(value);
  if (bytes < 1000) return `${bytes} B`;
  if (bytes < 1_000_000) return `${(bytes / 1000).toFixed(1)} KB`;
  if (bytes < 1_000_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${(bytes / 1_000_000_000).toFixed(2)} GB`;
};
const severityFor = score => score == null || !Number.isFinite(Number(score)) ? "unknown" : score >= 70 ? "high" : score >= 40 ? "medium" : "low";

function Metric({ icon: Icon, label, value, detail }) {
  return <div className="dt-exposure-metric"><span className="dt-exposure-metric-icon"><Icon size={15}/></span><span className="dt-exposure-metric-label">{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</div>;
}

function RiskScore({ label, value, primary = false }) {
  const severity = severityFor(value);
  return <div className={`dt-exposure-score ${primary ? "primary" : ""} ${severity}`}>
    <div className="dt-exposure-score-heading"><span>{label}</span><strong>{value == null ? "—" : `${number(value)} / 100`}</strong></div>
    <div className="dt-exposure-score-track" aria-label={`${label}: ${value == null ? "not available" : value}`}><i style={{ width: value == null ? "0%" : `${Math.max(0, Math.min(100, Number(value)))}%` }}/></div>
    <span className={`dt-exposure-severity ${severity}`}>{severity === "unknown" ? "Not available" : severity + " risk"}</span>
  </div>;
}

export default function DataExposureRisk() {
  const [windowKey, setWindowKey] = useState("7d");
  const [payload, setPayload] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  const load = async () => {
    setStatus("loading");
    setError("");
    try {
      const response = await api.securityDataExposure(windowKey);
      if (!response || !response.metrics) {
        setPayload(null);
        setStatus("empty");
        return;
      }
      setPayload(response);
      setStatus("ready");
    } catch (err) {
      if (DEMO_ENABLED) {
        setPayload({ ...dataExposureDemo, window: windowKey, demo: true });
        setStatus("ready");
      } else {
        setPayload(null);
        setError(err?.message || "Could not load data-exposure metrics.");
        setStatus(err?.status === 404 ? "unavailable" : "error");
      }
    }
  };

  useEffect(() => { load(); }, [windowKey]);

  const metrics = payload?.metrics || {};
  const reasons = useMemo(() => Array.isArray(payload?.reason_codes) ? payload.reason_codes : [], [payload]);
  const bytes = formatBytes(metrics.recorded_bytes);
  const decision = payload?.decision;
  const decisionTone = ["BLOCK", "RESTRICT"].includes(String(decision || "").toUpperCase()) ? "danger" : ["VERIFY", "CHALLENGE"].includes(String(decision || "").toUpperCase()) ? "warning" : "neutral";

  return <section className="sec-panel dt-exposure-panel" aria-labelledby="dt-exposure-title">
    <div className="sec-panel-header dt-exposure-header">
      <div><span className="sec-section-label">INSIDER DATA RISK</span><h2 id="dt-exposure-title">Data Exposure Risk</h2><p>Data access can be risky even when sign-in behaviour looks normal.</p></div>
      <div className="dt-exposure-controls"><label htmlFor="dt-exposure-window">Time window</label><select id="dt-exposure-window" value={windowKey} onChange={e => setWindowKey(e.target.value)}><option value="24h">Previous 24 hours</option><option value="7d">Previous 7 days</option></select><button className="sec-secondary-button" onClick={load} disabled={status === "loading"} aria-label="Refresh data exposure metrics"><RefreshCw size={13}/>Refresh</button></div>
    </div>
    {payload?.demo && <div className="dt-exposure-demo"><AlertTriangle size={14}/> DEMO DATA — illustrative fixture only; not live employee telemetry.</div>}
    {status === "loading" && <div className="dt-exposure-state"><span className="dt-exposure-spinner"/><strong>Loading exposure evidence…</strong><span>Requesting the selected window from the security API.</span></div>}
    {(status === "error" || status === "unavailable") && <div className="dt-exposure-state error"><ShieldAlert size={20}/><strong>{status === "unavailable" ? "Data exposure API not connected" : "Exposure metrics unavailable"}</strong><span>{error}</span><small>{status === "unavailable" ? "Confirm the endpoint and response contract with Devraj and Rohith. No sample scores are shown in live mode." : "Check the API service and your access, then refresh."}</small><button className="sec-secondary-button" onClick={load}>Try again</button></div>}
    {status === "empty" && <div className="dt-exposure-state"><Database size={22}/><strong>No exposure metrics for this window</strong><span>The API returned no metrics. This is not interpreted as zero risk.</span></div>}
    {status === "ready" && payload && <div className="dt-exposure-content">
      <div className="dt-exposure-score-grid"><RiskScore label="Data exposure risk" value={payload.data_exposure_risk} primary/><RiskScore label="Behaviour risk" value={payload.behavior_risk}/><RiskScore label="Overall risk" value={payload.overall_risk}/><div className="dt-exposure-decision"><span>BACKEND POLICY DECISION</span><strong className={decisionTone}>{decision || "Not provided"}</strong><small>Displayed from the API response; not calculated in the browser.</small></div></div>
      <div className="dt-exposure-metrics"><Metric icon={FileWarning} label="Sensitive accesses" value={number(metrics.sensitive_access_count)}/><Metric icon={ArrowDownToLine} label="Downloads" value={number(metrics.download_count)}/><Metric icon={Activity} label="Exports" value={number(metrics.export_count)}/><Metric icon={Database} label="Unique sensitive resources" value={number(metrics.unique_resources)}/>{bytes && <Metric icon={Database} label="Recorded data volume" value={bytes} detail="Recorded by backend"/>}</div>
      <div className="dt-exposure-evidence"><div className="dt-exposure-evidence-title"><ShieldCheck size={15}/><strong>Why it was flagged</strong><span>{reasons.length} reason code{reasons.length === 1 ? "" : "s"}</span></div>{reasons.length ? <div className="dt-exposure-reasons">{reasons.map(code => <span key={code}>{String(code).replaceAll("_", " ")}</span>)}</div> : <p>No reason codes were supplied by the API.</p>}{Array.isArray(payload.evidence) && payload.evidence.length > 0 && <ul className="dt-exposure-evidence-list">{payload.evidence.slice(0, 5).map((item, index) => <li key={item.id || index}><strong>{item.action || item.event_type || "Recorded event"}</strong><span>{item.resource_name || item.resource || "Resource not specified"}</span><time>{item.timestamp ? new Date(item.timestamp).toLocaleString() : "Timestamp unavailable"}</time></li>)}</ul>}</div>
      <div className="dt-exposure-footnote"><span>Window: <strong>{payload.window || windowKey}</strong></span><span>Subject: <strong>{payload.user_id || "Aggregate"}</strong></span><span>Missing values are shown as unavailable, never assumed to be zero.</span></div>
    </div>}
  </section>;
}
