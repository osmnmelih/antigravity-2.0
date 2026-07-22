
-- Sessions
CREATE TABLE public.sessions (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  join_code   TEXT UNIQUE NOT NULL,
  status      TEXT NOT NULL DEFAULT 'active',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessions TO anon, authenticated;
GRANT ALL ON SEQUENCE public.sessions_id_seq TO anon, authenticated, service_role;
GRANT ALL ON public.sessions TO service_role;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read sessions"   ON public.sessions FOR SELECT USING (true);
CREATE POLICY "public insert sessions" ON public.sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "public update sessions" ON public.sessions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public delete sessions" ON public.sessions FOR DELETE USING (true);

-- Checkpoints
CREATE TABLE public.checkpoints (
  id          BIGSERIAL PRIMARY KEY,
  session_id  BIGINT NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  lat         DOUBLE PRECISION NOT NULL,
  lng         DOUBLE PRECISION NOT NULL,
  task_type   TEXT NOT NULL DEFAULT 'auto',
  difficulty  TEXT NOT NULL DEFAULT 'auto',
  order_num   INTEGER NOT NULL,
  label       TEXT
);
CREATE INDEX idx_checkpoints_session ON public.checkpoints(session_id, order_num);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.checkpoints TO anon, authenticated;
GRANT ALL ON SEQUENCE public.checkpoints_id_seq TO anon, authenticated, service_role;
GRANT ALL ON public.checkpoints TO service_role;
ALTER TABLE public.checkpoints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read checkpoints"   ON public.checkpoints FOR SELECT USING (true);
CREATE POLICY "public insert checkpoints" ON public.checkpoints FOR INSERT WITH CHECK (true);
CREATE POLICY "public update checkpoints" ON public.checkpoints FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public delete checkpoints" ON public.checkpoints FOR DELETE USING (true);

-- Teams
CREATE TABLE public.teams (
  id                  BIGSERIAL PRIMARY KEY,
  session_id          BIGINT NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  current_checkpoint  BIGINT,
  joined_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_teams_session ON public.teams(session_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO anon, authenticated;
GRANT ALL ON SEQUENCE public.teams_id_seq TO anon, authenticated, service_role;
GRANT ALL ON public.teams TO service_role;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read teams"   ON public.teams FOR SELECT USING (true);
CREATE POLICY "public insert teams" ON public.teams FOR INSERT WITH CHECK (true);
CREATE POLICY "public update teams" ON public.teams FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public delete teams" ON public.teams FOR DELETE USING (true);

-- Task completions
CREATE TABLE public.task_completions (
  id            BIGSERIAL PRIMARY KEY,
  team_id       BIGINT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  checkpoint_id BIGINT NOT NULL REFERENCES public.checkpoints(id) ON DELETE CASCADE,
  time_taken    INTEGER NOT NULL DEFAULT 0,
  hints_used    INTEGER NOT NULL DEFAULT 0,
  score         INTEGER NOT NULL DEFAULT 100,
  answer        TEXT,
  completed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, checkpoint_id)
);
CREATE INDEX idx_completions_team ON public.task_completions(team_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_completions TO anon, authenticated;
GRANT ALL ON SEQUENCE public.task_completions_id_seq TO anon, authenticated, service_role;
GRANT ALL ON public.task_completions TO service_role;
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read completions"   ON public.task_completions FOR SELECT USING (true);
CREATE POLICY "public insert completions" ON public.task_completions FOR INSERT WITH CHECK (true);
CREATE POLICY "public update completions" ON public.task_completions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public delete completions" ON public.task_completions FOR DELETE USING (true);

-- Task cache (per-team generated task JSON)
CREATE TABLE public.task_cache (
  id            BIGSERIAL PRIMARY KEY,
  checkpoint_id BIGINT NOT NULL REFERENCES public.checkpoints(id) ON DELETE CASCADE,
  team_id       BIGINT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  task_json     JSONB NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(checkpoint_id, team_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_cache TO anon, authenticated;
GRANT ALL ON SEQUENCE public.task_cache_id_seq TO anon, authenticated, service_role;
GRANT ALL ON public.task_cache TO service_role;
ALTER TABLE public.task_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read task_cache"   ON public.task_cache FOR SELECT USING (true);
CREATE POLICY "public insert task_cache" ON public.task_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "public update task_cache" ON public.task_cache FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public delete task_cache" ON public.task_cache FOR DELETE USING (true);

-- Seed demo session matching original SQLite seed
WITH s AS (
  INSERT INTO public.sessions (name, join_code, status)
  VALUES ('Spring Field Day Hunt', 'OMC01', 'active')
  RETURNING id
)
INSERT INTO public.checkpoints (session_id, lat, lng, task_type, difficulty, order_num, label)
SELECT s.id, v.lat, v.lng, v.task_type, v.difficulty, v.order_num, v.label
FROM s, (VALUES
  (49.25460216243028,  7.04048242414636,   'physical',  'easy',   1, 'Starting Line'),
  (49.254741508117874, 7.042547725066189,  'cognitive', 'medium', 2, 'Brain Teaser Station'),
  (49.25732386273906,  7.0428852731889755, 'social',    'easy',   3, 'Team Challenge Point'),
  (49.2554150857629,   7.041457937927682,  'creative',  'medium', 4, 'Creative Corner')
) AS v(lat, lng, task_type, difficulty, order_num, label);
