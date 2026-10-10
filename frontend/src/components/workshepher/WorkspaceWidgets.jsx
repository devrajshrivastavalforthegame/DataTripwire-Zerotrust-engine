import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";

export function MetricCard({ icon: Icon, label, value, detail, trend, delay = 0 }) {
  return (
    <motion.div
      className="ws-metric-card"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
      whileHover={{ y: -3 }}
    >
      <div className="ws-metric-top">
        <div className="ws-metric-icon">
          <Icon size={18} strokeWidth={1.8} />
        </div>
        {trend && <span className="ws-metric-trend">{trend}</span>}
      </div>

      <div className="ws-metric-value">{value}</div>
      <div className="ws-metric-label">{label}</div>

      {detail && <div className="ws-metric-detail">{detail}</div>}
    </motion.div>
  );
}

export function PageHeading({ eyebrow, title, description, action }) {
  return (
    <motion.div
      className="ws-page-heading"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div>
        {eyebrow && <div className="ws-eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>

      {action && <div className="ws-heading-action">{action}</div>}
    </motion.div>
  );
}

export function ProgressBar({ value = 0 }) {
  return (
    <div className="ws-progress">
      <motion.div
        className="ws-progress-fill"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
}

export function StatusPill({ children, tone = "neutral" }) {
  return <span className={`ws-status-pill ${tone}`}>{children}</span>;
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="ws-empty-state">
      {Icon && (
        <div className="ws-empty-icon">
          <Icon size={24} />
        </div>
      )}
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function ArrowLink({ children }) {
  return (
    <button className="ws-arrow-link">
      {children}
      <ArrowUpRight size={15} />
    </button>
  );
}
