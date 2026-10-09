# Applying database migrations safely

The Docker entrypoint directory `/docker-entrypoint-initdb.d` is processed only when PostgreSQL initializes a new data directory. Adding a migration file does **not** automatically apply it to an already-running DataTripwire database.

## Migration 008: data-access telemetry

Before applying migration 008 to an existing database:

1. Take a verified backup of the target database and confirm the restore procedure.
2. Check that the target database is the intended environment; do not point this command at a production database during local testing.
3. Review existing `resources.sensitivity` values. Migration 008 intentionally aborts before changing the constraint if any rows contain NULL or a value outside `PUBLIC`, `INTERNAL`, `CONFIDENTIAL`, `RESTRICTED`, or `CRITICAL`. Remediate such rows explicitly and retry only after reviewing the data.
4. Apply only the new migration file, not the entire historical migration directory.

From PowerShell at the repository root, after loading the correct `.env` and confirming `DATABASE_URL`:

```powershell
psql "$env:DATABASE_URL" -v ON_ERROR_STOP=1 -f .\backend\database\migrations\008_data_security_foundation.sql
```

If using the PostgreSQL container, connect to the intended database/container explicitly and verify its database name before executing the SQL. Never remove or recreate a database volume to apply a migration.

The migration extends the resource sensitivity constraint to include `CRITICAL` and creates the `data_access_events` telemetry table and indexes. Transfer volume remains unknown until the application records an actual measurement; it must not be inferred from resource size or request count.
