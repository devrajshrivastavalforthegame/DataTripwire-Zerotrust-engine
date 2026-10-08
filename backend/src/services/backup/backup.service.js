import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { query } from "../../config/database.js";

const root = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../..",
    "backups"
);

const TABLES = [
    "users",
    "sessions",
    "behavior_events",
    "user_baselines",
    "risk_decisions",
    "audit_logs"
];

async function writeJson(file, data) {
    const content = JSON.stringify(data, null, 2);

    await fs.writeFile(file, content, "utf8");

    const hash = crypto
        .createHash("sha256")
        .update(content)
        .digest("hex");

    return {
        file: path.relative(root, file).replaceAll("\\", "/"),
        sha256: hash
    };
}

export async function createBackup() {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");

    const latest = path.join(root, "latest");
    const snapshot = path.join(root, "snapshots", stamp);
    const events = path.join(root, "security-events");

    // IMPORTANT:
    // Never remove and recreate the same directory concurrently.
    await fs.rm(latest, { recursive: true, force: true });

    await fs.mkdir(snapshot, { recursive: true });
    await fs.mkdir(latest, { recursive: true });
    await fs.mkdir(events, { recursive: true });

    const manifest = {
        created_at: new Date().toISOString(),
        tables: [],
        excluded: [
            ".env",
            "JWT secrets",
            "password_hash"
        ],
        algorithm: "sha256"
    };

    for (const table of TABLES) {
        const columns =
            table === "users"
                ? "id,username,email,role,status,created_at,updated_at"
                : "*";

        const result = await query(
            `SELECT ${columns} FROM ${table} ORDER BY 1`
        );

        const name = `${table}.json`;

        const snapshotFile = path.join(snapshot, name);
        const latestFile = path.join(latest, name);

        const entry = await writeJson(
            snapshotFile,
            result.rows
        );

        manifest.tables.push(entry);

        // Snapshot file has definitely finished writing before copying.
        await fs.copyFile(snapshotFile, latestFile);
    }

    const manifestContent = JSON.stringify(
        manifest,
        null,
        2
    );

    await fs.writeFile(
        path.join(snapshot, "manifest.json"),
        manifestContent,
        "utf8"
    );

    await fs.writeFile(
        path.join(latest, "manifest.json"),
        manifestContent,
        "utf8"
    );

    return {
        snapshot,
        latest,
        manifest
    };
}
