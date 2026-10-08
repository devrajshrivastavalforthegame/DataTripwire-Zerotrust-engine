CREATE INDEX IF NOT EXISTS idx_behavior_events_event_type ON behavior_events(event_type);
CREATE INDEX IF NOT EXISTS idx_risk_decisions_created_at ON risk_decisions(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON sessions(last_activity_at);
