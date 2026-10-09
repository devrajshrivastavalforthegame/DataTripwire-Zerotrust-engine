import { motion } from "motion/react";
import DataExposureRisk from "../../components/security/DataExposureRisk";
import {
  Users,
  ShieldCheck,
  AlertTriangle,
  LockKeyhole,
  Activity,
  Database,
  Radio,
  Cpu,
  Server,
  ArrowUpRight,
  ArrowDownRight,
  Clock3
} from "lucide-react";

const metrics = [
  ["Active Users", "1,248", "+4.8%", Users, "up"],
  ["Active Sessions", "1,684", "+7.2%", Radio, "up"],
  ["High-Risk Users", "17", "-12.5%", AlertTriangle, "down"],
  ["Open Incidents", "6", "-8.1%", ShieldCheck, "down"],
  ["Restricted Sessions", "23", "+3.2%", LockKeyhole, "up"],
  ["Policy Decisions", "18.4K", "+14.6%", Activity, "up"]
];

const events = [
  ["Aarav Sharma", "Downloaded Financial Report", "Confidential", 87, "RESTRICT", "2m"],
  ["Meera Iyer", "Viewed Project Plan", "Internal", 9, "ALLOW", "4m"],
  ["Rohan Das", "Opened Payroll Sheet", "Restricted", 52, "VERIFY", "7m"],
  ["Aarav Sharma", "Shared HR Records", "Restricted", 91, "BLOCK", "11m"]
];

function Metric({ item, index }) {
  const [label, value, trend, Icon, direction] = item;

  return (
    <motion.div
      className="sec-metric"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * .06 }}
      whileHover={{ y: -2 }}
    >
      <div className="sec-metric-top">
        <div className="sec-metric-icon">
          <Icon size={17} />
        </div>

        <span className={`sec-trend ${direction}`}>
          {direction === "up"
            ? <ArrowUpRight size={12} />
            : <ArrowDownRight size={12} />}
          {trend}
        </span>
      </div>

      <strong>{value}</strong>
      <span>{label}</span>
    </motion.div>
  );
}

function DecisionBadge({ decision }) {
  return (
    <span className={`sec-decision ${decision.toLowerCase()}`}>
      {decision}
    </span>
  );
}

export default function Overview() {
  return (
    <div className="sec-page">

      <div className="sec-page-heading">
        <div>
          <span className="sec-eyebrow">SECURITY CONSOLE</span>
          <h1>Security Overview</h1>
          <p>Continuous visibility into identity, behaviour, trust and adaptive access.</p>
        </div>

        <div className="sec-live-indicator">
          <span />
          Live Monitoring
        </div>
      </div>

      <div className="sec-metrics-grid">
        {metrics.map((item, index) => (
          <Metric item={item} index={index} key={item[0]} />
        ))}
      </div>

      <div className="sec-overview-grid">

        <section className="sec-panel sec-trust-panel">
          <div className="sec-panel-header">
            <div>
              <span className="sec-section-label">CONTINUOUS TRUST</span>
              <h2>Current trust state</h2>
            </div>

            <span className="sec-live-dot">
              LIVE
            </span>
          </div>

          <div className="sec-trust-body">
            <div className="sec-trust-ring">
              <div>
                <strong>82</strong>
                <span>TRUST</span>
              </div>
            </div>

            <div className="sec-trust-copy">
              <div className="sec-trust-status">
                <span />
                Healthy
              </div>

              <h3>Trust is being evaluated continuously.</h3>
              <p>
                Every active session is re-evaluated as behaviour,
                device, location and resource sensitivity change.
              </p>

              <div className="sec-mini-factors">
                <div>
                  <span>Identity</span>
                  <strong>98</strong>
                </div>
                <div>
                  <span>Behaviour</span>
                  <strong>81</strong>
                </div>
                <div>
                  <span>Device</span>
                  <strong>76</strong>
                </div>
                <div>
                  <span>Context</span>
                  <strong>88</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="sec-panel">
          <div className="sec-panel-header">
            <div>
              <span className="sec-section-label">SYSTEM STATUS</span>
              <h2>Engine health</h2>
            </div>
          </div>

          <div className="sec-health-list">
            {[
              ["Risk Engine", "Operational", Cpu],
              ["Behaviour Engine", "Operational", Activity],
              ["Policy Engine", "Operational", ShieldCheck],
              ["Redis", "Operational", Database],
              ["Database", "Operational", Server],
              ["Audit Service", "Operational", Radio]
            ].map(([name, status, Icon], index) => (
              <motion.div
                className="sec-health-row"
                key={name}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: .2 + index * .05 }}
              >
                <div className="sec-health-icon">
                  <Icon size={14} />
                </div>

                <span>{name}</span>

                <strong>
                  <i />
                  {status}
                </strong>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      <DataExposureRisk />

      <div className="sec-overview-grid lower">

        <section className="sec-panel">
          <div className="sec-panel-header">
            <div>
              <span className="sec-section-label">RECENT ACTIVITY</span>
              <h2>Latest decisions</h2>
            </div>

            <button className="sec-text-button">
              View all
              <ArrowUpRight size={13} />
            </button>
          </div>

          <div className="sec-event-table">
            <div className="sec-event-head">
              <span>USER</span>
              <span>ACTION</span>
              <span>RISK</span>
              <span>DECISION</span>
              <span>TIME</span>
            </div>

            {events.map((event, index) => (
              <motion.div
                className="sec-event-row"
                key={`${event[0]}-${event[1]}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: .25 + index * .06 }}
              >
                <strong>{event[0]}</strong>
                <span>
                  {event[1]}
                  <small>{event[2]}</small>
                </span>

                <div className={`sec-risk-number ${event[3] >= 80 ? "high" : event[3] >= 50 ? "medium" : "low"}`}>
                  {event[3]}
                </div>

                <DecisionBadge decision={event[4]} />

                <time>
                  <Clock3 size={11} />
                  {event[5]}
                </time>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="sec-panel sec-flow-panel">
          <div className="sec-panel-header">
            <div>
              <span className="sec-section-label">DECISION PIPELINE</span>
              <h2>Continuous enforcement</h2>
            </div>
          </div>

          <div className="sec-flow">
            {[
              ["01", "Authenticated", "Identity established"],
              ["02", "Evaluated", "Behaviour analysed"],
              ["03", "Risk Score", "Trust recalculated"],
              ["04", "Policy Decision", "OPA evaluates policy"],
              ["05", "Response", "Access adapted"],
              ["06", "Audit", "Evidence recorded"]
            ].map((step, index) => (
              <div className="sec-flow-step" key={step[1]}>
                <div className="sec-flow-number">{step[0]}</div>
                <div>
                  <strong>{step[1]}</strong>
                  <span>{step[2]}</span>
                </div>
                {index < 5 && <i />}
              </div>
            ))}
          </div>
        </section>
      </div>

    </div>
  );
}
