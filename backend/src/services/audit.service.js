import { query } from "../config/database.js";

export async function writeAudit({
    userId = null, sessionId = null, eventType, action,
    severity = "info", details = {}, ipAddress = null
}) {
    await query(
        `INSERT INTO audit_logs
        (user_id, session_id, event_type, action, severity, details, ip_address)
        VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [userId, sessionId, eventType, action, severity, details, ipAddress]
    );
}
