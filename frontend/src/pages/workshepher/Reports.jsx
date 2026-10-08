import { motion } from "motion/react";
import {
  Download,
  CalendarDays,
  ArrowUpRight,
  TrendingUp,
  Clock3,
  CheckCircle2
} from "lucide-react";

import { PageHeading } from "../../components/workshepher/WorkspaceWidgets";

const weekly = [42, 58, 49, 72, 67, 82, 76];

export default function Reports() {
  return (
    <div className="ws-page">
      <PageHeading
        eyebrow="WORKSPACE"
        title="Reports"
        description="Understand progress, workload and delivery at a glance."
        action={
          <button className="ws-secondary-button">
            <Download size={16} />
            Export
          </button>
        }
      />

      <div className="ws-report-grid">
        <section className="ws-panel ws-report-main">
          <div className="ws-panel-header">
            <div>
              <span className="ws-section-label">PRODUCTIVITY</span>
              <h2>Weekly activity</h2>
            </div>

            <button className="ws-report-period">
              <CalendarDays size={14} />
              This week
            </button>
          </div>

          <div className="ws-chart">
            <div className="ws-chart-values">
              {weekly.map((value, index) => (
                <motion.div
                  className="ws-chart-bar"
                  key={index}
                  initial={{ height: 0 }}
                  animate={{ height: `${value}%` }}
                  transition={{ duration: .7, delay: index * .07 }}
                >
                  <span>{value}</span>
                </motion.div>
              ))}
            </div>

            <div className="ws-chart-labels">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
                <span key={day}>{day}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="ws-panel ws-report-summary">
          <div className="ws-panel-header">
            <div>
              <span className="ws-section-label">SUMMARY</span>
              <h2>Performance</h2>
            </div>
          </div>

          <div className="ws-report-stat">
            <div className="ws-report-stat-icon">
              <TrendingUp size={17} />
            </div>
            <div>
              <span>Tasks completed</span>
              <strong>84%</strong>
            </div>
            <ArrowUpRight size={15} />
          </div>

          <div className="ws-report-stat">
            <div className="ws-report-stat-icon">
              <Clock3 size={17} />
            </div>
            <div>
              <span>Focus time</span>
              <strong>31h 42m</strong>
            </div>
            <ArrowUpRight size={15} />
          </div>

          <div className="ws-report-stat">
            <div className="ws-report-stat-icon">
              <CheckCircle2 size={17} />
            </div>
            <div>
              <span>On-time delivery</span>
              <strong>91%</strong>
            </div>
            <ArrowUpRight size={15} />
          </div>
        </section>
      </div>

      <section className="ws-panel ws-report-table">
        <div className="ws-panel-header">
          <div>
            <span className="ws-section-label">PROJECTS</span>
            <h2>Project performance</h2>
          </div>
        </div>

        {[
          ["Northwind Client Portal", "78%", "On track"],
          ["Q4 Finance Operations", "61%", "On track"],
          ["Workplace Experience", "43%", "At risk"],
          ["Brand Refresh", "31%", "Planning"]
        ].map((row, index) => (
          <motion.div
            className="ws-report-row"
            key={row[0]}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * .06 }}
          >
            <strong>{row[0]}</strong>
            <div className="ws-progress">
              <div className="ws-progress-fill" style={{ width: row[1] }} />
            </div>
            <span>{row[1]}</span>
            <span className={`ws-report-status ${row[2] === "At risk" ? "risk" : ""}`}>
              {row[2]}
            </span>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
