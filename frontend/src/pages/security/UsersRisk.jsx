import { motion } from "motion/react";
import {
  Search,
  ArrowUpRight,
  ShieldAlert,
  ShieldCheck,
  MoreHorizontal
} from "lucide-react";

const users = [
  ["Aarav Sharma", "Product Manager", 87, "RESTRICT", "New device", "2m"],
  ["Meera Iyer", "Senior Designer", 14, "ALLOW", "Normal", "4m"],
  ["Rohan Das", "Backend Engineer", 52, "VERIFY", "Behaviour deviation", "7m"],
  ["Sarah Kapoor", "Finance Lead", 22, "ALLOW", "Normal", "12m"],
  ["Vikram Khanna", "Engineering Lead", 38, "ALLOW", "Location change", "18m"],
  ["Nisha Patel", "Marketing Manager", 9, "ALLOW", "Normal", "21m"],
  ["Rahul Singh", "Frontend Engineer", 74, "RESTRICT", "Request burst", "28m"],
  ["Ananya Mehta", "People Operations", 16, "ALLOW", "Normal", "31m"]
];

export default function UsersRisk() {
  return (
    <div className="sec-page">

      <div className="sec-page-heading">
        <div>
          <span className="sec-eyebrow">SECURITY CONSOLE</span>
          <h1>Users & Risk</h1>
          <p>Understand current trust and behavioural risk across users.</p>
        </div>

        <button className="sec-secondary-button">
          Export report
          <ArrowUpRight size={13} />
        </button>
      </div>

      <div className="sec-user-summary">
        <div>
          <ShieldCheck size={17} />
          <span>Low Risk</span>
          <strong>1,186</strong>
        </div>

        <div>
          <ShieldAlert size={17} />
          <span>Medium Risk</span>
          <strong>45</strong>
        </div>

        <div>
          <ShieldAlert size={17} />
          <span>High Risk</span>
          <strong>17</strong>
        </div>
      </div>

      <div className="sec-toolbar">
        <div className="sec-search">
          <Search size={15} />
          <input placeholder="Search users..." />
        </div>

        <div className="sec-filter-group">
          <button className="active">All users</button>
          <button>High risk</button>
          <button>Restricted</button>
          <button>Active</button>
        </div>
      </div>

      <section className="sec-panel">
        <div className="sec-user-table-head">
          <span>USER</span>
          <span>ROLE</span>
          <span>RISK</span>
          <span>DECISION</span>
          <span>PRIMARY SIGNAL</span>
          <span>LAST EVENT</span>
          <span />
        </div>

        {users.map((user, index) => (
          <motion.div
            className="sec-user-row"
            key={user[0]}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * .04 }}
          >
            <div className="sec-user-name">
              <div>{user[0].split(" ").map(x => x[0]).join("")}</div>
              <strong>{user[0]}</strong>
            </div>

            <span>{user[1]}</span>

            <div className={`sec-user-risk ${
              user[2] >= 70 ? "high" : user[2] >= 40 ? "medium" : "low"
            }`}>
              <strong>{user[2]}</strong>
              <div><i style={{ width: `${user[2]}%` }} /></div>
            </div>

            <span className={`sec-decision ${user[3].toLowerCase()}`}>
              {user[3]}
            </span>

            <span>{user[4]}</span>
            <time>{user[5]}</time>

            <button className="sec-table-menu">
              <MoreHorizontal size={15} />
            </button>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
