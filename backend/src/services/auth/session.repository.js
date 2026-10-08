import { query } from "../../config/database.js";

export async function createSession({
    userId,
    ipAddress = null,
    userAgent = null,
    deviceFingerprint = null,
    location = null
}) {
    const result = await query(
        `INSERT INTO sessions (
            user_id,
            ip_address,
            user_agent,
            device_fingerprint,
            location
         )
         VALUES ($1, $2, $3, $4, $5)
         RETURNING
            id,
            user_id,
            status,
            ip_address,
            user_agent,
            device_fingerprint,
            location,
            step_up_required,
            baseline_eligible,
            created_at,
            last_activity_at`,
        [
            userId,
            ipAddress,
            userAgent,
            deviceFingerprint,
            location
        ]
    );

    return result.rows[0];
}

export async function findSessionById(sessionId) {
    const result = await query(
        `SELECT
            id,
            user_id,
            status,
            ip_address,
            user_agent,
            device_fingerprint,
            location,
            step_up_required,
            step_up_verified_at,
            baseline_eligible,
            created_at,
            last_activity_at,
            ended_at
         FROM sessions
         WHERE id = $1
         LIMIT 1`,
        [sessionId]
    );

    return result.rows[0] || null;
}

export async function updateSessionActivity(sessionId) {
    const result = await query(
        `UPDATE sessions
         SET last_activity_at = NOW()
         WHERE id = $1
           AND status != 'ended'
         RETURNING
            id,
            status,
            last_activity_at`,
        [sessionId]
    );

    return result.rows[0] || null;
}

export async function endSession(sessionId) {
    const result = await query(
        `UPDATE sessions
         SET
            status = 'ended',
            ended_at = NOW(),
            last_activity_at = NOW()
         WHERE id = $1
           AND status != 'ended'
         RETURNING
            id,
            status,
            ended_at`,
        [sessionId]
    );

    return result.rows[0] || null;
}
