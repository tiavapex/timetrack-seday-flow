CREATE SCHEMA IF NOT EXISTS silver;

CREATE TABLE IF NOT EXISTS silver.colaboradores (
  sk uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origem_id text NOT NULL,
  matricula text,
  nome text NOT NULL,
  email text,
  cargo text,
  setor text,
  data_admissao date,
  data_demissao date,
  ativo boolean NOT NULL DEFAULT true,
  cpf_hash text,
  atualizado_em timestamptz,
  row_hash text NOT NULL,
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_to timestamptz,
  is_current boolean NOT NULL DEFAULT true,
  batch_id uuid REFERENCES bronze.ingest_batches(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_silver_colab_current ON silver.colaboradores (origem_id) WHERE is_current;
CREATE INDEX IF NOT EXISTS idx_silver_colab_origem ON silver.colaboradores (origem_id, valid_from DESC);
CREATE INDEX IF NOT EXISTS idx_silver_colab_batch ON silver.colaboradores (batch_id);

CREATE TABLE IF NOT EXISTS silver.rejeitados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid REFERENCES bronze.ingest_batches(id) ON DELETE CASCADE,
  origem_id text,
  motivo text NOT NULL,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_silver_rejeitados_batch ON silver.rejeitados (batch_id);

CREATE OR REPLACE FUNCTION silver.fn_promote(p_batch uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = silver, bronze, public
AS $$
DECLARE
  v_novos integer := 0;
  v_alterados integer := 0;
  v_rejeitados integer := 0;
  r record;
  v_cur record;
BEGIN
  -- rejeitos: sem origem_id ou sem nome
  INSERT INTO silver.rejeitados (batch_id, origem_id, motivo, payload)
  SELECT p_batch, raw.origem_id,
         CASE WHEN COALESCE(raw.origem_id, raw.payload->>'origem_id') IS NULL
              THEN 'origem_id ausente' ELSE 'nome ausente' END,
         raw.payload
  FROM bronze.colaboradores_raw raw
  WHERE raw.batch_id = p_batch
    AND (COALESCE(raw.origem_id, raw.payload->>'origem_id') IS NULL
         OR NULLIF(btrim(COALESCE(raw.payload->>'nome','')), '') IS NULL);
  v_rejeitados := ROW_COUNT_HACK_PLACEHOLDER();
  RETURN NULL;
END;
$$;

-- versao final da funcao (substitui o esqueleto acima)
CREATE OR REPLACE FUNCTION silver.fn_promote(p_batch uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = silver, bronze, public
AS $$
DECLARE
  v_novos integer := 0;
  v_alterados integer := 0;
  v_rejeitados integer := 0;
  v_tmp integer := 0;
  r record;
  v_cur record;
BEGIN
  INSERT INTO silver.rejeitados (batch_id, origem_id, motivo, payload)
  SELECT p_batch,
         COALESCE(raw.origem_id, raw.payload->>'origem_id'),
         CASE WHEN COALESCE(raw.origem_id, raw.payload->>'origem_id') IS NULL
              THEN 'origem_id ausente' ELSE 'nome ausente' END,
         raw.payload
  FROM bronze.colaboradores_raw raw
  WHERE raw.batch_id = p_batch
    AND (COALESCE(raw.origem_id, raw.payload->>'origem_id') IS NULL
         OR NULLIF(btrim(COALESCE(raw.payload->>'nome','')), '') IS NULL)
    AND NOT EXISTS (
      SELECT 1 FROM silver.rejeitados rj
      WHERE rj.batch_id = p_batch
        AND rj.payload = raw.payload
    );
  GET DIAGNOSTICS v_tmp = ROW_COUNT;
  v_rejeitados := v_tmp;

  FOR r IN
    SELECT DISTINCT ON (COALESCE(raw.origem_id, raw.payload->>'origem_id'))
      COALESCE(raw.origem_id, raw.payload->>'origem_id') AS origem_id,
      raw.payload,
      raw.row_hash,
      raw.extracted_at
    FROM bronze.colaboradores_raw raw
    WHERE raw.batch_id = p_batch
      AND COALESCE(raw.origem_id, raw.payload->>'origem_id') IS NOT NULL
      AND NULLIF(btrim(COALESCE(raw.payload->>'nome','')), '') IS NOT NULL
    ORDER BY COALESCE(raw.origem_id, raw.payload->>'origem_id'), raw.ingested_at DESC
  LOOP
    SELECT * INTO v_cur FROM silver.colaboradores c
    WHERE c.origem_id = r.origem_id AND c.is_current;

    IF v_cur.sk IS NOT NULL AND v_cur.row_hash = r.row_hash THEN
      CONTINUE;
    END IF;

    IF v_cur.sk IS NOT NULL THEN
      UPDATE silver.colaboradores
      SET is_current = false, valid_to = now(), updated_at = now()
      WHERE sk = v_cur.sk;
      v_alterados := v_alterados + 1;
    ELSE
      v_novos := v_novos + 1;
    END IF;

    INSERT INTO silver.colaboradores (
      origem_id, matricula, nome, email, cargo, setor,
      data_admissao, data_demissao, ativo, cpf_hash, atualizado_em,
      row_hash, valid_from, is_current, batch_id
    ) VALUES (
      r.origem_id,
      NULLIF(btrim(COALESCE(r.payload->>'matricula','')), ''),
      btrim(r.payload->>'nome'),
      NULLIF(btrim(lower(COALESCE(r.payload->>'email',''))), ''),
      NULLIF(btrim(COALESCE(r.payload->>'cargo','')), ''),
      NULLIF(btrim(COALESCE(r.payload->>'setor','')), ''),
      NULLIF(r.payload->>'data_admissao','')::date,
      NULLIF(r.payload->>'data_demissao','')::date,
      COALESCE((r.payload->>'ativo')::boolean, true),
      NULLIF(btrim(COALESCE(r.payload->>'cpf_hash','')), ''),
      NULLIF(r.payload->>'atualizado_em','')::timestamptz,
      r.row_hash, now(), true, p_batch
    );
  END LOOP;

  RETURN jsonb_build_object('novos', v_novos, 'alterados', v_alterados, 'rejeitados', v_rejeitados);
END;
$$;

ALTER TABLE silver.colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE silver.rejeitados ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON SCHEMA silver FROM anon, authenticated;
GRANT USAGE ON SCHEMA silver TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA silver TO service_role;
REVOKE ALL ON FUNCTION silver.fn_promote(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION silver.fn_promote(uuid) TO service_role;