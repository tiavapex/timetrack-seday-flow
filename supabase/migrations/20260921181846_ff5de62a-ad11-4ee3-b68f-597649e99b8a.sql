DROP VIEW IF EXISTS public.vw_sync_status;

CREATE OR REPLACE FUNCTION public.fn_sync_status(p_limit integer DEFAULT 50)
RETURNS TABLE (
  id uuid,
  source text,
  entity text,
  started_at timestamptz,
  finished_at timestamptz,
  status text,
  rows_fetched integer,
  rows_new integer,
  rows_changed integer,
  extracted_at timestamptz,
  error_message text,
  triggered_by text,
  rejeitados bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, bronze, silver
AS $$
BEGIN
  IF NOT (public.is_admin_or_higher(auth.uid()) OR public.ppo_is_rh(auth.uid())) THEN
    RAISE EXCEPTION 'Acesso restrito a administradores e RH';
  END IF;

  RETURN QUERY
  SELECT b.id, b.source, b.entity, b.started_at, b.finished_at, b.status,
         b.rows_fetched, b.rows_new, b.rows_changed, b.extracted_at,
         b.error_message, b.triggered_by,
         (SELECT count(*) FROM silver.rejeitados r WHERE r.batch_id = b.id) AS rejeitados
  FROM bronze.ingest_batches b
  ORDER BY b.started_at DESC
  LIMIT COALESCE(p_limit, 50);
END; $$;

REVOKE ALL ON FUNCTION public.fn_sync_status(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_sync_status(integer) TO authenticated, service_role;