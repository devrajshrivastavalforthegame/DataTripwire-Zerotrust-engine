-- Preserve the behavior-only risk trajectory separately from fused risk.
-- Existing rows are initialized from their current risk_score for compatibility.
ALTER TABLE risk_decisions
    ADD COLUMN IF NOT EXISTS behavior_score INTEGER
    CHECK (behavior_score BETWEEN 0 AND 100);

UPDATE risk_decisions
SET behavior_score = risk_score
WHERE behavior_score IS NULL;

ALTER TABLE risk_decisions
    ALTER COLUMN behavior_score SET DEFAULT 0;

ALTER TABLE risk_decisions
    ALTER COLUMN behavior_score SET NOT NULL;
