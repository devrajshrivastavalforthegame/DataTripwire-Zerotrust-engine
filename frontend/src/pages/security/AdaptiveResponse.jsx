import { motion } from "motion/react";

const levels = [
  ["ALLOW", "Normal activity continues.", "allow"],
  ["VERIFY", "Re-authentication required.", "verify"],
  ["RESTRICT", "Sensitive actions are limited.", "restrict"],
  ["BLOCK", "Session is quarantined.", "block"],
];

export default function AdaptiveResponse() {
  return (
    <motion.div className="page security-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="security-page-heading">
        <div>
          <span className="security-eyebrow">RESPONSE CONTROL</span>
          <h1>Adaptive Response</h1>
          <p>
            How the system escalates, enforces and recovers, decided by policy,
            never by AI.
          </p>
        </div>
      </div>

      <section className="security-panel">
        <div className="response-ladder">
          {levels.map(([label, description, type], index) => (
            <div className={`response-level ${type}`} key={label}>
              <span>0{index + 1}</span>
              <strong>{label}</strong>
              <p>{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="security-panel">
        <div className="security-panel-heading">
          <div>
            <span className="security-eyebrow">LIFECYCLE</span>
            <h2>Response lifecycle</h2>
          </div>
        </div>

        <div className="lifecycle">
          {[
            "Detection",
            "Risk Increase",
            "Policy Evaluation",
            "Decision",
            "Enforcement",
            "Monitoring",
            "Recovery",
          ].map((item, index) => (
            <div className="lifecycle-step" key={item}>
              <span>{index + 1}</span>
              <strong>{item}</strong>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
