import { query } from "../../config/database.js";

const EXPOSURE_WINDOWS = Object.freeze({
    "24h": 24,
    "7d": 168,
    "30d": 720
});

export function parseExposureWindow(value = "7d") {
    const key = String(value || "7d").trim().toLowerCase();
    const hours = EXPOSURE_WINDOWS[key];
    return hours ? { key, hours } : null;
}

function count(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric > 0 ? Math.floor(numeric) : 0;
}

function severityFor(score) {
    if (score >= 70) return "CRITICAL";
    if (score >= 50) return "HIGH";
    if (score >= 30) return "MEDIUM";
    return "LOW";
}

/**
 * Explainable report-only heuristic. It does not alter the existing session
 * risk score or enforce a policy. It uses event counts and trusted catalog
 * sensitivity; byte volume is explicitly unavailable in this version.
 */
export function calculateDataExposureRisk(metrics = {}, previousSensitiveAccessCount = 0) {
    const sensitiveAccessCount = count(metrics.sensitive_access_count);
    const downloads = count(metrics.sensitive_download_count);
    const copies = count(metrics.sensitive_copy_count);
    const exports = count(metrics.sensitive_export_count);
    const bulkDownloads = count(metrics.sensitive_bulk_download_count);
    const uniqueResources = count(metrics.unique_sensitive_resources);
    const previousAccessCount = count(previousSensitiveAccessCount);
    const movementCount = downloads + copies + exports + bulkDownloads;

    const components = [
        {
            code: "SENSITIVE_ACCESS_ACTIVITY",
            points: Math.min(25, sensitiveAccessCount * 2),
            detail: sensitiveAccessCount + " sensitive-resource access event(s) in the selected window."
        },
        {
            code: "SENSITIVE_DATA_MOVEMENT",
            points: Math.min(40, movementCount * 10),
            detail: movementCount + " sensitive download/copy/export event(s) in the selected window."
        },
        {
            code: "RESOURCE_BREADTH",
            points: Math.min(20, Math.max(0, uniqueResources - 1) * 4),
            detail: "Sensitive activity spans " + uniqueResources + " distinct resource(s)."
        },
        {
            code: "REPEATED_EXPORT_ACTIVITY",
            points: Math.min(20, exports * 10 + bulkDownloads * 10),
            detail: (exports + bulkDownloads) + " sensitive export/bulk-download event(s) observed."
        }
    ];

    let trendPoints = 0;
    if (previousAccessCount === 0 && sensitiveAccessCount >= 5) {
        trendPoints = 10;
    } else if (
        previousAccessCount > 0 &&
        sensitiveAccessCount - previousAccessCount >= 3 &&
        sensitiveAccessCount >= previousAccessCount * 1.5
    ) {
        trendPoints = 15;
    }

    if (trendPoints > 0) {
        components.push({
            code: "EXPOSURE_INCREASE",
            points: trendPoints,
            detail: "Sensitive-resource access increased compared with the preceding equal-length window."
        });
    }

    const score = Math.min(100, components.reduce((total, item) => total + item.points, 0));
    return {
        score,
        severity: severityFor(score),
        factors: components.filter(item => item.points > 0),
        calculation: "Explainable heuristic; not a trained ML probability."
    };
}

function currentMetrics(row) {
    return {
        sensitive_access_count: count(row.current_sensitive_access_count),
        sensitive_download_count: count(row.current_sensitive_download_count),
        sensitive_copy_count: count(row.current_sensitive_copy_count),
        sensitive_export_count: count(row.current_sensitive_export_count),
        sensitive_bulk_download_count: count(row.current_sensitive_bulk_download_count),
        unique_sensitive_resources: count(row.current_unique_sensitive_resources),
        recorded_bytes: null,
        byte_volume_status: "NOT_CAPTURED"
    };
}

function previousMetrics(row) {
    return {
        sensitive_access_count: count(row.previous_sensitive_access_count),
        sensitive_download_count: count(row.previous_sensitive_download_count),
        sensitive_copy_count: count(row.previous_sensitive_copy_count),
        sensitive_export_count: count(row.previous_sensitive_export_count),
        sensitive_bulk_download_count: count(row.previous_sensitive_bulk_download_count),
        unique_sensitive_resources: count(row.previous_unique_sensitive_resources),
        recorded_bytes: null,
        byte_volume_status: "NOT_CAPTURED"
    };
}

function activitySignal(metrics) {
    return metrics.sensitive_access_count +
        2 * (
            metrics.sensitive_download_count +
            metrics.sensitive_copy_count +
            metrics.sensitive_export_count +
            metrics.sensitive_bulk_download_count
        );
}

function compareWindows(current, previous) {
    const currentSignal = activitySignal(current);
    const previousSignal = activitySignal(previous);
    const delta = currentSignal - previousSignal;
    let direction = "STABLE";

    if (currentSignal === 0 && previousSignal === 0) direction = "NO_ACTIVITY";
    else if (currentSignal > 0 && previousSignal === 0 && currentSignal >= 5) direction = "RISING";
    else if (delta >= Math.max(3, Math.ceil(previousSignal * 0.5))) direction = "RISING";
    else if (delta <= -Math.max(3, Math.ceil(previousSignal * 0.5))) direction = "DECLINING";

    return { direction, activity_signal_delta: delta };
}

const DATA_EXPOSURE_QUERY = [
    "WITH bounds AS (",
    "  SELECT NOW() AS as_of, ($1::int * INTERVAL '1 hour') AS span",
    "), raw_events AS (",
    "  SELECT be.id, be.user_id, be.resource, UPPER(COALESCE(be.action, '')) AS action,",
    "         be.created_at, r.id::text AS catalog_resource_id, r.sensitivity",
    "  FROM behavior_events be",
    "  JOIN resources r ON (LOWER(r.name) = LOWER(be.resource) OR r.id::text = be.resource)",
    "  CROSS JOIN bounds b",
    "  WHERE UPPER(REPLACE(REPLACE(be.event_type, '-', '_'), ' ', '_')) = 'RESOURCE_ACCESS'",
    "    AND be.created_at <= b.as_of",
    "    AND be.created_at >= b.as_of - (b.span * 2)",
    "), events AS (",
    "  SELECT raw_events.* FROM raw_events",
    "  WHERE sensitivity IN ('CONFIDENTIAL', 'RESTRICTED')",
    ")",
    "SELECT u.id AS user_id, u.username, u.role,",
    "  COUNT(e.id) FILTER (WHERE e.created_at >= b.as_of - b.span)::int AS current_sensitive_access_count,",
    "  COUNT(e.id) FILTER (WHERE e.created_at >= b.as_of - b.span AND e.action = 'DOWNLOAD')::int AS current_sensitive_download_count,",
    "  COUNT(e.id) FILTER (WHERE e.created_at >= b.as_of - b.span AND e.action = 'COPY')::int AS current_sensitive_copy_count,",
    "  COUNT(e.id) FILTER (WHERE e.created_at >= b.as_of - b.span AND e.action IN ('EXPORT', 'API_EXPORT'))::int AS current_sensitive_export_count,",
    "  COUNT(e.id) FILTER (WHERE e.created_at >= b.as_of - b.span AND e.action = 'BULK_DOWNLOAD')::int AS current_sensitive_bulk_download_count,",
    "  COUNT(DISTINCT e.catalog_resource_id) FILTER (WHERE e.created_at >= b.as_of - b.span)::int AS current_unique_sensitive_resources,",
    "  COUNT(e.id) FILTER (WHERE e.created_at < b.as_of - b.span)::int AS previous_sensitive_access_count,",
    "  COUNT(e.id) FILTER (WHERE e.created_at < b.as_of - b.span AND e.action = 'DOWNLOAD')::int AS previous_sensitive_download_count,",
    "  COUNT(e.id) FILTER (WHERE e.created_at < b.as_of - b.span AND e.action = 'COPY')::int AS previous_sensitive_copy_count,",
    "  COUNT(e.id) FILTER (WHERE e.created_at < b.as_of - b.span AND e.action IN ('EXPORT', 'API_EXPORT'))::int AS previous_sensitive_export_count,",
    "  COUNT(e.id) FILTER (WHERE e.created_at < b.as_of - b.span AND e.action = 'BULK_DOWNLOAD')::int AS previous_sensitive_bulk_download_count,",
    "  COUNT(DISTINCT e.catalog_resource_id) FILTER (WHERE e.created_at < b.as_of - b.span)::int AS previous_unique_sensitive_resources,",
    "  MAX(e.created_at) FILTER (WHERE e.created_at >= b.as_of - b.span) AS last_event_at",
    "FROM users u",
    "CROSS JOIN bounds b",
    "JOIN events e ON e.user_id = u.id",
    "GROUP BY u.id, u.username, u.role, b.as_of, b.span",
    "ORDER BY current_sensitive_download_count DESC, current_sensitive_access_count DESC, last_event_at DESC NULLS LAST",
    "LIMIT $2"
].join("\n");

export async function getDataExposureReport({ windowHours = 168, limit = 50 } = {}) {
    const safeHours = [24, 168, 720].includes(Number(windowHours)) ? Number(windowHours) : 168;
    const safeLimit = Math.max(1, Math.min(100, count(limit) || 50));
    const result = await query(DATA_EXPOSURE_QUERY, [safeHours, safeLimit]);

    const users = result.rows.map(row => {
        const current = currentMetrics(row);
        const previous = previousMetrics(row);
        const currentRisk = calculateDataExposureRisk(current, previous.sensitive_access_count);
        const previousRisk = calculateDataExposureRisk(previous, 0);

        return {
            user_id: row.user_id,
            username: row.username,
            role: row.role,
            current: {
                metrics: current,
                data_exposure_risk: currentRisk.score,
                severity: currentRisk.severity,
                factors: currentRisk.factors
            },
            previous: {
                metrics: previous,
                data_exposure_risk: previousRisk.score,
                severity: previousRisk.severity,
                factors: previousRisk.factors
            },
            trend: compareWindows(current, previous),
            last_event_at: row.last_event_at ?? null
        };
    });

    return {
        generated_at: new Date().toISOString(),
        window: {
            hours: safeHours,
            key: safeHours === 24 ? "24h" : safeHours === 720 ? "30d" : "7d",
            comparison: "current window versus preceding equal-length window"
        },
        count: users.length,
        classification_source: "resources.sensitivity",
        telemetry_note: "Only events matched to a resource in the trusted resources catalogue with CONFIDENTIAL or RESTRICTED sensitivity are included. Data-transfer byte volume is not captured by this report; recorded_bytes is null and must not be interpreted as zero.",
        risk_note: "This is a report-only heuristic. It does not modify session risk decisions or enforce policy.",
        users
    };
}


const USER_EXPOSURE_QUERY = [
    "WITH bounds AS (",
    "  SELECT NOW() AS as_of, ($2::int * INTERVAL '1 hour') AS span",
    "), events AS (",
    "  SELECT be.id, UPPER(COALESCE(be.action, '')) AS action, be.created_at, r.id::text AS catalog_resource_id",
    "  FROM behavior_events be",
    "  JOIN resources r ON (LOWER(BTRIM(r.name)) = LOWER(BTRIM(be.resource)) OR r.id::text = BTRIM(be.resource))",
    "  CROSS JOIN bounds b",
    "  WHERE be.user_id = $1",
    "    AND UPPER(REPLACE(REPLACE(be.event_type, '-', '_'), ' ', '_')) = 'RESOURCE_ACCESS'",
    "    AND r.sensitivity IN ('CONFIDENTIAL', 'RESTRICTED')",
    "    AND be.created_at <= b.as_of",
    "    AND be.created_at >= b.as_of - (b.span * 2)",
    ")",
    "SELECT",
    "  COUNT(e.id) FILTER (WHERE e.created_at >= b.as_of - b.span)::int AS current_sensitive_access_count,",
    "  COUNT(e.id) FILTER (WHERE e.created_at >= b.as_of - b.span AND e.action = 'DOWNLOAD')::int AS current_sensitive_download_count,",
    "  COUNT(e.id) FILTER (WHERE e.created_at >= b.as_of - b.span AND e.action = 'COPY')::int AS current_sensitive_copy_count,",
    "  COUNT(e.id) FILTER (WHERE e.created_at >= b.as_of - b.span AND e.action IN ('EXPORT', 'API_EXPORT'))::int AS current_sensitive_export_count,",
    "  COUNT(e.id) FILTER (WHERE e.created_at >= b.as_of - b.span AND e.action = 'BULK_DOWNLOAD')::int AS current_sensitive_bulk_download_count,",
    "  COUNT(DISTINCT e.catalog_resource_id) FILTER (WHERE e.created_at >= b.as_of - b.span)::int AS current_unique_sensitive_resources,",
    "  COUNT(e.id) FILTER (WHERE e.created_at < b.as_of - b.span)::int AS previous_sensitive_access_count,",
    "  COUNT(e.id) FILTER (WHERE e.created_at < b.as_of - b.span AND e.action = 'DOWNLOAD')::int AS previous_sensitive_download_count,",
    "  COUNT(e.id) FILTER (WHERE e.created_at < b.as_of - b.span AND e.action = 'COPY')::int AS previous_sensitive_copy_count,",
    "  COUNT(e.id) FILTER (WHERE e.created_at < b.as_of - b.span AND e.action IN ('EXPORT', 'API_EXPORT'))::int AS previous_sensitive_export_count,",
    "  COUNT(e.id) FILTER (WHERE e.created_at < b.as_of - b.span AND e.action = 'BULK_DOWNLOAD')::int AS previous_sensitive_bulk_download_count,",
    "  COUNT(DISTINCT e.catalog_resource_id) FILTER (WHERE e.created_at < b.as_of - b.span)::int AS previous_unique_sensitive_resources",
    "FROM bounds b LEFT JOIN events e ON TRUE",
    "GROUP BY b.as_of, b.span"
].join("\n");

/**
 * Calculate one user's exposure signal for deterministic risk fusion.
 * Classification comes from the trusted resources catalogue, not client metadata.
 */
export async function getUserDataExposureRisk(userId, { windowHours = 168 } = {}) {
    if (!userId) throw new TypeError("userId is required");
    const safeHours = [24, 168, 720].includes(Number(windowHours)) ? Number(windowHours) : 168;
    const result = await query(USER_EXPOSURE_QUERY, [userId, safeHours]);
    const row = result.rows[0] ?? {};
    const current = currentMetrics(row);
    const previous = previousMetrics(row);
    const assessment = calculateDataExposureRisk(current, previous.sensitive_access_count);

    return {
        score: assessment.score,
        severity: assessment.severity,
        factors: assessment.factors,
        metrics: current,
        previousMetrics: previous,
        trend: compareWindows(current, previous),
        window: safeHours === 24 ? "24h" : safeHours === 720 ? "30d" : "7d",
        classificationSource: "resources.sensitivity",
        telemetryNote: "Only logged resource events joined to CONFIDENTIAL or RESTRICTED catalogue resources are scored. Data-transfer byte volume and local-device activity are not captured."
    };
}
