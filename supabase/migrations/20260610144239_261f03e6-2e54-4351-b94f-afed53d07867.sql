
-- Helper: max hierarchical level of a user
CREATE OR REPLACE FUNCTION public.get_user_max_level(_user_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(MAX(CASE role
    WHEN 'master' THEN 5
    WHEN 'admin' THEN 5
    WHEN 'gestor' THEN 4
    WHEN 'coordenador' THEN 3
    WHEN 'supervisor' THEN 2
    WHEN 'lider' THEN 1
    WHEN 'dp' THEN 1
    WHEN 'colaborador' THEN 0
    ELSE 0 END), 0)
  FROM public.user_roles WHERE user_id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.can_approve_ferias(_approver uuid, _solicitante uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_admin_or_higher(_approver)
      OR (public.get_user_max_level(_approver) > public.get_user_max_level(_solicitante)
          AND public.get_user_max_level(_approver) >= 2)
$$;

-- Main table
CREATE TABLE public.ferias_solicitacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  matricula text,
  colaborador_nome text NOT NULL,
  cargo text,
  empresa text,
  centro_custo text NOT NULL,
  data_emissao date NOT NULL DEFAULT CURRENT_DATE,
  periodo_aquisitivo_inicio date NOT NULL,
  periodo_aquisitivo_fim date NOT NULL,
  data_inicio date NOT NULL,
  dias_descanso integer NOT NULL,
  abono_data_inicio date,
  abono_dias integer,
  observacao text,
  status text NOT NULL DEFAULT 'pendente',
  reprovado_motivo text,
  aprovado_por uuid,
  aprovado_em timestamptz,
  lancado_por uuid,
  lancado_em timestamptz,
  lancado_erp boolean NOT NULL DEFAULT false,
  criado_por uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ferias_solicitacoes TO authenticated;
GRANT ALL ON public.ferias_solicitacoes TO service_role;

ALTER TABLE public.ferias_solicitacoes ENABLE ROW LEVEL SECURITY;

-- SELECT: solicitante próprio, aprovador, DP, admin/master
CREATE POLICY "ferias_select" ON public.ferias_solicitacoes
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR criado_por = auth.uid()
  OR public.is_admin_or_higher(auth.uid())
  OR public.is_dp_or_higher(auth.uid())
  OR public.can_approve_ferias(auth.uid(), user_id)
);

-- INSERT: usuário cria pra si mesmo
CREATE POLICY "ferias_insert" ON public.ferias_solicitacoes
FOR INSERT TO authenticated
WITH CHECK (criado_por = auth.uid() AND user_id = auth.uid());

-- UPDATE: aprovadores, DP, admin/master, ou o próprio solicitante se ainda estiver pendente
CREATE POLICY "ferias_update" ON public.ferias_solicitacoes
FOR UPDATE TO authenticated
USING (
  public.is_admin_or_higher(auth.uid())
  OR public.is_dp_or_higher(auth.uid())
  OR public.can_approve_ferias(auth.uid(), user_id)
  OR (user_id = auth.uid() AND status = 'pendente')
);

-- DELETE: admin/master ou solicitante enquanto pendente
CREATE POLICY "ferias_delete" ON public.ferias_solicitacoes
FOR DELETE TO authenticated
USING (
  public.is_admin_or_higher(auth.uid())
  OR (user_id = auth.uid() AND status = 'pendente')
);

CREATE TRIGGER update_ferias_solicitacoes_updated_at
BEFORE UPDATE ON public.ferias_solicitacoes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
