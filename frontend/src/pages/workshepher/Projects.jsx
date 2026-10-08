import { motion } from "motion/react";
import {
  Plus,
  MoreHorizontal,
  Users,
  CalendarDays,
  ArrowUpRight
} from "lucide-react";

import {
  PageHeading,
  ProgressBar,
  StatusPill
} from "../../components/workshepher/WorkspaceWidgets";

const projects = [
  {
    name: "Northwind Client Portal",
    description: "New customer experience and account workspace.",
    progress: 78,
    status: "On track",
    due: "Oct 24",
    team: 8,
    type: "Product"
  },
  {
    name: "Q4 Finance Operations",
    description: "Quarterly reporting, budgeting and compliance.",
    progress: 61,
    status: "On track",
    due: "Oct 28",
    team: 5,
    type: "Finance"
  },
  {
    name: "Workplace Experience",
    description: "Internal tools and employee experience improvements.",
    progress: 43,
    status: "At risk",
    due: "Nov 03",
    team: 12,
    type: "People"
  },
  {
    name: "Brand Refresh",
    description: "Visual identity, templates and communication system.",
    progress: 31,
    status: "Planning",
    due: "Nov 14",
    team: 6,
    type: "Marketing"
  }
];

export default function Projects() {
  return (
    <div className="ws-page">
      <PageHeading
        eyebrow="WORKSPACE"
        title="Projects"
        description="A clear view of everything your team is building."
        action={
          <button className="ws-primary-button">
            <Plus size={17} />
            New project
          </button>
        }
      />

      <div className="ws-project-filters">
        <button className="active">All projects</button>
        <button>Active</button>
        <button>Planning</button>
        <button>Completed</button>
      </div>

      <div className="ws-project-grid">
        {projects.map((project, index) => (
          <motion.article
            className="ws-project-card"
            key={project.name}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            whileHover={{ y: -4 }}
          >
            <div className="ws-project-top">
              <div className="ws-project-mark">
                {project.name.slice(0, 1)}
              </div>

              <button className="ws-icon-button">
                <MoreHorizontal size={18} />
              </button>
            </div>

            <div className="ws-project-type">{project.type}</div>
            <h2>{project.name}</h2>
            <p>{project.description}</p>

            <div className="ws-project-progress">
              <div>
                <span>Progress</span>
                <strong>{project.progress}%</strong>
              </div>
              <ProgressBar value={project.progress} />
            </div>

            <div className="ws-project-meta">
              <StatusPill tone={project.status === "At risk" ? "warning" : "success"}>
                {project.status}
              </StatusPill>

              <span>
                <Users size={14} />
                {project.team}
              </span>

              <span>
                <CalendarDays size={14} />
                {project.due}
              </span>
            </div>

            <button className="ws-project-open">
              Open project
              <ArrowUpRight size={15} />
            </button>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
