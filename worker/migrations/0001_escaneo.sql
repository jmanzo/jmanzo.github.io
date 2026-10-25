-- One row per completed Escaneo. Opened at /es/operar-a-mano/?r=<id>.
-- No contact data here: the unlock sends that to Klaviyo.
CREATE TABLE results (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,          -- ms since epoch
  session TEXT,                         -- ties the result to its funnel events
  channel TEXT,                         -- wa | li | em, from ?c=
  answers TEXT NOT NULL,                -- JSON, as parseAnswers returns it
  orders TEXT NOT NULL,                 -- copied out of answers to segment by
  payments TEXT NOT NULL,               -- comma separated, same reason
  platform TEXT NOT NULL,               -- shopify | other | none
  reachable INTEGER NOT NULL,           -- 1 when the Worker could read the store
  route TEXT NOT NULL,                  -- comprobacion | espera | email
  hours_per_month INTEGER NOT NULL,
  money_per_month INTEGER,
  findings TEXT NOT NULL                -- JSON array, worst first
);

-- One row per funnel step. type: view, answer (step says which), completed, click.
CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at INTEGER NOT NULL,
  session TEXT,
  type TEXT NOT NULL,
  step TEXT,
  channel TEXT,
  result_id TEXT
);
CREATE INDEX events_session ON events (session);
CREATE INDEX events_at ON events (at);
