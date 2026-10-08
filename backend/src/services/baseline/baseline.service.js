import { query } from "../../config/database.js";

function average(values) {
    if (!values.length) return 0;
    return values.reduce((sum, value) => sum + Number(value), 0) / values.length;
}

export async function calculateUserBaseline(userId) {
    const result = await query(`
        SELECT be.session_id, be.event_type, be.resource, be.device_fingerprint,
               be.location, be.request_count, be.metadata, be.created_at
        FROM behavior_events be
        JOIN sessions s ON s.id = be.session_id
        WHERE be.user_id = $1 AND s.baseline_eligible = TRUE AND s.status = 'active'
        ORDER BY be.created_at ASC`, [userId]);

    const events = result.rows;
    if (!events.length) return null;

    const loginHours = events.filter(e => e.event_type === "login")
        .map(e => new Date(e.created_at).getHours());
    const requests = events.map(e => Number(e.request_count)).filter(Number.isFinite);

    const bySession = new Map();
    for (const e of events) {
        if (!e.session_id || !e.resource) continue;
        if (!bySession.has(e.session_id)) bySession.set(e.session_id, new Set());
        bySession.get(e.session_id).add(e.resource);
    }

    const knownDevices = [...new Set(events.map(e => e.device_fingerprint).filter(Boolean))];
    const knownLocations = [...new Set(events.map(e => e.location).filter(Boolean))];
    const commonResourceTypes = [...new Set(events.map(e => e.metadata?.resource_type)
        .filter(v => typeof v === "string" && v.trim()).map(v => v.trim().toLowerCase()))];
    const avgRequests = average(requests);
    const avgResources = average([...bySession.values()].map(s => s.size));
    const baseline = {
        userId,
        usualLoginHourStart: loginHours.length ? Math.min(...loginHours) : null,
        usualLoginHourEnd: loginHours.length ? Math.max(...loginHours) : null,
        avgRequestsPerMinute: avgRequests,
        avgResourcesPerSession: avgResources,
        knownDevices,
        knownLocations,
        commonResourceTypes,
        sampleCount: events.length
    };

    await query(`
        INSERT INTO user_baselines
        (user_id, avg_request_count, common_device, common_location, common_resources,
         usual_login_hour_start, usual_login_hour_end, avg_requests_per_minute,
         avg_resources_per_session, known_devices, known_locations, common_resource_types,
         sample_count, baseline_version, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,2,NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          avg_request_count=EXCLUDED.avg_request_count,
          common_device=EXCLUDED.common_device,
          common_location=EXCLUDED.common_location,
          common_resources=EXCLUDED.common_resources,
          usual_login_hour_start=EXCLUDED.usual_login_hour_start,
          usual_login_hour_end=EXCLUDED.usual_login_hour_end,
          avg_requests_per_minute=EXCLUDED.avg_requests_per_minute,
          avg_resources_per_session=EXCLUDED.avg_resources_per_session,
          known_devices=EXCLUDED.known_devices,
          known_locations=EXCLUDED.known_locations,
          common_resource_types=EXCLUDED.common_resource_types,
          sample_count=EXCLUDED.sample_count,
          baseline_version=user_baselines.baseline_version + 1,
          updated_at=NOW()`,
        [userId, avgRequests, knownDevices[0] ?? null, knownLocations[0] ?? null,
         JSON.stringify([...new Set(events.map(e => e.resource).filter(Boolean))]),
         baseline.usualLoginHourStart, baseline.usualLoginHourEnd, avgRequests, avgResources,
         JSON.stringify(knownDevices), JSON.stringify(knownLocations), JSON.stringify(commonResourceTypes),
         baseline.sampleCount]
    );
    return baseline;
}

export async function getUserBaseline(userId) {
    const result = await query(`SELECT * FROM user_baselines WHERE user_id=$1`, [userId]);
    return result.rows[0] ?? null;
}
