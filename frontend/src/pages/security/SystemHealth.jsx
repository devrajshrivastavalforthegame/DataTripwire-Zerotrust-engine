import { motion } from "motion/react";
import { Activity, CheckCircle2, Database, RefreshCw, Server } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../api";

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || "";

export default function SystemHealth() {
  const [backend, setBackend] = useState("Checking");
  const [ai, setAi] = useState(AI_SERVICE_URL ? "Checking" : "Not exposed to browser");
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      const result = await api.health();
      if (result && (result.status === "error" || result.ok === false)) throw new Error("Health endpoint reported a failure.");
      setBackend("Reachable");
    } catch (e) {
      setBackend("Unavailable");
      setError(e.message || "Backend health check failed.");
    }

    if (!AI_SERVICE_URL) {
      setAi("Not exposed to browser");
      return;
    }
    try {
      const response = await fetch(`${AI_SERVICE_URL.replace(/\/$/, "")}/health`, { method: "GET", headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`AI health returned HTTP ${response.status}`);
      setAi("Reachable");
    } catch {
      setAi("Unavailable");
    }
  };

  useEffect(() => { load(); }, []);

  const rows = [
    ["Backend API", backend],
    ["AI Service", ai],
    ["PostgreSQL", "Not independently checked"],
    ["Risk Engine", "Not independently checked"],
    ["Policy Engine", "Not independently checked"],
    ["Audit Service", "Not independently checked"],
  ];

  return (
    <motion.div className="page security-page" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="security-page-heading">
        <div><span className="security-eyebrow">INFRASTRUCTURE</span><h1>System Health</h1><p>Only explicitly checked endpoints are reported as reachable.</p></div>
        <button className="sec-secondary-button" onClick={load}><RefreshCw size={14} /> Refresh</button>
      </div>
      {error && <div className="sec-empty-state"><strong>Backend health check failed</strong><span>{error}</span></div>}
      <div className="sec-health-summary">
        <div><Activity size={17} /><strong>{backend}</strong><span>Backend API</span></div>
        <div><Server size={17} /><strong>{ai}</strong><span>AI service</span></div>
        <div><Database size={17} /><strong>Via backend</strong><span>Database status not independently checked</span></div>
      </div>
      <section className="sec-panel">
        <div className="sec-panel-header"><div><span className="security-eyebrow">SERVICE STATUS</span><h2>Decision infrastructure</h2></div><span className="sec-integrity"><CheckCircle2 size={14} /> Reachability checks</span></div>
        {rows.map(([name, status]) => <div className="sec-health-detail" key={name}>
          <div className="sec-health-service"><span><CheckCircle2 size={14} /></span><strong>{name}</strong></div>
          <span>{status}</span><b>{status === "Reachable" ? "OK" : "—"}</b>
        </div>)}
      </section>
    </motion.div>
  );
}
