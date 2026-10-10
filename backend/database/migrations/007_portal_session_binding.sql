BEGIN;

-- Bind each authenticated session to exactly one application portal.
-- Existing sessions are assigned to the employee portal and must re-authenticate
-- to receive a token with the matching portal claim.
ALTER TABLE sessions
    ADD COLUMN IF NOT EXISTS portal VARCHAR(20) NOT NULL DEFAULT 'employee';

DO $$
BEGIN
    ALTER TABLE sessions
        ADD CONSTRAINT chk_sessions_portal
        CHECK (portal IN ('employee', 'admin'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_sessions_portal_status
    ON sessions(portal, status);

COMMIT;
