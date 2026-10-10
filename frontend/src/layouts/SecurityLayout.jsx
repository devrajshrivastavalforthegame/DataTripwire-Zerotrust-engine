import { Outlet } from "react-router-dom";
import InteractionBridge from "../components/common/InteractionBridge";
import SecuritySidebar from "../components/security/Sidebar";
import SecurityTopbar from "../components/security/Topbar";

export default function SecurityLayout() {
  return (
    <div>
      <InteractionBridge />
      <div className="app-shell security-shell">
        <div className="security-grid" />
        <div className="security-stars" />
        <div className="security-scan" />
        <div className="security-ambient security-ambient-one" />
        <div className="security-ambient security-ambient-two" />
        <div className="security-orb security-orb-one" />
        <div className="security-orb security-orb-two" />
        <div className="security-orb security-orb-three" />

        <SecuritySidebar />

        <main className="app-main security-main">
          <SecurityTopbar />

          <section className="page-container security-page-container">
            <Outlet />
          </section>
        </main>
      </div>
    </div>
  );
}
