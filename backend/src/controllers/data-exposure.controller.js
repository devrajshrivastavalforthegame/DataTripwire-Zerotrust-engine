import {
    getDataExposureReport,
    parseExposureWindow
} from "../services/risk/data-exposure.service.js";

export async function getDataExposure(req, res) {
    const windowConfig = parseExposureWindow(req.query.window ?? "7d");
    if (!windowConfig) {
        return res.status(400).json({
            error: "Invalid window",
            allowedValues: ["24h", "7d", "30d"]
        });
    }

    const rawLimit = req.query.limit ?? "50";
    const limit = Number(rawLimit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        return res.status(400).json({
            error: "limit must be an integer between 1 and 100"
        });
    }

    try {
        const report = await getDataExposureReport({
            windowHours: windowConfig.hours,
            limit
        });
        return res.json(report);
    } catch (error) {
        console.error("Data exposure report error:", error);
        return res.status(500).json({
            error: "Unable to load data exposure report"
        });
    }
}
