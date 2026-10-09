BEGIN;

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS portal VARCHAR(20);
UPDATE sessions SET portal = 'employee' WHERE portal IS NULL;
ALTER TABLE sessions ALTER COLUMN portal SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'sessions_portal_check'
          AND conrelid = 'sessions'::regclass
    ) THEN
        ALTER TABLE sessions ADD CONSTRAINT sessions_portal_check
            CHECK (portal IN ('employee', 'admin'));
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_sessions_user_portal_status
    ON sessions (user_id, portal, status);

COMMIT;
