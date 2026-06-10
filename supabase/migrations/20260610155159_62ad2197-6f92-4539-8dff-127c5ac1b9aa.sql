
CREATE TABLE public.avaliacoes_competencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  avaliador_id uuid NOT NULL,
  periodo text NOT NULL CHECK (periodo IN ('30','60','90')),
  nome text NOT NULL,
  cargo text,
  setor text,
  matricula text,
  data_admissao date,
  data_termino date,
  observacoes text NOT NULL,
  medida text NOT NULL CHECK (medida IN ('prorrogar','efetivar','demitir')),
  mobilizacao boolean NOT NULL,
  data_mobilizacao date,
  motivo_nao_mobilizacao text,
  status text NOT NULL DEFAULT 'finalizada' CHECK (status IN ('rascunho','finalizada')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mobilizacao_consistente CHECK (
    (mobilizacao = true AND data_mobilizacao IS NOT NULL)
    OR (mobilizacao = false AND motivo_nao_mobilizacao IS NOT NULL AND length(trim(motivo_nao_mobilizacao)) > 0)
  )
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.avaliacoes_competencias TO authenticated;
GRANT ALL ON public.avaliacoes_competencias TO service_role;

ALTER TABLE public.avaliacoes_competencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gestores+ veem todas avaliacoes" ON public.avaliacoes_competencias
  FOR SELECT TO authenticated
  USING (public.is_gestor_or_higher(auth.uid()) OR public.is_dp_or_higher(auth.uid()));

CREATE POLICY "Colaborador ve as proprias" ON public.avaliacoes_competencias
  FOR SELECT TO authenticated
  USING (colaborador_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Gestores+ inserem avaliacoes" ON public.avaliacoes_competencias
  FOR INSERT TO authenticated
  WITH CHECK (public.is_gestor_or_higher(auth.uid()));

CREATE POLICY "Gestores+ atualizam avaliacoes" ON public.avaliacoes_competencias
  FOR UPDATE TO authenticated
  USING (public.is_gestor_or_higher(auth.uid()))
  WITH CHECK (public.is_gestor_or_higher(auth.uid()));

CREATE POLICY "Admin+ deleta avaliacoes" ON public.avaliacoes_competencias
  FOR DELETE TO authenticated
  USING (public.is_admin_or_higher(auth.uid()));

CREATE TRIGGER trg_av_comp_upd BEFORE UPDATE ON public.avaliacoes_competencias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.avaliacao_competencias_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  avaliacao_id uuid NOT NULL REFERENCES public.avaliacoes_competencias(id) ON DELETE CASCADE,
  ordem int NOT NULL,
  competencia text NOT NULL,
  descricao text,
  nota text NOT NULL CHECK (nota IN ('insatisfatorio','fraco','regular','bom','otimo','excelente','nao_aplicavel')),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.avaliacao_competencias_itens TO authenticated;
GRANT ALL ON public.avaliacao_competencias_itens TO service_role;

ALTER TABLE public.avaliacao_competencias_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Itens seguem permissao da avaliacao - select" ON public.avaliacao_competencias_itens
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.avaliacoes_competencias a WHERE a.id = avaliacao_id
    AND (public.is_gestor_or_higher(auth.uid())
      OR public.is_dp_or_higher(auth.uid())
      OR a.colaborador_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))));

CREATE POLICY "Itens - insert por gestor+" ON public.avaliacao_competencias_itens
  FOR INSERT TO authenticated
  WITH CHECK (public.is_gestor_or_higher(auth.uid()));

CREATE POLICY "Itens - update por gestor+" ON public.avaliacao_competencias_itens
  FOR UPDATE TO authenticated
  USING (public.is_gestor_or_higher(auth.uid()))
  WITH CHECK (public.is_gestor_or_higher(auth.uid()));

CREATE POLICY "Itens - delete por gestor+" ON public.avaliacao_competencias_itens
  FOR DELETE TO authenticated
  USING (public.is_gestor_or_higher(auth.uid()));
