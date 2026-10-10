BEGIN;

CREATE TABLE IF NOT EXISTS workspace_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(220) NOT NULL,
  project VARCHAR(160) NOT NULL DEFAULT 'General',
  status VARCHAR(30) NOT NULL DEFAULT 'todo',
  priority VARCHAR(20) NOT NULL DEFAULT 'Medium',
  due_date TIMESTAMPTZ,
  progress INTEGER NOT NULL DEFAULT 0 CHECK(progress BETWEEN 0 AND 100),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspace_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(220) NOT NULL,
  description TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'Planning',
  progress INTEGER NOT NULL DEFAULT 0 CHECK(progress BETWEEN 0 AND 100),
  due_date DATE,
  team_size INTEGER NOT NULL DEFAULT 1,
  project_type VARCHAR(80) NOT NULL DEFAULT 'General',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspace_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspace_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(220) NOT NULL,
  department VARCHAR(100),
  amount VARCHAR(100),
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS workspace_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(220) NOT NULL,
  event_type VARCHAR(50) NOT NULL DEFAULT 'Meeting',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspace_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  settings JSONB NOT NULL DEFAULT '{"notifications":true,"mentions":true,"project_updates":true,"weekly_summary":false}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspace_tasks_user ON workspace_tasks(user_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_workspace_projects_user ON workspace_projects(user_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_workspace_messages_users ON workspace_messages(sender_id,recipient_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workspace_events_user ON workspace_events(user_id,starts_at);
CREATE INDEX IF NOT EXISTS idx_workspace_approvals_reviewer ON workspace_approvals(reviewer_id,status);

COMMIT;