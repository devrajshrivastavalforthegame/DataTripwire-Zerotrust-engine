import { Outlet } from "react-router-dom";
import WorkShepherSidebar from "../components/workshepher/Sidebar";
import WorkShepherTopbar from "../components/workshepher/Topbar";

export default function WorkShepherLayout() {
  return (
    <div className="app-shell workshepher-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <WorkShepherSidebar />

      <main className="app-main">
        <WorkShepherTopbar />

        <section className="page-container">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
