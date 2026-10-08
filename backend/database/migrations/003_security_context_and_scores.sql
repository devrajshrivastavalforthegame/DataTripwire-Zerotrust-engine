-- DataTripwire remaining backend patch: business context, dual scoring, deception and AI evidence.
ALTER TABLE behavior_events ADD COLUMN IF NOT EXISTS responsibility VARCHAR(150);
ALTER TABLE behavior_events ADD COLUMN IF NOT EXISTS task VARCHAR(200);
ALTER TABLE behavior_events ADD COLUMN IF NOT EXISTS scope VARCHAR(200);
ALTER TABLE behavior_events ADD COLUMN IF NOT EXISTS sts_score INTEGER CHECK (sts_score BETWEEN 0 AND 100);
ALTER TABLE behavior_events ADD COLUMN IF NOT EXISTS ats_score INTEGER CHECK (ats_score BETWEEN 0 AND 100);
ALTER TABLE behavior_events ADD COLUMN IF NOT EXISTS is_decoy BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE risk_decisions ADD COLUMN IF NOT EXISTS previous_score INTEGER NOT NULL DEFAULT 0 CHECK (previous_score BETWEEN 0 AND 100);
ALTER TABLE risk_decisions ADD COLUMN IF NOT EXISTS sts_score INTEGER CHECK (sts_score BETWEEN 0 AND 100);
ALTER TABLE risk_decisions ADD COLUMN IF NOT EXISTS ats_score INTEGER CHECK (ats_score BETWEEN 0 AND 100);
ALTER TABLE risk_decisions ADD COLUMN IF NOT EXISTS explanation TEXT;
ALTER TABLE risk_decisions ADD COLUMN IF NOT EXISTS policy_id VARCHAR(100);
ALTER TABLE risk_decisions ADD COLUMN IF NOT EXISTS risk_factors JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE user_baselines ADD COLUMN IF NOT EXISTS usual_login_hour_start INTEGER;
ALTER TABLE user_baselines ADD COLUMN IF NOT EXISTS usual_login_hour_end INTEGER;
ALTER TABLE user_baselines ADD COLUMN IF NOT EXISTS avg_requests_per_minute NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE user_baselines ADD COLUMN IF NOT EXISTS avg_resources_per_session NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE user_baselines ADD COLUMN IF NOT EXISTS known_devices JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE user_baselines ADD COLUMN IF NOT EXISTS known_locations JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE user_baselines ADD COLUMN IF NOT EXISTS common_resource_types JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_behavior_events_decoy ON behavior_events(is_decoy) WHERE is_decoy = TRUE;
CREATE INDEX IF NOT EXISTS idx_behavior_events_context ON behavior_events(user_id, responsibility, task, scope);
CREATE INDEX IF NOT EXISTS idx_risk_decisions_scores ON risk_decisions(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity, created_at DESC);
