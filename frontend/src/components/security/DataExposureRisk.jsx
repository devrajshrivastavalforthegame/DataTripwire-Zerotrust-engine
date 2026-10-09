import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  Copy,
  Database,
  FileWarning,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";
import { api } from "../../api";
import "./DataExposureRisk.css";
import { dataExposureDemo } from "../../fixtures/dataExposureDemo";

const DEMO_ENABLED = import.meta.env.DEV && import.meta.env.VITE_DATA_EXPOSURE_DEMO === "true";
const number = value => value == null || !Number.isFinite(Number(value)) ? "—" : Number(value).toLocaleString();
const score = value => value == null || !Number.isFinite(Number(value)) ? null : Math.max(0, Math.min(100, Number(value)));
const formatBytes = value => {
  if (value == null || !Number.isFinite(Number(value))) return null;
  const bytes = Number(value);
  if (bytes < 1000) return `${bytes} B`;
  if (bytes < 1_000_000) return `${(bytes / 1000).toFixed(1)} KB`;
  if (bytes < 1_000_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${(bytes / 1_000_000_000).toFixed(2)} GB`;
};
const severityClass = value => {
  const normalized = String(value || "").toUpperCase();
  return ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(normalized) ? normalized.toLowerCase() : "unknown";
};
const trendLabel = value => ({
  NO_ACTIVITY: "No activity",
  RISING: "Rising",
  DECLINING: "Declining",
  STABLE: "Stable"
}[String(value || "").toUpperCase()] || "Trend unavailable");
const formatDate = value => {
  if (!value) return "No event time recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Timestamp unavailable" : date.toLocaleString();
};
const titleFromCode = value => String(value || "").replaceAll("_", " ");

function Metric({ icon: Icon, label, value, detail }) {
  return <div className="dt-exposure-metric">
    <span className="dt-exposure-metric-icon"><Icon size={15} /></span>
    <span className="dt-exposure-metric-label">{label}</span>
    <strong>{value}</strong>
    {detail && <small>{detail}</small>}
  </div>;
}

function RiskScore({ label, value, severity }) {
  const numeric = score(value);
  const tone = severityClass(severity);
  return <div className={`dt-exposure-score primary ${tone}`}>
    <div className="dt-exposure-score-heading">
      <span>{label}</span>
      <strong>{numeric == null ? "—" : `${number(numeric)} / 100`}</strong>
    </div>
    <div className="dt-exposure-score-track" aria-label={`${label}: ${numeric == null ? "not available" : numeric}`}>
      <i style={{ width: numeric == null ? "0%" : `${numeric}%` }} />
    </div>
    <span className={`dt-exposure-severity ${tone}`}>{tone === "unknown" ? "Severity unavailable" : severity}</span>
  </div>;
}

function Trend({ trend }) {
  const direction = String(trend?.direction || "").toUpperCase();
  const Icon = direction === "RISING" ? TrendingUp : direction === "DECLINING" ? TrendingDown : direction === "STABLE" || direction === "NO_ACTIVITY" ? Minus : Activity;
  const tone = direction === "RISING" ? "danger" : direction === "DECLINING" ? "positive" : "neutral";
  return <span className={`dt-exposure-trend ${tone}`}><Icon size={13} />{trendLabel(direction)}{trend?.activity_signal_delta == null ? "" : ` · signal Δ ${number(trend.activity_signal_delta)}`}</span>;
}

function UserAssessment({ user, windowKey }) {
  const current = user.current || {};
  const previous = user.previous || {};
  const metrics = current.metrics || {};
  const priorMetrics = previous.metrics || {};
  const factors = Array.isArray(current.factors) ? current.factors : [];
  const bytes = formatBytes(metrics.recorded_bytes);
  const previousRisk = score(previous.data_exposure_risk);
  const currentRisk = score(current.data_exposure_risk);
  const lastEvent = formatDate(user.last_event_at);

  return <article className="dt-exposure-user-card">
    <div className="dt-exposure-user-heading">
      <div className="dt-exposure-user-identity">
        <span className="dt-exposure-user-avatar"><ShieldAlert size={17} /></span>
        <div>
          <h3>{user.username || "Unnamed user"}</h3>
          <p>{user.role || "Role unavailable"} <span>·</span> {user.user_id || "User ID unavailable"}</p>
        </div>
      </div>
      <Trend trend={user.trend} />
    </div>

    <div className="dt-exposure-user-score-grid">
      <RiskScore label={`Current exposure · ${windowKey}`} value={currentRisk} severity={current.severity} />
      <div className="dt-exposure-previous-score">
        <span>Previous equal-length window</span>
        <strong>{previousRisk == null ? "—" : `${number(previousRisk)} / 100`}</strong>
        <span className={`dt-exposure-severity ${severityClass(previous.severity)}`}>{previous.severity || "Severity unavailable"}</span>
        <small>Comparison: preceding {windowKey}</small>
      </div>
    </div>

    <div className="dt-exposure-metrics">
      <Metric icon={FileWarning} label="Sensitive accesses" value={number(metrics.sensitive_access_count)} detail={`Previous: ${number(priorMetrics.sensitive_access_count)}`} />
      <Metric icon={ArrowDownToLine} label="Sensitive downloads" value={number(metrics.sensitive_download_count)} detail={`Previous: ${number(priorMetrics.sensitive_download_count)}`} />
      <Metric icon={Copy} label="Sensitive copies" value={number(metrics.sensitive_copy_count)} detail={`Previous: ${number(priorMetrics.sensitive_copy_count)}`} />
      <Metric icon={Activity} label="Sensitive exports" value={number(metrics.sensitive_export_count)} detail={`Previous: ${number(priorMetrics.sensitive_export_count)}`} />
      <Metric icon={ArrowDownToLine} label="Bulk downloads" value={number(metrics.sensitive_bulk_download_count)} detail={`Previous: ${number(priorMetrics.sensitive_bulk_download_count)}`} />
      <Metric icon={Database} label="Unique sensitive resources" value={number(metrics.unique_sensitive_resources)} detail={`Previous: ${number(priorMetrics.unique_sensitive_resources)}`} />
      <Metric icon={Database} label="Recorded data volume" value={bytes || "Not captured"} detail={metrics.byte_volume_status === "NOT_CAPTURED" || metrics.recorded_bytes == null ? "Backend does not collect byte volume" : "Reported by backend"} />
    </div>

    <div className="dt-exposure-evidence">
      <div className="dt-exposure-evidence-title"><ShieldCheck size={15} /><strong>Risk factors and explanation</strong><span>{factors.length} factor{factors.length === 1 ? "" : "s"}</span></div>
      {factors.length ? <div className="dt-exposure-factors">
        {factors.map((factor, index) => <div className="dt-exposure-factor" key={`${factor.code || "factor"}-${index}`}>
          <div><strong>{titleFromCode(factor.code)}</strong>{factor.points != null && <span>+{number(factor.points)} points</span>}</div>
          {factor.detail && <p>{factor.detail}</p>}
        </div>)}
      </div> : <p>No risk factors were supplied for the current window.</p>}
    </div>

    <div className="dt-exposure-footnote">
      <span>Last matching event: <strong>{lastEvent}</strong></span>
      <span>Risk model: <strong>Explainable heuristic</strong></span>
    </div>
  </article>;
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
      const response = await api.securityDataExposure(windowKey, 50);
      if (!response || !Array.isArray(response.users) || !Number.isFinite(Number(response.count))) {
        throw new Error("The data-exposure API returned a response that does not match DATA_EXPOSURE_API_CONTRACT.md.");
      }
      setPayload(response);
      setStatus("ready");
    } catch (err) {
      if (DEMO_ENABLED) {
        setPayload({ ...dataExposureDemo, window: { key: windowKey }, demo: true });
        setStatus("ready");
      } else {
        setPayload(null);
        setError(err?.message || "Could not load data-exposure report.");
        setStatus(err?.status === 404 ? "unavailable" : "error");
      }
    }
  };

  useEffect(() => { load(); }, [windowKey]);

  const users = Array.isArray(payload?.users) ? payload.users : [];
  const isEmpty = status === "ready" && (Number(payload?.count) === 0 || users.length === 0);
  const windowLabel = payload?.window?.key || windowKey;

  return <section className="sec-panel dt-exposure-panel" aria-labelledby="dt-exposure-title">
    <div className="sec-panel-header dt-exposure-header">
      <div>
        <span className="sec-section-label">INSIDER DATA RISK</span>
        <h2 id="dt-exposure-title">Data Exposure Risk</h2>
        <p>Per-user exposure from sensitive-resource activity—even when sign-in behaviour looks normal.</p>
      </div>
      <div className="dt-exposure-controls">
        <label htmlFor="dt-exposure-window">Comparison window</label>
        <select id="dt-exposure-window" value={windowKey} onChange={event => setWindowKey(event.target.value)}>
          <option value="24h">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </select>
        <button className="sec-secondary-button" onClick={load} disabled={status === "loading"} aria-label="Refresh data exposure report"><RefreshCw size={13} />Refresh</button>
      </div>
    </div>

    {payload?.demo && <div className="dt-exposure-demo"><AlertTriangle size={14} /> DEMO DATA — illustrative fixture only; not live employee telemetry.</div>}

    {status === "loading" && <div className="dt-exposure-state"><span className="dt-exposure-spinner" /><strong>Loading per-user exposure report…</strong><span>Requesting the selected comparison window from the security API.</span></div>}

    {(status === "error" || status === "unavailable") && <div className="dt-exposure-state error">
      <ShieldAlert size={20} />
      <strong>{status === "unavailable" ? "Data exposure API not found" : "Exposure report unavailable"}</strong>
      <span>{error}</span>
      {status === "error" && <small>{error.includes("403") || error.toLowerCase().includes("permission") ? "This report requires the users:read permission. Check the signed-in account." : "Check the API service and your access, then refresh."}</small>}
      <button className="sec-secondary-button" onClick={load}>Try again</button>
    </div>}

    {isEmpty && <div className="dt-exposure-state"><Database size={22} /><strong>No matching sensitive-resource activity</strong><span>No users matched the report's sensitive-resource activity criteria in either comparison window. This does not mean every user has zero risk.</span></div>}

    {status === "ready" && payload && !isEmpty && <div className="dt-exposure-content">
      <div className="dt-exposure-report-summary">
        <div><span>USERS WITH MATCHING ACTIVITY</span><strong>{number(payload.count)}</strong><small>Maximum {number(50)} users requested</small></div>
        <div><span>REPORT WINDOW</span><strong>{windowLabel}</strong><small>Compared with preceding equal-length window</small></div>
        <div><span>GENERATED</span><strong>{formatDate(payload.generated_at)}</strong><small>Backend report timestamp</small></div>
      </div>
      {payload.telemetry_note && <div className="dt-exposure-contract-note"><AlertTriangle size={14} /><span>{payload.telemetry_note}</span></div>}
      {payload.risk_note && <p className="dt-exposure-risk-note">{payload.risk_note}</p>}
      <div className="dt-exposure-users">
        {users.map(user => <UserAssessment key={user.user_id} user={user} windowKey={windowLabel} />)}
      </div>
      <div className="dt-exposure-footnote"><span>Severity labels and factors are supplied by the backend.</span><span>Byte volume is unavailable when not captured; it is never treated as zero.</span></div>
    </div>}
  </section>;
}
