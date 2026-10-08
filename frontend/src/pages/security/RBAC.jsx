import { motion } from "motion/react";

export default function RBAC() {
  return (
    <motion.div
      className="page security-page"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="security-page-heading">
        <div>
          <span className="security-eyebrow">SECURITY CONSOLE</span>
          <h1>RBAC</h1>
          <p>Security intelligence and operational controls.</p>
        </div>
      </div>

      <section className="security-panel security-empty-panel">
        <div className="empty-security-icon">◌</div>
        <h2>RBAC</h2>
        <p>
          This module is ready for real backend-connected data and controls.
        </p>
      </section>
    </motion.div>
  );
}
