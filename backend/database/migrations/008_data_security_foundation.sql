BEGIN;

ALTER TABLE resources DROP CONSTRAINT IF EXISTS chk_resource_sensitivity;
ALTER TABLE resources ADD CONSTRAINT chk_resource_sensitivity
    CHECK (sensitivity IN ('PUBLIC','INTERNAL','CONFIDENTIAL','RESTRICTED','CRITICAL'));

CREATE TABLE IF NOT EXISTS data_access_events (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    resource_id UUID REFERENCES resources(id) ON DELETE SET NULL,
    action VARCHAR(32) NOT NULL CHECK (
        action IN ('VIEW','DOWNLOAD','EXPORT','BULK_DOWNLOAD','SHARE','API_EXPORT','COPY')
    ),
    classification VARCHAR(16) NOT NULL CHECK (
        classification IN ('PUBLIC','INTERNAL','CONFIDENTIAL','RESTRICTED','CRITICAL')
    ),
    bytes_transferred BIGINT CHECK (bytes_transferred IS NULL OR bytes_transferred >= 0),
    department VARCHAR(128),
    destination TEXT,
    source_ip INET,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_access_user_time
    ON data_access_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_access_resource_time
    ON data_access_events (resource_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_access_classification_time
    ON data_access_events (classification, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_access_action_time
    ON data_access_events (action, created_at DESC);

COMMIT;
