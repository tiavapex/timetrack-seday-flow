
ALTER TABLE public.horas_extras
  ADD COLUMN IF NOT EXISTS lancado_erp boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lancado_em timestamp with time zone,
  ADD COLUMN IF NOT EXISTS lancado_por uuid;

CREATE OR REPLACE FUNCTION public.is_dp_or_higher(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('master','admin','dp')
  )
$$;

DROP POLICY IF EXISTS "DP can view all overtime records" ON public.horas_extras;
CREATE POLICY "DP can view all overtime records"
ON public.horas_extras
FOR SELECT
USING (public.is_dp_or_higher(auth.uid()));

DROP POLICY IF EXISTS "DP can mark overtime as launched in ERP" ON public.horas_extras;
CREATE POLICY "DP can mark overtime as launched in ERP"
ON public.horas_extras
FOR UPDATE
USING (public.is_dp_or_higher(auth.uid()));
