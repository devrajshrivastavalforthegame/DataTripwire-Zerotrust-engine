import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  FileText,
  BarChart3,
  ClipboardCheck,
  Users,
  CalendarDays,
  MessageSquare,
  HelpCircle,
  Settings,
  UserRound,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Tasks", path: "/tasks", icon: CheckSquare },
  { label: "Projects", path: "/projects", icon: FolderKanban },
  { label: "Documents", path: "/documents", icon: FileText },
  { label: "Reports", path: "/reports", icon: BarChart3 },
  { label: "Approvals", path: "/approvals", icon: ClipboardCheck },
  { label: "Team", path: "/team", icon: Users },
  { label: "Calendar", path: "/calendar", icon: CalendarDays },
  { label: "Messages", path: "/messages", icon: MessageSquare },
];

export default function WorkShepherSidebar() {
  return (
    <aside className="sidebar workshepher-sidebar">
      <div className="brand-block">
        <div className="brand-mark">W</div>

        <div>
          <div className="brand-name">WorkShepher</div>
          <div className="brand-caption">Workspace</div>
        </div>
      </div>

      <nav className="sidebar-navigation">
        <div className="nav-section-label">WORKSPACE</div>

        {navigation.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <NavLink to="/profile" className="sidebar-link">
          <UserRound size={18} strokeWidth={1.8} />
          <span>Profile</span>
        </NavLink>

        <NavLink to="/settings" className="sidebar-link">
          <Settings size={18} strokeWidth={1.8} />
          <span>Settings</span>
        </NavLink>

        <NavLink to="/help" className="sidebar-link">
          <HelpCircle size={18} strokeWidth={1.8} />
          <span>Help</span>
        </NavLink>
      </div>

      <div className="workspace-user">
        <div className="avatar">OM</div>

        <div className="workspace-user-info">
          <strong>Workspace User</strong>
          <span>Employee</span>
        </div>
      </div>
    </aside>
  );
}
