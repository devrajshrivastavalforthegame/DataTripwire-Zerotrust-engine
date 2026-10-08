import { motion } from "motion/react";
import {
  Monitor,
  Smartphone,
  Globe2,
  Clock3,
  MoreHorizontal
} from "lucide-react";

const sessions = [
  ["sess_84A91", "Aarav Sharma", "Chrome / Windows", "Indore, IN", 87, "Restricted", "2m"],
  ["sess_11BD2", "Meera Iyer", "Safari / macOS", "Mumbai, IN", 14, "Active", "4m"],
  ["sess_39FA7", "Rohan Das", "Chrome / Linux", "Bengaluru, IN", 52, "Verify", "7m"],
  ["sess_61CC9", "Sarah Kapoor", "Edge / Windows", "Delhi, IN", 22, "Active", "12m"],
  ["sess_77DE4", "Vikram Khanna", "Chrome / Windows", "Pune, IN", 38, "Active", "18m"]
];

export default function Sessions() {
  return (
    <div className="sec-page">

      <div className="sec-page-heading">
        <div>
          <span className="sec-eyebrow">SECURITY CONSOLE</span>
          <h1>Active Sessions</h1>
          <p>Every session remains subject to continuous trust evaluation.</p>
        </div>
      </div>

      <div className="sec-session-cards">
        <div><strong>1,684</strong><span>Active sessions</span></div>
        <div><strong>23</strong><span>Restricted</span></div>
        <div><strong>8</strong><span>Step-up verification</span></div>
        <div><strong>4</strong><span>Quarantined</span></div>
      </div>

      <section className="sec-panel">
        <div className="sec-session-head">
          <span>SESSION</span>
          <span>USER</span>
          <span>DEVICE</span>
          <span>LOCATION</span>
          <span>RISK</span>
          <span>STATE</span>
          <span>LAST SEEN</span>
          <span />
        </div>

        {sessions.map((session, index) => (
          <motion.div
            className="sec-session-row"
            key={session[0]}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * .05 }}
          >
            <code>{session[0]}</code>
            <strong>{session[1]}</strong>

            <span className="sec-device">
              {session[2].includes("macOS")
                ? <Smartphone size={13} />
                : <Monitor size={13} />}
              {session[2]}
            </span>

            <span className="sec-device">
              <Globe2 size={13} />
              {session[3]}
            </span>

            <span className={`sec-table-risk ${
              session[4] >= 70 ? "high" : session[4] >= 40 ? "medium" : "low"
            }`}>
              {session[4]}
            </span>

            <span className={`sec-session-state ${session[5].toLowerCase()}`}>
              <i />
              {session[5]}
            </span>

            <time>
              <Clock3 size={11} />
              {session[6]}
            </time>

            <button className="sec-table-menu">
              <MoreHorizontal size={15} />
            </button>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
