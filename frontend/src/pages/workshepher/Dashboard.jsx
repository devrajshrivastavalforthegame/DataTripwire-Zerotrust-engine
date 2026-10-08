import { motion } from "motion/react";
import {
  CheckSquare,
  FolderKanban,
  FileText,
  ClipboardCheck,
  ArrowRight,
  CalendarDays,
  Clock3,
  MoreHorizontal,
  Plus,
  Sparkles
} from "lucide-react";

import {
  MetricCard,
  PageHeading,
  ProgressBar,
  StatusPill,
  ArrowLink
} from "../../components/workshepher/WorkspaceWidgets";

const priorities = [
  {
    title: "Finalize Q4 financial report",
    project: "Finance Operations",
    due: "Today · 4:00 PM",
    priority: "High",
    progress: 72
  },
  {
    title: "Review product roadmap",
    project: "Product Strategy",
    due: "Today · 6:30 PM",
    priority: "Medium",
    progress: 45
  },
  {
    title: "Prepare client presentation",
    project: "Northwind Account",
    due: "Tomorrow · 10:00 AM",
    priority: "Medium",
    progress: 28
  }
];

const upcoming = [
  { title: "Team stand-up", time: "09:30 AM", type: "Meeting" },
  { title: "Design review", time: "11:00 AM", type: "Review" },
  { title: "Client sync", time: "02:30 PM", type: "Meeting" }
];

export default function Dashboard() {
  return (
    <div className="ws-page">
      <PageHeading
        eyebrow="WORKSPACE"
        title="Good morning, Om"
        description="Here’s what needs your attention today."
        action={
          <button className="ws-primary-button">
            <Plus size={17} />
            New
          </button>
        }
      />

      <motion.div
        className="ws-insight-banner"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, delay: 0.12 }}
      >
        <div className="ws-insight-icon">
          <Sparkles size={18} />
        </div>

        <div className="ws-insight-copy">
          <strong>Your workspace is on track</strong>
          <span>3 priorities need attention today. You have 2 hours of focused work scheduled.</span>
        </div>

        <ArrowLink>View priorities</ArrowLink>
      </motion.div>

      <div className="ws-metrics-grid">
        <MetricCard
          icon={CheckSquare}
          label="Tasks"
          value="18"
          detail="6 due today"
          trend="+12%"
          delay={0.08}
        />

        <MetricCard
          icon={FolderKanban}
          label="Projects"
          value="7"
          detail="3 active"
          trend="+8%"
          delay={0.14}
        />

        <MetricCard
          icon={FileText}
          label="Documents"
          value="42"
          detail="8 recently updated"
          trend="+16%"
          delay={0.2}
        />

        <MetricCard
          icon={ClipboardCheck}
          label="Approvals"
          value="5"
          detail="2 waiting for you"
          delay={0.26}
        />
      </div>

      <div className="ws-dashboard-grid">
        <section className="ws-panel ws-priority-panel">
          <div className="ws-panel-header">
            <div>
              <span className="ws-section-label">TODAY</span>
              <h2>Today’s priorities</h2>
            </div>

            <button className="ws-icon-button">
              <MoreHorizontal size={18} />
            </button>
          </div>

          <div className="ws-priority-list">
            {priorities.map((item, index) => (
              <motion.div
                className="ws-priority-row"
                key={item.title}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + index * 0.08 }}
              >
                <div className="ws-check">
                  <span />
                </div>

                <div className="ws-priority-content">
                  <div className="ws-priority-title-row">
                    <strong>{item.title}</strong>
                    <StatusPill tone={item.priority === "High" ? "danger" : "warning"}>
                      {item.priority}
                    </StatusPill>
                  </div>

                  <div className="ws-priority-meta">
                    <span>{item.project}</span>
                    <span>•</span>
                    <span>{item.due}</span>
                  </div>

                  <ProgressBar value={item.progress} />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="ws-panel-footer">
            <ArrowLink>View all tasks</ArrowLink>
          </div>
        </section>

        <section className="ws-panel">
          <div className="ws-panel-header">
            <div>
              <span className="ws-section-label">SCHEDULE</span>
              <h2>Upcoming</h2>
            </div>

            <button className="ws-icon-button">
              <CalendarDays size={18} />
            </button>
          </div>

          <div className="ws-upcoming-list">
            {upcoming.map((item, index) => (
              <motion.div
                className="ws-upcoming-row"
                key={item.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 + index * 0.08 }}
              >
                <div className="ws-time-icon">
                  <Clock3 size={16} />
                </div>

                <div>
                  <strong>{item.title}</strong>
                  <span>{item.type}</span>
                </div>

                <time>{item.time}</time>
              </motion.div>
            ))}
          </div>

          <div className="ws-calendar-preview">
            <div className="ws-calendar-day">
              <span>MON</span>
              <strong>12</strong>
            </div>
            <div className="ws-calendar-day active">
              <span>TUE</span>
              <strong>13</strong>
            </div>
            <div className="ws-calendar-day">
              <span>WED</span>
              <strong>14</strong>
            </div>
            <div className="ws-calendar-day">
              <span>THU</span>
              <strong>15</strong>
            </div>
            <div className="ws-calendar-day">
              <span>FRI</span>
              <strong>16</strong>
            </div>
          </div>
        </section>
      </div>

      <section className="ws-panel ws-activity-panel">
        <div className="ws-panel-header">
          <div>
            <span className="ws-section-label">RECENT</span>
            <h2>Workspace activity</h2>
          </div>

          <ArrowLink>View activity</ArrowLink>
        </div>

        <div className="ws-activity-feed">
          {[
            ["You updated", "Q4 Financial Report", "8 min ago"],
            ["Sarah commented on", "Product Roadmap", "32 min ago"],
            ["Michael completed", "Security review", "1 hr ago"],
            ["You uploaded", "Client requirements.pdf", "2 hrs ago"]
          ].map(([action, subject, time], index) => (
            <motion.div
              className="ws-activity-item"
              key={subject}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 + index * 0.07 }}
            >
              <div className="ws-activity-dot" />
              <div>
                <span>{action}</span>
                <strong>{subject}</strong>
              </div>
              <time>{time}</time>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
