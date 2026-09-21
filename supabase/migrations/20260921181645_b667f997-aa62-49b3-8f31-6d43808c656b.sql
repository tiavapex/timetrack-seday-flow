CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE SCHEMA IF NOT EXISTS bronze;

CREATE TABLE IF NOT EXISTS bronze.ingest_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT 'vps_fponto',
  entity text NOT NULL DEFAULT 'colaboradores',
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running','success','error','partial')),
  rows_fetched integer NOT NULL DEFAULT 0,
  rows_new integer NOT NULL DEFAULT 0,
  rows_changed integer NOT NULL DEFAULT 0,
  extracted_at timestamptz,
  error_message text,
  triggered_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ingest_batches_status ON bronze.ingest_batches (status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingest_batches_entity ON bronze.ingest_batches (entity, started_at DESC);

CREATE TABLE IF NOT EXISTS bronze.colaboradores_raw (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES bronze.ingest_batches(id) ON DELETE RESTRICT,
  origem_id text,
  payload jsonb NOT NULL,
  row_hash text NOT NULL,
  extracted_at timestamptz,
  ingested_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION bronze.fn_set_row_hash()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = bronze, extensions, public
AS $$
BEGIN
  NEW.row_hash := encode(extensions.digest(NEW.payload::text, 'sha256'), 'hex');
  IF NEW.origem_id IS NULL THEN
    NEW.origem_id := NEW.payload->>'origem_id';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_colaboradores_raw_hash ON bronze.colaboradores_raw;
CREATE TRIGGER trg_colaboradores_raw_hash
BEFORE INSERT ON bronze.colaboradores_raw
FOR EACH ROW EXECUTE FUNCTION bronze.fn_set_row_hash();

CREATE OR REPLACE FUNCTION bronze.fn_append_only()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = bronze
AS $$
BEGIN
  RAISE EXCEPTION 'bronze.colaboradores_raw e append-only: % nao permitido', TG_OP;
END;
$$;

DROP TRIGGER IF EXISTS trg_colaboradores_raw_append_only ON bronze.colaboradores_raw;
CREATE TRIGGER trg_colaboradores_raw_append_only
BEFORE UPDATE OR DELETE ON bronze.colaboradores_raw
FOR EACH ROW EXECUTE FUNCTION bronze.fn_append_only();

CREATE INDEX IF NOT EXISTS idx_colab_raw_origem ON bronze.colaboradores_raw (origem_id, ingested_at DESC);
CREATE INDEX IF NOT EXISTS idx_colab_raw_batch ON bronze.colaboradores_raw (batch_id);
CREATE INDEX IF NOT EXISTS idx_colab_raw_hash ON bronze.colaboradores_raw (row_hash);

CREATE OR REPLACE FUNCTION bronze.fn_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = bronze
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ingest_batches_updated ON bronze.ingest_batches;
CREATE TRIGGER trg_ingest_batches_updated
BEFORE UPDATE ON bronze.ingest_batches
FOR EACH ROW EXECUTE FUNCTION bronze.fn_touch_updated_at();

ALTER TABLE bronze.ingest_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE bronze.colaboradores_raw ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON SCHEMA bronze FROM anon, authenticated;
GRANT USAGE ON SCHEMA bronze TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA bronze TO service_role;