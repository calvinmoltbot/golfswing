CREATE TABLE IF NOT EXISTS swing_sessions (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  status text NOT NULL,
  notes text NOT NULL DEFAULT '',
  player_context jsonb,
  report_mode text NOT NULL DEFAULT 'concise',
  player_goal text NOT NULL DEFAULT '',
  usual_miss text NOT NULL DEFAULT '',
  shot_shape text NOT NULL DEFAULT '',
  skill_band text NOT NULL DEFAULT 'intermediate',
  pipeline jsonb NOT NULL,
  analysis jsonb,
  error text,
  file jsonb NOT NULL
);

CREATE INDEX IF NOT EXISTS swing_sessions_created_at_idx
  ON swing_sessions (created_at DESC);

CREATE INDEX IF NOT EXISTS swing_sessions_status_idx
  ON swing_sessions (status);
