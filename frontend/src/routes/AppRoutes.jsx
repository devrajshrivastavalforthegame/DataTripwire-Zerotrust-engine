import { Routes, Route } from "react-router-dom";

import WorkShepherLayout from "../layouts/WorkShepherLayout";
import SecurityLayout from "../layouts/SecurityLayout";

import Login from "../pages/workshepher/Login";
import Dashboard from "../pages/workshepher/Dashboard";
import Tasks from "../pages/workshepher/Tasks";
import Projects from "../pages/workshepher/Projects";
import Documents from "../pages/workshepher/Documents";
import Reports from "../pages/workshepher/Reports";
import Approvals from "../pages/workshepher/Approvals";
import Team from "../pages/workshepher/Team";
import Calendar from "../pages/workshepher/Calendar";
import Messages from "../pages/workshepher/Messages";
import Profile from "../pages/workshepher/Profile";
import Settings from "../pages/workshepher/Settings";
import Help from "../pages/workshepher/Help";

import SecurityOverview from "../pages/security/Overview";
import LiveActivity from "../pages/security/LiveActivity";
import UsersRisk from "../pages/security/UsersRisk";
import Sessions from "../pages/security/Sessions";
import Resources from "../pages/security/Resources";
import Incidents from "../pages/security/Incidents";
import PolicyEngine from "../pages/security/PolicyEngine";
import RBAC from "../pages/security/RBAC";
import AuditLogs from "../pages/security/AuditLogs";
import AdaptiveResponse from "../pages/security/AdaptiveResponse";
import AICopilot from "../pages/security/AICopilot";
import SystemHealth from "../pages/security/SystemHealth";
import SecuritySettings from "../pages/security/Settings";
import AuthGate from "./AuthGate";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<AuthGate><WorkShepherLayout /></AuthGate>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/approvals" element={<Approvals />} />
        <Route path="/team" element={<Team />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/help" element={<Help />} />
      </Route>

      <Route element={<AuthGate security><SecurityLayout /></AuthGate>}>
        <Route path="/security" element={<SecurityOverview />} />
        <Route path="/security/activity" element={<LiveActivity />} />
        <Route path="/security/users" element={<UsersRisk />} />
        <Route path="/security/sessions" element={<Sessions />} />
        <Route path="/security/resources" element={<Resources />} />
        <Route path="/security/incidents" element={<Incidents />} />
        <Route path="/security/policy" element={<PolicyEngine />} />
        <Route path="/security/rbac" element={<RBAC />} />
        <Route path="/security/audit" element={<AuditLogs />} />
        <Route path="/security/response" element={<AdaptiveResponse />} />
        <Route path="/security/copilot" element={<AICopilot />} />
        <Route path="/security/health" element={<SystemHealth />} />
        <Route path="/security/settings" element={<SecuritySettings />} />
      </Route>
    </Routes>
  );
}
