import nodemailer from "nodemailer";

function configured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SECURITY_ALERT_RECIPIENT);
}

let transporter;
function getTransporter() {
  if (!configured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || "false") === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
  }
  return transporter;
}

export async function sendSecurityIncidentAlert({ user, event, risk, decision, resource, timestamp }) {
  const mailer = getTransporter();
  if (!mailer) return { sent: false, configured: false };

  const factors = (risk?.factors || [])
    .map((f) => `<li><strong>${escapeHtml(f.type)}</strong>: +${Number(f.points) || 0} — ${escapeHtml(f.detail || "")}</li>`)
    .join("");

  const subject = `[DataTripwire] ${decision} — ${user.username || user.email} — risk ${risk.score}/100`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:720px;margin:auto">
      <h2 style="margin-bottom:4px">DataTripwire Security Incident</h2>
      <p style="color:#667085">Adaptive access event detected and recorded.</p>
      <table cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;border:1px solid #ddd">
        <tr><td><b>User</b></td><td>${escapeHtml(user.username || "Unknown")} (${escapeHtml(user.email || "")})</td></tr>
        <tr><td><b>Time</b></td><td>${escapeHtml(timestamp)}</td></tr>
        <tr><td><b>Resource</b></td><td>${escapeHtml(resource || "Unknown")}</td></tr>
        <tr><td><b>Action</b></td><td>${escapeHtml(event.action || event.event_type || "Unknown")}</td></tr>
        <tr><td><b>Risk Score</b></td><td><strong>${risk.score}/100</strong></td></tr>
        <tr><td><b>Decision</b></td><td><strong>${escapeHtml(decision)}</strong></td></tr>
      </table>
      <h3>Decision flow</h3><p><b>Login → Behaviour Event → Risk Score → Policy Evaluation → Enforcement → Audit</b></p><h3>Risk factors</h3><ul>${factors || "<li>No individual factors recorded.</li>"}</ul>
      <p style="font-size:12px;color:#667085">This alert contains security telemetry from an authorized enterprise security system. The employee-facing application does not expose the internal SOC workflow.</p>
    </div>`;

  await mailer.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: process.env.SECURITY_ALERT_RECIPIENT,
    subject,
    html
  });
  return { sent: true, configured: true };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");
}
