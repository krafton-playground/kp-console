-- Add features JSONB column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}'::jsonb;

-- Backfill seed projects with template-derived features
UPDATE projects SET features = '{"hosting": "vercel", "sso": false, "database": null, "custom_domain": null}'::jsonb
  WHERE name = 'test-alpha';

UPDATE projects SET features = '{"hosting": "vercel", "sso": false, "database": "supabase", "custom_domain": "console.krafton.run"}'::jsonb
  WHERE name = 'kp-console';

UPDATE projects SET features = '{"hosting": "vercel", "sso": false, "database": "supabase", "custom_domain": null}'::jsonb
  WHERE name = 'todo-app';

UPDATE projects SET features = '{"hosting": "vercel", "sso": true, "database": "supabase", "custom_domain": null}'::jsonb
  WHERE name = 'chatbot-demo';

UPDATE projects SET features = '{"hosting": "vercel", "sso": true, "database": "supabase", "custom_domain": "analytics.krafton.run"}'::jsonb
  WHERE name = 'dashboard-v2';
