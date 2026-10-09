import { NavLink } from "react-router-dom";
import {
  ShieldCheck,
  LayoutDashboard,
  Activity,
  Users,
  Monitor,
  Database,
  Siren,
  ScrollText,
  GitBranch,
  LockKeyhole,
  FileClock,
  Zap,
  Bot,
  HeartPulse,
  Settings,
} from "lucide-react";

const navigation = [
  { label: "Overview", path: "/security", icon: LayoutDashboard, end: true },
  { label: "Live Activity", path: "/security/activity", icon: Activity },
  { label: "Users & Risk", path: "/security/users", icon: Users },
  { label: "Sessions", path: "/security/sessions", icon: Monitor },
  { label: "Resources", path: "/security/resources", icon: Database },
  { label: "Incidents", path: "/security/incidents", icon: Siren },
  { label: "Policy Engine", path: "/security/policy", icon: GitBranch },
  { label: "Access Governance", path: "/security/rbac", icon: LockKeyhole },
  { label: "Audit Logs", path: "/security/audit", icon: FileClock },
  { label: "Adaptive Response", path: "/security/response", icon: Zap },
  { label: "AI Security Copilot", path: "/security/copilot", icon: Bot },
  { label: "System Health", path: "/security/health", icon: HeartPulse },
  { label: "Settings", path: "/security/settings", icon: Settings },
];

export default function SecuritySidebar() {
  return (
    <aside className="sidebar security-sidebar">
      <div className="security-brand">
        <div className="security-brand-icon">
          <ShieldCheck size={20} />
        </div>

        <div>
          <div className="security-brand-name">DataTripwire</div>
          <div className="security-brand-caption">SECURITY CONSOLE</div>
        </div>
      </div>

      <div className="monitoring-status">
        <span className="monitoring-pulse" />
        <span>Live Monitoring</span>
      </div>

      <nav className="sidebar-navigation">
        <div className="nav-section-label">SECURITY OPERATIONS</div>

        {navigation.map(({ label, path, icon: Icon, end }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <Icon size={17} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="security-admin">
        <div className="admin-avatar">AD</div>

        <div>
          <strong>Security Admin</strong>
          <span>Administrator</span>
        </div>
      </div>
    </aside>
  );
}
