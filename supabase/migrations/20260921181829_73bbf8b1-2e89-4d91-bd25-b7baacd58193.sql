CREATE SCHEMA IF NOT EXISTS gold;

CREATE TABLE IF NOT EXISTS gold.dim_colaborador (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origem_id text NOT NULL UNIQUE,
  matricula text,
  nome text NOT NULL,
  email text,
  cargo text,
  setor text,
  data_admissao date,
  data_demissao date,
  ativo boolean NOT NULL DEFAULT true,
  cpf_hash text,
  gestor_id uuid REFERENCES gold.dim_colaborador(id) ON DELETE SET NULL,
  user_id uuid,
  sincronizado_em timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gold_colab_gestor ON gold.dim_colaborador (gestor_id);
CREATE INDEX IF NOT EXISTS idx_gold_colab_user ON gold.dim_colaborador (user_id);
CREATE INDEX IF NOT EXISTS idx_gold_colab_ativo ON gold.dim_colaborador (ativo);
CREATE UNIQUE INDEX IF NOT EXISTS uq_gold_colab_user ON gold.dim_colaborador (user_id) WHERE user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION gold.fn_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = gold AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_gold_colab_updated ON gold.dim_colaborador;
CREATE TRIGGER trg_gold_colab_updated
BEFORE UPDATE ON gold.dim_colaborador
FOR EACH ROW EXECUTE FUNCTION gold.fn_touch_updated_at();

-- usuarios do app so podem mexer em gestor_id / user_id
CREATE OR REPLACE FUNCTION gold.fn_guard_columns()
RETURNS trigger LANGUAGE plpgsql SET search_path = gold, public AS $$
BEGIN
  IF current_setting('role', true) = 'service_role' OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.origem_id IS DISTINCT FROM OLD.origem_id
     OR NEW.matricula IS DISTINCT FROM OLD.matricula
     OR NEW.nome IS DISTINCT FROM OLD.nome
     OR NEW.email IS DISTINCT FROM OLD.email
     OR NEW.cargo IS DISTINCT FROM OLD.cargo
     OR NEW.setor IS DISTINCT FROM OLD.setor
     OR NEW.data_admissao IS DISTINCT FROM OLD.data_admissao
     OR NEW.data_demissao IS DISTINCT FROM OLD.data_demissao
     OR NEW.ativo IS DISTINCT FROM OLD.ativo
     OR NEW.cpf_hash IS DISTINCT FROM OLD.cpf_hash THEN
    RAISE EXCEPTION 'Apenas gestor_id e user_id podem ser alterados pelo aplicativo';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_gold_colab_guard ON gold.dim_colaborador;
CREATE TRIGGER trg_gold_colab_guard
BEFORE UPDATE ON gold.dim_colaborador
FOR EACH ROW EXECUTE FUNCTION gold.fn_guard_columns();

CREATE OR REPLACE FUNCTION gold.fn_promote()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = gold, silver, public
AS $$
DECLARE v_upserts integer := 0;
BEGIN
  INSERT INTO gold.dim_colaborador AS d (
    origem_id, matricula, nome, email, cargo, setor,
    data_admissao, data_demissao, ativo, cpf_hash, sincronizado_em
  )
  SELECT s.origem_id, s.matricula, s.nome, s.email, s.cargo, s.setor,
         s.data_admissao, s.data_demissao, s.ativo, s.cpf_hash, now()
  FROM silver.colaboradores s
  WHERE s.is_current
  ON CONFLICT (origem_id) DO UPDATE SET
    matricula = EXCLUDED.matricula,
    nome = EXCLUDED.nome,
    email = EXCLUDED.email,
    cargo = EXCLUDED.cargo,
    setor = EXCLUDED.setor,
    data_admissao = EXCLUDED.data_admissao,
    data_demissao = EXCLUDED.data_demissao,
    ativo = EXCLUDED.ativo,
    cpf_hash = EXCLUDED.cpf_hash,
    sincronizado_em = now();
    -- gestor_id e user_id NUNCA sao sobrescritos
  GET DIAGNOSTICS v_upserts = ROW_COUNT;
  RETURN jsonb_build_object('upserts', v_upserts);
END; $$;

CREATE OR REPLACE FUNCTION gold.fn_run_pipeline(p_batch uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = gold, silver, bronze, public
AS $$
DECLARE v_silver jsonb; v_gold jsonb; v_fetched integer;
BEGIN
  v_silver := silver.fn_promote(p_batch);
  v_gold := gold.fn_promote();

  SELECT count(*) INTO v_fetched FROM bronze.colaboradores_raw WHERE batch_id = p_batch;

  UPDATE bronze.ingest_batches
  SET status = CASE WHEN (v_silver->>'rejeitados')::int > 0 THEN 'partial' ELSE 'success' END,
      finished_at = now(),
      rows_fetched = v_fetched,
      rows_new = (v_silver->>'novos')::int,
      rows_changed = (v_silver->>'alterados')::int
  WHERE id = p_batch;

  RETURN jsonb_build_object(
    'batch_id', p_batch,
    'rows_fetched', v_fetched,
    'novos', (v_silver->>'novos')::int,
    'alterados', (v_silver->>'alterados')::int,
    'rejeitados', (v_silver->>'rejeitados')::int,
    'gold_upserts', (v_gold->>'upserts')::int
  );
END; $$;

ALTER TABLE gold.dim_colaborador ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA gold TO authenticated, service_role;
GRANT SELECT ON gold.dim_colaborador TO authenticated;
GRANT UPDATE (gestor_id, user_id) ON gold.dim_colaborador TO authenticated;
GRANT ALL ON gold.dim_colaborador TO service_role;

DROP POLICY IF EXISTS gold_colab_select_gestao ON gold.dim_colaborador;
CREATE POLICY gold_colab_select_gestao ON gold.dim_colaborador
FOR SELECT TO authenticated
USING (
  public.is_admin_or_higher(auth.uid())
  OR public.ppo_is_rh(auth.uid())
  OR public.is_gestor_or_higher(auth.uid())
  OR user_id = auth.uid()
  OR gestor_id IN (SELECT g.id FROM gold.dim_colaborador g WHERE g.user_id = auth.uid())
);

DROP POLICY IF EXISTS gold_colab_update_rh ON gold.dim_colaborador;
CREATE POLICY gold_colab_update_rh ON gold.dim_colaborador
FOR UPDATE TO authenticated
USING (public.is_admin_or_higher(auth.uid()) OR public.ppo_is_rh(auth.uid()))
WITH CHECK (public.is_admin_or_higher(auth.uid()) OR public.ppo_is_rh(auth.uid()));

-- contrato exposto ao app (schema public), respeitando a RLS de quem consulta
CREATE OR REPLACE VIEW public.gold_colaboradores AS
SELECT id, origem_id, matricula, nome, email, cargo, setor,
       data_admissao, data_demissao, ativo, gestor_id, user_id, sincronizado_em
FROM gold.dim_colaborador;
ALTER VIEW public.gold_colaboradores SET (security_invoker = true);

CREATE OR REPLACE VIEW public.vw_colaboradores_ativos AS
SELECT id, origem_id, matricula, nome, email, cargo, setor,
       data_admissao, gestor_id, user_id, sincronizado_em
FROM gold.dim_colaborador
WHERE ativo AND data_demissao IS NULL;
ALTER VIEW public.vw_colaboradores_ativos SET (security_invoker = true);

CREATE OR REPLACE VIEW public.vw_minha_equipe AS
SELECT c.id, c.origem_id, c.matricula, c.nome, c.email, c.cargo, c.setor,
       c.data_admissao, c.ativo, c.gestor_id, c.user_id
FROM gold.dim_colaborador c
WHERE c.gestor_id IN (SELECT g.id FROM gold.dim_colaborador g WHERE g.user_id = auth.uid());
ALTER VIEW public.vw_minha_equipe SET (security_invoker = true);

CREATE OR REPLACE VIEW public.vw_sync_status AS
SELECT b.id, b.source, b.entity, b.started_at, b.finished_at, b.status,
       b.rows_fetched, b.rows_new, b.rows_changed, b.extracted_at,
       b.error_message, b.triggered_by,
       (SELECT count(*) FROM silver.rejeitados r WHERE r.batch_id = b.id) AS rejeitados
FROM bronze.ingest_batches b
WHERE public.is_admin_or_higher(auth.uid()) OR public.ppo_is_rh(auth.uid());
ALTER VIEW public.vw_sync_status SET (security_invoker = false);

GRANT SELECT ON public.gold_colaboradores TO authenticated;
GRANT UPDATE (gestor_id, user_id) ON public.gold_colaboradores TO authenticated;
GRANT SELECT ON public.vw_colaboradores_ativos TO authenticated;
GRANT SELECT ON public.vw_minha_equipe TO authenticated;
GRANT SELECT ON public.vw_sync_status TO authenticated;
GRANT SELECT ON public.gold_colaboradores, public.vw_colaboradores_ativos, public.vw_minha_equipe, public.vw_sync_status TO service_role;

REVOKE ALL ON FUNCTION gold.fn_promote() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION gold.fn_run_pipeline(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION gold.fn_promote() TO service_role;
GRANT EXECUTE ON FUNCTION gold.fn_run_pipeline(uuid) TO service_role;