BEGIN;

CREATE TABLE IF NOT EXISTS account_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (
        role IN ('employee','manager','security_analyst','security_manager','system_admin')
    ),
    token_hash CHAR(64) NOT NULL UNIQUE,
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_account_invitations_email
    ON account_invitations (lower(email));
CREATE INDEX IF NOT EXISTS idx_account_invitations_expiry
    ON account_invitations (expires_at)
    WHERE accepted_at IS NULL;

COMMIT;
