import { motion } from "motion/react";
import {
  Search,
  SlidersHorizontal,
  Download,
  ChevronRight,
  Smartphone,
  Monitor,
  Globe2,
  X
} from "lucide-react";
import { useState } from "react";

const activity = [
  {
    user: "Aarav Sharma",
    action: "Opened Financial Report",
    sensitivity: "Confidential",
    device: "Known",
    risk: 18,
    decision: "ALLOW",
    time: "09:41:22"
  },
  {
    user: "Meera Iyer",
    action: "Viewed Project Plan",
    sensitivity: "Internal",
    device: "Known",
    risk: 9,
    decision: "ALLOW",
    time: "09:42:07"
  },
  {
    user: "Aarav Sharma",
    action: "Downloaded Financial Report",
    sensitivity: "Confidential",
    device: "New",
    risk: 87,
    decision: "RESTRICT",
    time: "09:44:18"
  },
  {
    user: "Rohan Das",
    action: "Opened Payroll Sheet",
    sensitivity: "Restricted",
    device: "Known",
    risk: 52,
    decision: "VERIFY",
    time: "09:46:03"
  },
  {
    user: "Aarav Sharma",
    action: "Shared HR Records",
    sensitivity: "Restricted",
    device: "New",
    risk: 91,
    decision: "BLOCK",
    time: "09:47:41"
  },
  {
    user: "Nisha Patel",
    action: "Updated Brand Guidelines",
    sensitivity: "Internal",
    device: "Known",
    risk: 14,
    decision: "ALLOW",
    time: "09:49:09"
  },
  {
    user: "Vikram Khanna",
    action: "Accessed Infrastructure Plan",
    sensitivity: "Confidential",
    device: "Known",
    risk: 34,
    decision: "ALLOW",
    time: "09:51:22"
  }
];

function Decision({ value }) {
  return <span className={`sec-decision ${value.toLowerCase()}`}>{value}</span>;
}

function Risk({ value }) {
  const tone = value >= 80 ? "high" : value >= 50 ? "medium" : "low";

  return (
    <span className={`sec-table-risk ${tone}`}>
      {value}
    </span>
  );
}

export default function LiveActivity() {
  const [selected, setSelected] = useState(activity[2]);
  const [filter, setFilter] = useState("All");

  const filtered = activity.filter(item => {
    if (filter === "Normal") return item.risk < 30;
    if (filter === "Suspicious") return item.risk >= 30 && item.risk < 70;
    if (filter === "High Risk") return item.risk >= 70;
    if (filter === "Blocked") return item.decision === "BLOCK";
    return true;
  });

  return (
    <div className="sec-page">

      <div className="sec-page-heading">
        <div>
          <span className="sec-eyebrow">SECURITY CONSOLE</span>
          <h1>Live Activity</h1>
          <p>Events from WorkShepher, scored and decided in real time.</p>
        </div>

        <div className="sec-live-indicator">
          <span />
          Streaming
        </div>
      </div>

      <div className="sec-toolbar">
        <div className="sec-search">
          <Search size={15} />
          <input placeholder="Search users, actions, resources..." />
          <kbd>? K</kbd>
        </div>

        <div className="sec-filter-group">
          {["All", "Normal", "Suspicious", "High Risk", "Blocked"].map(item => (
            <button
              key={item}
              className={filter === item ? "active" : ""}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <button className="sec-secondary-button">
          <SlidersHorizontal size={14} />
          Filters
        </button>

        <button className="sec-secondary-button">
          <Download size={14} />
          Export
        </button>
      </div>

      <div className="sec-activity-layout">

        <section className="sec-panel sec-activity-panel">
          <div className="sec-event-head activity">
            <span>TIME</span>
            <span>USER</span>
            <span>ACTION</span>
            <span>SENSITIVITY</span>
            <span>DEVICE</span>
            <span>RISK</span>
            <span>DECISION</span>
            <span />
          </div>

          <div className="sec-activity-list">
            {filtered.map((item, index) => (
              <motion.button
                className={`sec-activity-row ${selected === item ? "selected" : ""}`}
                key={`${item.time}-${item.user}`}
                onClick={() => setSelected(item)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * .035 }}
              >
                <time>{item.time}</time>

                <strong>{item.user}</strong>

                <span className="sec-action-name">
                  {item.action}
                </span>

                <span className="sec-sensitivity">
                  {item.sensitivity}
                </span>

                <span className="sec-device">
                  {item.device === "New"
                    ? <Smartphone size={13} />
                    : <Monitor size={13} />}
                  {item.device}
                </span>

                <Risk value={item.risk} />

                <Decision value={item.decision} />

                <ChevronRight size={14} />
              </motion.button>
            ))}
          </div>
        </section>

        {selected && (
          <motion.aside
            className="sec-investigation"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="sec-investigation-header">
              <div>
                <span className="sec-section-label">EVENT INVESTIGATION</span>
                <h2>Why this decision?</h2>
              </div>

              <button onClick={() => setSelected(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="sec-investigation-risk">
              <div className={`sec-risk-ring ${
                selected.risk >= 80
                  ? "critical"
                  : selected.risk >= 50
                    ? "warning"
                    : "safe"
              }`}>
                <strong>{selected.risk}</strong>
                <span>RISK</span>
              </div>

              <div>
                <Decision value={selected.decision} />
                <strong>{selected.user}</strong>
                <span>{selected.action}</span>
              </div>
            </div>

            <div className="sec-detail-block">
              <span className="sec-detail-label">RISK FACTORS</span>

              {[
                ["New device", 25],
                ["Unusual login time", 20],
                ["Request burst", 18],
                ["Sensitive resource", 14],
                ["Behaviour deviation", 10]
              ].map(([label, score], index) => (
                <div className="sec-factor" key={label}>
                  <div>
                    <span>{label}</span>
                    <strong>+{score}</strong>
                  </div>
                  <div className="sec-factor-bar">
                    <motion.i
                      initial={{ width: 0 }}
                      animate={{ width: `${score * 2.6}%` }}
                      transition={{ duration: .55, delay: index * .08 }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="sec-detail-block">
              <span className="sec-detail-label">CONTEXT</span>

              <div className="sec-context-grid">
                <div>
                  <span>Session</span>
                  <strong>sess_84A91</strong>
                </div>
                <div>
                  <span>Resource</span>
                  <strong>Financial Report</strong>
                </div>
                <div>
                  <span>Device</span>
                  <strong>Chrome · Windows</strong>
                </div>
                <div>
                  <span>Location</span>
                  <strong>Indore, IN</strong>
                </div>
              </div>
            </div>

            <div className="sec-policy-result">
              <span className="sec-detail-label">POLICY DECISION</span>
              <div>
                <strong>High Risk ? {selected.decision}</strong>
                <span>Enforcement applied · Audit recorded</span>
              </div>
            </div>

            <div className="sec-risk-timeline">
              <span className="sec-detail-label">RISK TIMELINE</span>

              <div className="sec-timeline">
                {[
                  ["Login", 18],
                  ["Device change", 43],
                  ["Request burst", 61],
                  ["Sensitive resource", 75],
                  ["Download", selected.risk],
                  ["Decision", selected.risk]
                ].map(([label, score], index) => (
                  <div key={label}>
                    <span>{label}</span>
                    <i style={{ height: `${Math.max(14, score * .42)}px` }} />
                    <strong>{score}</strong>
                  </div>
                ))}
              </div>
            </div>
          </motion.aside>
        )}

      </div>
    </div>
  );
}
