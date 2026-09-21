CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE TABLE IF NOT EXISTS bronze.sync_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bronze.sync_config ENABLE ROW LEVEL SECURITY;
GRANT ALL ON bronze.sync_config TO service_role;

INSERT INTO bronze.sync_config (key, value)
VALUES ('sync_secret', encode(extensions.gen_random_bytes(32), 'hex'))
ON CONFLICT (key) DO NOTHING;