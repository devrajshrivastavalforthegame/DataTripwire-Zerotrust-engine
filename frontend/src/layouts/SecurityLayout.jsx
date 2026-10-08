import { Outlet } from "react-router-dom";
import SecuritySidebar from "../components/security/Sidebar";
import SecurityTopbar from "../components/security/Topbar";

export default function SecurityLayout() {
  return (
    <div className="app-shell security-shell">
      <div className="security-grid" />
      <div className="security-ambient security-ambient-one" />
      <div className="security-ambient security-ambient-two" />

      <SecuritySidebar />

      <main className="app-main security-main">
        <SecurityTopbar />

        <section className="page-container security-page-container">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
