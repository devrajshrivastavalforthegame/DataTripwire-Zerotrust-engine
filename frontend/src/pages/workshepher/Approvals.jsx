import { motion } from "motion/react";
import {
  Check,
  X,
  Eye,
  Clock3,
  FileText
} from "lucide-react";

import { PageHeading, StatusPill } from "../../components/workshepher/WorkspaceWidgets";

const approvals = [
  ["Q4 Marketing Budget", "Sarah Kapoor", "Finance", "$48,000", "Today"],
  ["Client Contract Renewal", "Aarav Sharma", "Northwind", "$120,000", "Today"],
  ["Design System Update", "Meera Iyer", "Product", "Internal", "Yesterday"],
  ["Infrastructure Upgrade", "Rohan Das", "Engineering", "$18,400", "Yesterday"]
];

export default function Approvals() {
  return (
    <div className="ws-page">
      <PageHeading
        eyebrow="WORKSPACE"
        title="Approvals"
        description="Review requests waiting for your decision."
      />

      <div className="ws-approval-summary">
        <div>
          <strong>5</strong>
          <span>Waiting for you</span>
        </div>
        <div>
          <strong>12</strong>
          <span>Approved this month</span>
        </div>
        <div>
          <strong>2</strong>
          <span>Returned</span>
        </div>
      </div>

      <section className="ws-panel ws-approval-panel">
        <div className="ws-approval-table-head">
          <span>Request</span>
          <span>Requester</span>
          <span>Team</span>
          <span>Value</span>
          <span>Submitted</span>
          <span />
        </div>

        {approvals.map((item, index) => (
          <motion.div
            className="ws-approval-row"
            key={item[0]}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * .06 }}
          >
            <div className="ws-approval-name">
              <div className="ws-document-icon">
                <FileText size={17} />
              </div>
              <div>
                <strong>{item[0]}</strong>
                <span>Approval request</span>
              </div>
            </div>

            <span>{item[1]}</span>
            <span>{item[2]}</span>
            <strong>{item[3]}</strong>
            <span className="ws-approval-date">
              <Clock3 size={13} />
              {item[4]}
            </span>

            <div className="ws-approval-actions">
              <button className="approve"><Check size={15} /></button>
              <button className="reject"><X size={15} /></button>
              <button className="view"><Eye size={15} /></button>
            </div>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
