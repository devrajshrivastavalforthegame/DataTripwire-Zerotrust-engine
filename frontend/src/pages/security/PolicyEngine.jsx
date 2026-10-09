import { motion } from "motion/react";
import { FlaskConical, RefreshCw, ToggleLeft, ToggleRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../../api";

function decision(score, policies) {
  return policies
    .filter((p) => p.enabled)
    .sort((a, b) => b.threshold - a.threshold)
    .find((p) => score >= p.threshold)?.effect || "ALLOW";
}

export default function PolicyEngine() {
  const [policies, setPolicies] = useState([]);
  const [score, setScore] = useState(72);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const load = async () => {
    try {
      setError("");
      const result = await api.securityPolicies();
      setPolicies(result?.actions || result?.policies || result || []);
    } catch (e) {
      setError(e?.message || "Unable to load policy configuration.");
    }
  };

  useEffect(() => { load(); }, []);

  const result = useMemo(() => decision(score, policies), [score, policies]);

  const toggle = async (policy) => {
    if (!policy?.policy_id) return;
    setBusy(policy.policy_id);
    try {
      await api.updatePolicy(policy.policy_id, { enabled: !policy.enabled });
      await load();
    } catch (e) {
      setError(e?.message || "Unable to update policy.");
    } finally {
      setBusy("");
    }
  };

  return (
    <motion.div className="page security-page" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="security-page-heading">
        <div>
          <span className="security-eyebrow">DECISION CONTROL</span>
          <h1>Policy Engine</h1>
          <p>Authoritative risk policies and a live what-if simulator.</p>
        </div>
        <button className="sec-secondary-button" onClick={load}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && <div className="sec-empty-state"><strong>Policy service notice</strong><span>{error}</span></div>}

      <section className="sec-policy-grid">
        <div className="sec-panel">
          <div className="sec-panel-header"><h2>Active policies</h2><span>{policies.length} rules</span></div>
          {policies.map((p) => (
            <div className="sec-policy-row" key={p.policy_id || p.id || p.name}>
              <div>
                <strong>{p.name || p.decision || "Security policy"}</strong>
                <small>{p.scope || p.enforcement || "Backend authorization rule"} · threshold {p.threshold ?? "—"}</small>
              </div>
              <span className={"sec-decision " + String(p.effect || p.decision || "ALLOW").toLowerCase()}>
                {p.effect || p.decision || "ALLOW"}
              </span>
              {p.policy_id ? (
                <button disabled={busy === p.policy_id} onClick={() => toggle(p)} aria-label="Toggle policy">
                  {p.enabled ? <ToggleRight size={25} /> : <ToggleLeft size={25} />}
                </button>
              ) : null}
            </div>
          ))}
          {!policies.length && <div className="sec-empty-state"><strong>No policy rules returned</strong><span>The backend policy engine is reachable but returned no configurable rules.</span></div>}
        </div>

        <div className="sec-panel sec-simulator">
          <div className="sec-panel-header"><h2>Policy simulator</h2><FlaskConical size={18} /></div>
          <div className="sec-sim-score"><strong>{score}</strong><span>RISK SCORE</span></div>
          <input type="range" min="0" max="100" value={score} onChange={(e) => setScore(Number(e.target.value))} />
          <div className={"sec-policy-result " + String(result).toLowerCase()}>
            <strong>{result}</strong>
            <span>Predicted backend policy result</span>
          </div>
          <div className="sec-policy-scale"><span>0 · ALLOW</span><span>50 · VERIFY</span><span>70 · RESTRICT</span><span>85 · QUARANTINE</span><span>100</span></div>
        </div>
      </section>
    </motion.div>
  );
}
