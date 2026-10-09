import { motion } from "motion/react";
import { Bell, CheckCircle2, MessageCircle, FileText, X } from "lucide-react";

const notifications = [
  ["Task completed", "Rohan completed Security requirements.", "8m", CheckCircle2],
  ["New message", "Meera mentioned you in Product Strategy.", "24m", MessageCircle],
  ["Document updated", "Q4 Financial Report was updated.", "1h", FileText]
];

export default function NotificationPanel({ open, onClose }) {
  if (!open) return null;

  return (
    <motion.div
      className="ws-notification-panel"
      initial={{ opacity: 0, y: -8, scale: .98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
    >
      <header>
        <div>
          <strong>Notifications</strong>
          <span>3 new updates</span>
        </div>

        <button onClick={onClose}>
          <X size={17} />
        </button>
      </header>

      <div>
        {notifications.map(([title, text, time, Icon]) => (
          <button className="ws-notification-item" key={title}>
            <div><Icon size={16} /></div>
            <span>
              <strong>{title}</strong>
              <small>{text}</small>
            </span>
            <time>{time}</time>
          </button>
        ))}
      </div>

      <footer>View all notifications</footer>
    </motion.div>
  );
}
