import { motion } from "motion/react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Mail,
  MapPin
} from "lucide-react";

import { PageHeading, StatusPill } from "../../components/workshepher/WorkspaceWidgets";

const people = [
  ["AS", "Aarav Sharma", "Product Manager", "Product", "Online"],
  ["MI", "Meera Iyer", "Senior Designer", "Design", "Online"],
  ["RD", "Rohan Das", "Backend Engineer", "Engineering", "Away"],
  ["SK", "Sarah Kapoor", "Finance Lead", "Finance", "Online"],
  ["AM", "Ananya Mehta", "People Operations", "People", "Offline"],
  ["VK", "Vikram Khanna", "Engineering Lead", "Engineering", "Online"],
  ["NP", "Nisha Patel", "Marketing Manager", "Marketing", "Online"],
  ["RS", "Rahul Singh", "Frontend Engineer", "Engineering", "Away"]
];

export default function Team() {
  return (
    <div className="ws-page">
      <PageHeading
        eyebrow="WORKSPACE"
        title="Team"
        description="The people behind the work."
        action={
          <button className="ws-primary-button">
            <Plus size={17} />
            Invite member
          </button>
        }
      />

      <div className="ws-team-toolbar">
        <div className="ws-search-field">
          <Search size={17} />
          <input placeholder="Search people..." />
        </div>

        <div className="ws-toolbar-filters">
          <button className="active">Everyone</button>
          <button>Engineering</button>
          <button>Product</button>
          <button>Design</button>
        </div>
      </div>

      <div className="ws-team-grid">
        {people.map((person, index) => (
          <motion.article
            className="ws-person-card"
            key={person[1]}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * .055 }}
            whileHover={{ y: -3 }}
          >
            <div className="ws-person-top">
              <div className="ws-avatar-large">{person[0]}</div>
              <button className="ws-icon-button">
                <MoreHorizontal size={17} />
              </button>
            </div>

            <h2>{person[1]}</h2>
            <p>{person[2]}</p>

            <div className="ws-person-meta">
              <span>{person[3]}</span>
              <StatusPill
                tone={
                  person[4] === "Online"
                    ? "success"
                    : person[4] === "Away"
                      ? "warning"
                      : "neutral"
                }
              >
                <span className="ws-status-dot" />
                {person[4]}
              </StatusPill>
            </div>

            <div className="ws-person-actions">
              <button>
                <Mail size={14} />
                Message
              </button>
              <button>
                <MapPin size={14} />
                Profile
              </button>
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
