import { query } from "../config/database.js";

const WINDOWS = Object.freeze({ today: "24 hours", days7: "7 days", days30: "30 days" });
const CLASSIFICATION_WEIGHT = Object.freeze({ PUBLIC: 0.05, INTERNAL: 0.15, CONFIDENTIAL: 0.4, RESTRICTED: 0.7, CRITICAL: 1 });
const MOVEMENT_ACTIONS = new Set(["DOWNLOAD", "EXPORT", "BULK_DOWNLOAD", "SHARE", "API_EXPORT", "COPY"]);

function severityFor(score) {
    if (score >= 70) return "CRITICAL";
    if (score >= 50) return "HIGH";
    if (score >= 30) return "MEDIUM";
    return "LOW";
}

export function calculateExposureRisk(rows = []) {
    const events = rows.map((row) => ({
        ...row,
        classification: String(row.classification || "INTERNAL").toUpperCase(),
        action: String(row.action || "VIEW").toUpperCase(),
        bytes_transferred: row.bytes_transferred == null ? null : Number(row.bytes_transferred)
    }));
    const weighted = events.reduce((sum, event) => sum + (CLASSIFICATION_WEIGHT[event.classification] ?? CLASSIFICATION_WEIGHT.INTERNAL), 0);
    const sensitive = events.filter((event) => !["PUBLIC", "INTERNAL"].includes(event.classification));
    const movements = events.filter((event) => MOVEMENT_ACTIONS.has(event.action));
    const measuredBytes = events.filter((event) => Number.isFinite(event.bytes_transferred) && event.bytes_transferred >= 0);
    const totalMeasuredBytes = measuredBytes.reduce((sum, event) => sum + event.bytes_transferred, 0);
    const sensitiveMeasuredBytes = measuredBytes
        .filter((event) => !["PUBLIC", "INTERNAL"].includes(event.classification))
        .reduce((sum, event) => sum + event.bytes_transferred, 0);
    const departments = new Set(events.map((event) => event.department).filter(Boolean));
    const resources = new Set(events.map((event) => event.resource_id).filter(Boolean));
    const bulk = events.filter((event) => event.action === "BULK_DOWNLOAD").length;

    const DER = Math.min(100, Math.round(
        weighted * 4 +
        sensitive.length * 3 +
        Math.min(25, totalMeasuredBytes / (1024 * 1024)) +
        Math.min(20, departments.size * 5)
    ));
    const ER = Math.min(100, Math.round(
        movements.length * 8 +
        bulk * 18 +
        Math.min(30, sensitive.length * 2) +
        (sensitiveMeasuredBytes > 0 ? Math.min(25, sensitiveMeasuredBytes / (1024 * 1024)) : 0) +
        Math.min(15, Math.max(0, departments.size - 1) * 8)
    ));
    const DBR = Math.min(100, Math.round(DER * 0.45 + ER * 0.55));

    return {
        eventCount: events.length,
        sensitiveFiles: sensitive.length,
        criticalFiles: events.filter((event) => event.classification === "CRITICAL").length,
        downloads: events.filter((event) => ["DOWNLOAD", "BULK_DOWNLOAD"].includes(event.action)).length,
        exports: movements.length,
        totalBytes: measuredBytes.length ? totalMeasuredBytes : null,
        bytesMeasuredEvents: measuredBytes.length,
        bytesVolumeStatus: measuredBytes.length ? "PARTIALLY_OR_FULLY_MEASURED" : "NOT_CAPTURED",
        sensitiveBytes: measuredBytes.length ? sensitiveMeasuredBytes : null,
        uniqueResources: resources.size,
        uniqueDepartments: departments.size,
        DER,
        ER,
        DBR,
        level: severityFor(DBR)
    };
}

export async function getExposure(req, res) {
    try {
        const requestedUserId = req.query.userId;
        if (requestedUserId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestedUserId)) {
            return res.status(400).json({ error: "userId must be a valid UUID" });
        }
        const userId = req.auth.portal === "employee" ? req.auth.user.id : (requestedUserId || null);
        const results = await Promise.all(Object.entries(WINDOWS).map(async ([key, interval]) => {
            const result = await query(
                `SELECT dae.action,
                        COALESCE(r.sensitivity, dae.classification) AS classification,
                        dae.bytes_transferred,
                        COALESCE(dae.department, u.department) AS department,
                        dae.resource_id,
                        dae.created_at
                   FROM data_access_events dae
                   LEFT JOIN resources r ON r.id = dae.resource_id
                   LEFT JOIN users u ON u.id = dae.user_id
                  WHERE dae.created_at >= NOW() - $1::interval
                    AND ($2::uuid IS NULL OR dae.user_id = $2)
                  ORDER BY dae.created_at DESC
                  LIMIT 5000`,
                [interval, userId]
            );
            return [key, calculateExposureRisk(result.rows)];
        }));
        const windows = Object.fromEntries(results);
        const score = Math.max(windows.today.DBR, windows.days7.DBR, windows.days30.DBR);
        return res.json({
            generatedAt: new Date().toISOString(),
            windows,
            overall: { score, level: severityFor(score) },
            notes: {
                classification: "Resource sensitivity is read from the trusted resources catalogue where available.",
                volume: "Transfer bytes are included only when actually measured. Null means not captured; it is not equivalent to zero.",
                model: "DER, ER, and DBR are deterministic prototype indicators, not calibrated production probabilities."
            }
        });
    } catch (error) {
        if (error?.code === "42P01") {
            return res.status(503).json({ error: "Data telemetry migration 008 is required", code: "DATA_TELEMETRY_NOT_MIGRATED" });
        }
        console.error("Exposure query failed:", error);
        return res.status(500).json({ error: "Unable to calculate data exposure" });
    }
}
