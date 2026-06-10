
-- VAGAS
CREATE TABLE public.vagas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero SERIAL,
  -- Cabeçalho
  solicitante_nome TEXT NOT NULL,
  solicitante_cargo TEXT,
  solicitante_contato TEXT,
  unidade TEXT NOT NULL,
  area_departamento TEXT NOT NULL,
  centro_custo TEXT,
  tipo_vaga TEXT NOT NULL, -- Nova Vaga / Mobilização / Substituição
  cargo_substituido TEXT,
  data_solicitacao DATE NOT NULL DEFAULT CURRENT_DATE,
  -- Informações da vaga
  cargo_solicitado TEXT NOT NULL,
  reporta_se_a TEXT,
  area_setor TEXT,
  escala_trabalho TEXT,
  numero_vagas INTEGER NOT NULL DEFAULT 1,
  vaga_sigilosa BOOLEAN NOT NULL DEFAULT false,
  local_trabalho TEXT,
  regime_contratacao TEXT,
  faixa_salarial TEXT,
  beneficios TEXT,
  motivo_substituicao TEXT, -- Demissão/Afastamento/Promoção/Férias
  -- Justificativa
  motivo_necessidade TEXT,
  impacto_nao_preenchida TEXT,
  prazo_atendimento DATE,
  -- Perfil
  escolaridade TEXT,
  formacao TEXT,
  tempo_experiencia TEXT,
  registro_profissional TEXT,
  idiomas TEXT,
  informatica TEXT,
  cnh TEXT,
  residir_regiao TEXT,
  disp_viagens TEXT,
  disp_mudanca TEXT,
  cursos_ferramentas TEXT,
  -- Alternativas
  alt_realocacao BOOLEAN DEFAULT false,
  alt_promocao BOOLEAN DEFAULT false,
  alt_banco_talentos BOOLEAN DEFAULT false,
  alt_terceirizacao BOOLEAN DEFAULT false,
  alt_na BOOLEAN DEFAULT false,
  justificativa_sem_alternativa TEXT,
  -- Descrição do cargo
  experiencia_necessaria TEXT,
  atividades_realizadas TEXT,
  soft_skills TEXT,
  observacoes_particularidades TEXT,
  -- Recursos
  recursos_ti TEXT,
  recursos_logistica TEXT,
  recursos_infraestrutura TEXT,
  recursos_sst TEXT,
  recursos_financeiro TEXT,
  -- Aprovações diretoria (físicas)
  aprov_gestor_processo TEXT,
  aprov_gestor_rh TEXT,
  aprov_diretoria TEXT,
  aprov_diretor_presidente TEXT,
  data_aprovacao DATE,
  -- Controle RH
  data_abertura DATE,
  responsavel_recrutamento TEXT,
  fonte_recrutamento TEXT,
  data_fechamento DATE,
  data_admissao DATE,
  comunicacao_areas TEXT,
  data_comunicacao DATE,
  alinhada_descricao_funcao BOOLEAN,
  observacoes_rh TEXT,
  -- Status
  status TEXT NOT NULL DEFAULT 'pendente_aprovacao', -- pendente_aprovacao, aprovada, congelada, cancelada, fechada
  criado_por UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vagas TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.vagas_numero_seq TO authenticated;
GRANT ALL ON public.vagas TO service_role;
ALTER TABLE public.vagas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vagas_select_gestor" ON public.vagas FOR SELECT TO authenticated
USING (public.is_gestor_or_higher(auth.uid()) OR public.is_dp_or_higher(auth.uid()) OR criado_por = auth.uid());

CREATE POLICY "vagas_insert_gestor" ON public.vagas FOR INSERT TO authenticated
WITH CHECK (criado_por = auth.uid() AND (public.is_gestor_or_higher(auth.uid()) OR public.is_dp_or_higher(auth.uid())));

CREATE POLICY "vagas_update_rh" ON public.vagas FOR UPDATE TO authenticated
USING (public.is_dp_or_higher(auth.uid()) OR public.is_admin_or_higher(auth.uid()) OR (criado_por = auth.uid() AND status = 'pendente_aprovacao'));

CREATE POLICY "vagas_delete_admin" ON public.vagas FOR DELETE TO authenticated
USING (public.is_admin_or_higher(auth.uid()));

CREATE TRIGGER trg_vagas_updated_at BEFORE UPDATE ON public.vagas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- CURRÍCULOS (histórico de envios ao gestor)
CREATE TABLE public.vaga_curriculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vaga_id UUID NOT NULL REFERENCES public.vagas(id) ON DELETE CASCADE,
  candidato_nome TEXT NOT NULL,
  enviado_gestor_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  retorno_gestor_em TIMESTAMPTZ,
  retorno_gestor_texto TEXT,
  data_entrevista TIMESTAMPTZ,
  observacao TEXT,
  criado_por UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vaga_curriculos TO authenticated;
GRANT ALL ON public.vaga_curriculos TO service_role;
ALTER TABLE public.vaga_curriculos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vaga_cv_select" ON public.vaga_curriculos FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.vagas v WHERE v.id = vaga_id AND (public.is_gestor_or_higher(auth.uid()) OR public.is_dp_or_higher(auth.uid()) OR v.criado_por = auth.uid())));

CREATE POLICY "vaga_cv_modify" ON public.vaga_curriculos FOR ALL TO authenticated
USING (public.is_dp_or_higher(auth.uid()) OR public.is_admin_or_higher(auth.uid()))
WITH CHECK (public.is_dp_or_higher(auth.uid()) OR public.is_admin_or_higher(auth.uid()));

CREATE TRIGGER trg_vaga_cv_updated_at BEFORE UPDATE ON public.vaga_curriculos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- CANDIDATOS (acompanhamento por candidato)
CREATE TABLE public.vaga_candidatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vaga_id UUID NOT NULL REFERENCES public.vagas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  substituicao_de TEXT,
  data_entrevista DATE,
  data_encaminhamento_exame DATE,
  data_solicitacao_documentos DATE,
  data_envio_documentos DATE,
  data_efetivacao DATE,
  status TEXT DEFAULT 'em_processo', -- em_processo, aprovado, reprovado, desistente, contratado
  observacao TEXT,
  criado_por UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vaga_candidatos TO authenticated;
GRANT ALL ON public.vaga_candidatos TO service_role;
ALTER TABLE public.vaga_candidatos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vaga_cand_select" ON public.vaga_candidatos FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.vagas v WHERE v.id = vaga_id AND (public.is_gestor_or_higher(auth.uid()) OR public.is_dp_or_higher(auth.uid()) OR v.criado_por = auth.uid())));

CREATE POLICY "vaga_cand_modify" ON public.vaga_candidatos FOR ALL TO authenticated
USING (public.is_dp_or_higher(auth.uid()) OR public.is_admin_or_higher(auth.uid()))
WITH CHECK (public.is_dp_or_higher(auth.uid()) OR public.is_admin_or_higher(auth.uid()));

CREATE TRIGGER trg_vaga_cand_updated_at BEFORE UPDATE ON public.vaga_candidatos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
