import { query } from "../config/database.js";

const windows = {
  today: "24 hours",
  days7: "7 days",
  days30: "30 days",
};

const weights = {
  PUBLIC: 0.05,
  INTERNAL: 0.15,
  CONFIDENTIAL: 0.4,
  RESTRICTED: 0.7,
  CRITICAL: 1,
};

const actions = new Set([
  "DOWNLOAD",
  "EXPORT",
  "BULK_DOWNLOAD",
  "SHARE",
  "API_EXPORT",
  "COPY",
]);

export function calculateExposureRisk(rows = []) {
  const events = rows.map((r) => ({
    ...r,
    classification: String(r.classification || "INTERNAL").toUpperCase(),
    action: String(r.action || "VIEW").toUpperCase(),
    bytes_transferred:
      r.bytes_transferred === null || r.bytes_transferred === undefined || r.bytes_transferred === ""
        ? null
        : Number.isFinite(Number(r.bytes_transferred)) && Number(r.bytes_transferred) >= 0
          ? Number(r.bytes_transferred)
          : null,
  }));

  const weighted = events.reduce(
    (sum, e) => sum + (weights[e.classification] ?? weights.INTERNAL),
    0
  );

  const sensitive = events.filter(
    (e) => !["PUBLIC", "INTERNAL"].includes(e.classification)
  );
  const exports = events.filter((e) => actions.has(e.action));
  const measuredBytes = events.filter((e) => e.bytes_transferred !== null);
  const measuredSensitiveBytes = sensitive.filter((e) => e.bytes_transferred !== null);
  const bytesValue = measuredBytes.reduce((sum, e) => sum + e.bytes_transferred, 0);
  const sensitiveBytesValue = measuredSensitiveBytes.reduce((sum, e) => sum + e.bytes_transferred, 0);
  // Null means transfer volume has not been measured; it must not be presented as zero.
  const bytes = measuredBytes.length ? bytesValue : null;
  const sensitiveBytes = measuredSensitiveBytes.length ? sensitiveBytesValue : null;

  const departments = new Set(events.map((e) => e.department).filter(Boolean));
  const resources = new Set(events.map((e) => e.resource_id).filter(Boolean));
  const bulk = events.filter((e) => e.action === "BULK_DOWNLOAD").length;
  const exportCount = exports.length;

  const der = Math.min(
    100,
    Math.round(
      weighted * 4 +
        sensitive.length * 3 +
        Math.min(25, bytesValue / (1024 * 1024)) +
        Math.min(20, departments.size * 5)
    )
  );

  const er = Math.min(
    100,
    Math.round(
      exportCount * 8 +
        bulk * 18 +
        Math.min(30, sensitive.length * 2) +
        (sensitiveBytesValue > 0
          ? Math.min(25, sensitiveBytesValue / (1024 * 1024))
          : 0) +
        Math.min(15, Math.max(0, departments.size - 1) * 8)
    )
  );

  const dbr = Math.min(100, Math.round(der * 0.45 + er * 0.55));

  return {
    eventCount: events.length,
    sensitiveFiles: sensitive.length,
    criticalFiles: events.filter((e) => e.classification === "CRITICAL").length,
    downloads: events.filter((e) =>
      ["DOWNLOAD", "BULK_DOWNLOAD"].includes(e.action)
    ).length,
    exports: exportCount,
    totalBytes: bytes,
    sensitiveBytes,
    uniqueResources: resources.size,
    uniqueDepartments: departments.size,
    DER: der,
    ER: er,
    DBR: dbr,
    level:
      dbr >= 70
        ? "CRITICAL"
        : dbr >= 50
          ? "HIGH"
          : dbr >= 30
            ? "MEDIUM"
            : "LOW",
  };
}

export async function getExposure(req, res) {
  try {
    // This route is mounted behind the admin portal and audit:read permission.
    // Validate UUID input before it reaches PostgreSQL's ::uuid cast.
    const requestedUserId = req.query.userId;
    if (requestedUserId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(requestedUserId))) {
      return res.status(400).json({ error: "userId must be a valid UUID", code: "INVALID_USER_ID" });
    }
    const userId = requestedUserId || null;

    const results = await Promise.all(
      Object.entries(windows).map(async ([key, interval]) => {
        const result = await query(
          `SELECT dae.action, dae.classification, dae.bytes_transferred,
                  dae.department, dae.resource_id, dae.created_at
             FROM data_access_events dae
            WHERE dae.created_at >= NOW() - $1::interval
              AND ($2::uuid IS NULL OR dae.user_id = $2)
            ORDER BY dae.created_at DESC
            LIMIT 5000`,
          [interval, userId]
        );

        return [key, calculateExposureRisk(result.rows)];
      })
    );

    const data = Object.fromEntries(results);
    const score = Math.max(
      data.today.DBR,
      data.days7.DBR,
      data.days30.DBR
    );

    return res.json({
      windows: data,
      overall: {
        score,
        level:
          score >= 70
            ? "CRITICAL"
            : score >= 50
              ? "HIGH"
              : score >= 30
                ? "MEDIUM"
                : "LOW",
      },
      notes: {
        volume:
          "totalBytes and sensitiveBytes are null when transfer volume has not been measured; volume is never inferred from file size.",
        model:
          "DER/ER/DBR are deterministic prototype indicators, not a calibrated production model.",
      },
    });
  } catch (error) {
    if (error?.code === "42P01") {
      return res.status(503).json({
        error: "Data telemetry migration 008 is required",
        code: "DATA_TELEMETRY_NOT_MIGRATED",
      });
    }

    console.error("Exposure query failed", error);
    return res.status(500).json({
      error: "Unable to calculate data exposure",
    });
  }
}
