CREATE TABLE public.ppo_avaliacoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo text NOT NULL CHECK (tipo IN ('adm_rh','producao','seguranca')),
  pilar text NOT NULL,
  empresa text,
  periodo_inicio date NOT NULL,
  periodo_fim date NOT NULL,
  observacao text,
  status text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','pendente','aprovado','reprovado')),
  criado_por uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ppo_itens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ppo_id uuid NOT NULL REFERENCES public.ppo_avaliacoes(id) ON DELETE CASCADE,
  ordem integer NOT NULL DEFAULT 0,
  matricula text,
  nome text NOT NULL,
  funcao text,
  criterios jsonb NOT NULL DEFAULT '{}'::jsonb,
  total numeric,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.qp_solicitacoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa text NOT NULL DEFAULT 'Avapex',
  area text,
  data_evento date NOT NULL DEFAULT CURRENT_DATE,
  data_entrega date,
  tp_admissao boolean NOT NULL DEFAULT false,
  tp_demissao boolean NOT NULL DEFAULT false,
  tp_reembolso boolean NOT NULL DEFAULT false,
  tp_advertencia boolean NOT NULL DEFAULT false,
  tp_abono boolean NOT NULL DEFAULT false,
  tp_acerto_ponto boolean NOT NULL DEFAULT false,
  tp_troca boolean NOT NULL DEFAULT false,
  tp_compensacao boolean NOT NULL DEFAULT false,
  tp_folga boolean NOT NULL DEFAULT false,
  nome text NOT NULL,
  cargo text,
  salario text,
  matricula text,
  motivo text NOT NULL,
  rec_aprovado boolean NOT NULL DEFAULT false,
  rec_treinamento boolean NOT NULL DEFAULT false,
  rec_reprovado boolean NOT NULL DEFAULT false,
  rec_curriculo boolean NOT NULL DEFAULT false,
  rec_cursos boolean NOT NULL DEFAULT false,
  rec_outros boolean NOT NULL DEFAULT false,
  indicado_por text,
  tempo_experiencia text,
  data_necessidade_admissao date,
  data_exame_admissional date,
  data_admissao date,
  ben_ad_funcao boolean NOT NULL DEFAULT false,
  ben_ad_funcao_valor text,
  ben_va_vr text,
  ben_va_vr_ativo boolean NOT NULL DEFAULT false,
  ben_va_vr_valor text,
  ben_ppo boolean NOT NULL DEFAULT false,
  ben_ppo_valor text,
  ben_vt boolean NOT NULL DEFAULT false,
  ben_vt_valor text,
  ben_plano_saude boolean NOT NULL DEFAULT false,
  ben_plano_saude_fob text,
  ben_plano_odonto boolean NOT NULL DEFAULT false,
  ben_outro text,
  ben_obs text,
  unif_calca text,
  unif_camisa text,
  unif_jaqueta text,
  unif_botina text,
  unif_capa_chuva text,
  observacoes text,
  aprov_responsavel text,
  aprov_responsavel_data date,
  aprov_encarregado text,
  aprov_encarregado_data date,
  aprov_diretoria text,
  aprov_diretoria_data date,
  aprov_administrativo text,
  aprov_administrativo_data date,
  status text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','pendente','aprovado','reprovado','concluido')),
  criado_por uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ppo_avaliacoes TO authenticated;
GRANT ALL ON public.ppo_avaliacoes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ppo_itens TO authenticated;
GRANT ALL ON public.ppo_itens TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.qp_solicitacoes TO authenticated;
GRANT ALL ON public.qp_solicitacoes TO service_role;

ALTER TABLE public.ppo_avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ppo_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qp_solicitacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ppo_select" ON public.ppo_avaliacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "ppo_insert" ON public.ppo_avaliacoes FOR INSERT TO authenticated WITH CHECK (criado_por = auth.uid());
CREATE POLICY "ppo_update" ON public.ppo_avaliacoes FOR UPDATE TO authenticated USING (criado_por = auth.uid() OR public.is_gestor_or_higher(auth.uid()));
CREATE POLICY "ppo_delete" ON public.ppo_avaliacoes FOR DELETE TO authenticated USING (criado_por = auth.uid() OR public.is_gestor_or_higher(auth.uid()));

CREATE POLICY "ppo_itens_select" ON public.ppo_itens FOR SELECT TO authenticated USING (true);
CREATE POLICY "ppo_itens_insert" ON public.ppo_itens FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.ppo_avaliacoes a WHERE a.id = ppo_id AND (a.criado_por = auth.uid() OR public.is_gestor_or_higher(auth.uid()))));
CREATE POLICY "ppo_itens_update" ON public.ppo_itens FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.ppo_avaliacoes a WHERE a.id = ppo_id AND (a.criado_por = auth.uid() OR public.is_gestor_or_higher(auth.uid()))));
CREATE POLICY "ppo_itens_delete" ON public.ppo_itens FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.ppo_avaliacoes a WHERE a.id = ppo_id AND (a.criado_por = auth.uid() OR public.is_gestor_or_higher(auth.uid()))));

CREATE POLICY "qp_select" ON public.qp_solicitacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "qp_insert" ON public.qp_solicitacoes FOR INSERT TO authenticated WITH CHECK (criado_por = auth.uid());
CREATE POLICY "qp_update" ON public.qp_solicitacoes FOR UPDATE TO authenticated USING (criado_por = auth.uid() OR public.is_gestor_or_higher(auth.uid()));
CREATE POLICY "qp_delete" ON public.qp_solicitacoes FOR DELETE TO authenticated USING (criado_por = auth.uid() OR public.is_gestor_or_higher(auth.uid()));

CREATE TRIGGER update_ppo_avaliacoes_updated_at BEFORE UPDATE ON public.ppo_avaliacoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_qp_solicitacoes_updated_at BEFORE UPDATE ON public.qp_solicitacoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();