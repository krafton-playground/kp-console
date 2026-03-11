CREATE TABLE user_roles (
  email TEXT PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'user',
  assigned_by TEXT,
  assigned_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT,
  description TEXT,
  template TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  github_repo TEXT,
  vercel_project_id TEXT,
  supabase_project_id TEXT,
  iam_role_name TEXT,
  secret_id TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  triggered_by_email TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  vercel_deployment_id TEXT,
  commit_sha TEXT,
  branch TEXT,
  deploy_url TEXT,
  log_url TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ,
  error_message TEXT
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  source TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 정책
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_all ON projects FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE email = auth.jwt()->>'email' AND role = 'admin')
);
CREATE POLICY user_own ON projects FOR ALL USING (owner_email = auth.jwt()->>'email');

ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_all_deployments ON deployments FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE email = auth.jwt()->>'email' AND role = 'admin')
);
CREATE POLICY user_own_deployments ON deployments FOR SELECT USING (
  project_id IN (SELECT id FROM projects WHERE owner_email = auth.jwt()->>'email')
);
