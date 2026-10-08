import { createBackup } from "../services/backup/backup.service.js";
try {
    const result = await createBackup();
    console.log(JSON.stringify({ status:"ok", snapshot:result.snapshot, files:result.manifest.tables.length }, null, 2));
} catch (error) {
    console.error("Backup failed:", error.message);
    process.exitCode = 1;
}
