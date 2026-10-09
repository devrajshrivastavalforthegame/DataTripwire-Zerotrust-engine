import { motion } from "motion/react";
import {
  Plus,
  List,
  Columns3,
  CalendarDays,
  MoreHorizontal,
  GripVertical,
  Clock3
} from "lucide-react";

import {
  PageHeading,
  StatusPill
} from "../../components/workshepher/WorkspaceWidgets";

const columns = [
  {
    id: "todo",
    title: "To Do",
    count: 4,
    tasks: [
      {
        title: "Prepare quarterly budget",
        project: "Finance Operations",
        priority: "High",
        due: "Today"
      },
      {
        title: "Review onboarding flow",
        project: "Product",
        priority: "Medium",
        due: "Tomorrow"
      },
      {
        title: "Update team directory",
        project: "People Ops",
        priority: "Low",
        due: "Fri"
      }
    ]
  },
  {
    id: "progress",
    title: "In Progress",
    count: 3,
    tasks: [
      {
        title: "Q4 financial report",
        project: "Finance Operations",
        priority: "High",
        due: "Today",
        progress: 72
      },
      {
        title: "Mobile experience",
        project: "Product",
        priority: "Medium",
        due: "Thu",
        progress: 54
      },
      {
        title: "Client presentation",
        project: "Northwind",
        priority: "Medium",
        due: "Fri",
        progress: 28
      }
    ]
  },
  {
    id: "review",
    title: "Review",
    count: 2,
    tasks: [
      {
        title: "Security requirements",
        project: "Engineering",
        priority: "High",
        due: "Today"
      },
      {
        title: "Brand guidelines",
        project: "Marketing",
        priority: "Low",
        due: "Tomorrow"
      }
    ]
  },
  {
    id: "completed",
    title: "Completed",
    count: 8,
    tasks: [
      {
        title: "Project kickoff",
        project: "Northwind",
        priority: "Medium",
        due: "Done"
      },
      {
        title: "Research summary",
        project: "Product",
        priority: "Low",
        due: "Done"
      }
    ]
  }
];

function TaskCard({ task, index }) {
  return (
    <motion.div
      className="ws-task-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      whileHover={{ y: -3 }}
    >
      <div className="ws-task-card-top">
        <span className="ws-drag-handle">
          <GripVertical size={15} />
        </span>

        <button className="ws-icon-button small">
          <MoreHorizontal size={16} />
        </button>
      </div>

      <h3>{task.title}</h3>

      <div className="ws-task-project">{task.project}</div>

      {task.progress !== undefined && (
        <div className="ws-task-progress">
          <div>
            <span>Progress</span>
            <strong>{task.progress}%</strong>
          </div>
          <div className="ws-progress">
            <div
              className="ws-progress-fill"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="ws-task-card-footer">
        <StatusPill
          tone={
            task.priority === "High"
              ? "danger"
              : task.priority === "Medium"
                ? "warning"
                : "neutral"
          }
        >
          {task.priority}
        </StatusPill>

        <span className="ws-task-due">
          <Clock3 size={13} />
          {task.due}
        </span>
      </div>
    </motion.div>
  );
}

export default function Tasks() {
  return (
    <div className="ws-page">
      <PageHeading
        eyebrow="WORKSPACE"
        title="Tasks"
        description="Plan, prioritize and keep work moving."
        action={
          <button className="ws-primary-button">
            <Plus size={17} />
            Create task
          </button>
        }
      />

      <div className="ws-view-toolbar">
        <div className="ws-view-switcher">
          <button className="active">
            <Columns3 size={16} />
            Board
          </button>
          <button>
            <List size={16} />
            List
          </button>
          <button>
            <CalendarDays size={16} />
            Calendar
          </button>
        </div>

        <div className="ws-toolbar-filters">
          <button>All tasks</button>
          <button>My tasks</button>
          <button>Priority</button>
        </div>
      </div>

      <div className="ws-kanban">
        {columns.map((column, columnIndex) => (
          <motion.section
            className="ws-kanban-column"
            key={column.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: columnIndex * 0.08 }}
          >
            <div className="ws-kanban-header">
              <div>
                <span className={`ws-column-dot ${column.id}`} />
                <strong>{column.title}</strong>
                <span className="ws-column-count">{column.count}</span>
              </div>

              <button className="ws-icon-button small">
                <Plus size={15} />
              </button>
            </div>

            <div className="ws-kanban-list">
              {column.tasks.map((task, index) => (
                <TaskCard
                  task={task}
                  index={index}
                  key={task.title}
                />
              ))}
            </div>
          </motion.section>
        ))}
      </div>
    </div>
  );
}
