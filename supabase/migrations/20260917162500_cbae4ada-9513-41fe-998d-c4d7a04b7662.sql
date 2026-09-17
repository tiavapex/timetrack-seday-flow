-- ============ PRESERVA O MÓDULO ATUAL (PPO OPERACIONAL) ============
ALTER TABLE public.ppo_avaliacoes RENAME TO ppo_operacional_avaliacoes;
ALTER TABLE public.ppo_itens RENAME TO ppo_operacional_itens;

-- ============ FUNÇÕES DE PERFIL ============
CREATE OR REPLACE FUNCTION public.ppo_is_rh(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('master','admin','rh','dp'))
$$;

CREATE OR REPLACE FUNCTION public.ppo_is_gerencia(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('master','admin','gestor'))
$$;

CREATE OR REPLACE FUNCTION public.ppo_is_lideranca(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id
    AND role IN ('master','admin','gestor','coordenador','supervisor','encarregado','lider'))
$$;

CREATE OR REPLACE FUNCTION public.ppo_is_sesmt(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('master','admin','sesmt'))
$$;

CREATE OR REPLACE FUNCTION public.ppo_is_auditor(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id
    AND role IN ('master','admin','sgi','diretoria','juridico'))
$$;

-- pode administrar parametrizações (indicadores, ciclos, pesos, SLA)
CREATE OR REPLACE FUNCTION public.ppo_can_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id
    AND role IN ('master','admin','rh','dp','diretoria'))
$$;

-- leitura geral do programa (sem dados individuais de terceiros)
CREATE OR REPLACE FUNCTION public.ppo_can_read_param(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.ppo_is_owner(_colaborador_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = _colaborador_id AND p.user_id = auth.uid())
$$;

REVOKE EXECUTE ON FUNCTION public.ppo_is_rh(uuid), public.ppo_is_gerencia(uuid), public.ppo_is_lideranca(uuid),
  public.ppo_is_sesmt(uuid), public.ppo_is_auditor(uuid), public.ppo_can_admin(uuid),
  public.ppo_can_read_param(uuid), public.ppo_is_owner(uuid) FROM anon;

-- ============ FERIADOS ============
CREATE TABLE public.feriados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL UNIQUE,
  descricao text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.feriados TO authenticated;
GRANT ALL ON public.feriados TO service_role;
ALTER TABLE public.feriados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feriados leitura autenticada" ON public.feriados FOR SELECT TO authenticated USING (true);
CREATE POLICY "feriados gestao rh" ON public.feriados FOR ALL TO authenticated
  USING (public.ppo_can_admin(auth.uid())) WITH CHECK (public.ppo_can_admin(auth.uid()));

-- ============ CICLOS ============
CREATE TABLE public.ppo_ciclos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  ano integer NOT NULL,
  periodo_inicio date NOT NULL,
  periodo_fim date NOT NULL,
  data_corte date,
  status text NOT NULL DEFAULT 'rascunho',
  observacoes text,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ppo_ciclos_status_chk CHECK (status IN ('rascunho','aberto','em_apuracao','em_validacao','comunicado','encerrado'))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ppo_ciclos TO authenticated;
GRANT ALL ON public.ppo_ciclos TO service_role;
ALTER TABLE public.ppo_ciclos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ciclos leitura" ON public.ppo_ciclos FOR SELECT TO authenticated USING (true);
CREATE POLICY "ciclos gestao" ON public.ppo_ciclos FOR ALL TO authenticated
  USING (public.ppo_can_admin(auth.uid())) WITH CHECK (public.ppo_can_admin(auth.uid()));

-- ============ SETORES / CARGOS ============
CREATE TABLE public.ppo_setores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  ativo boolean NOT NULL DEFAULT true,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ppo_setores TO authenticated;
GRANT ALL ON public.ppo_setores TO service_role;
ALTER TABLE public.ppo_setores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "setores leitura" ON public.ppo_setores FOR SELECT TO authenticated USING (true);
CREATE POLICY "setores gestao" ON public.ppo_setores FOR ALL TO authenticated
  USING (public.ppo_can_admin(auth.uid())) WITH CHECK (public.ppo_can_admin(auth.uid()));

CREATE TABLE public.ppo_cargos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setor_id uuid REFERENCES public.ppo_setores(id) ON DELETE SET NULL,
  nome text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ppo_cargos TO authenticated;
GRANT ALL ON public.ppo_cargos TO service_role;
ALTER TABLE public.ppo_cargos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cargos leitura" ON public.ppo_cargos FOR SELECT TO authenticated USING (true);
CREATE POLICY "cargos gestao" ON public.ppo_cargos FOR ALL TO authenticated
  USING (public.ppo_can_admin(auth.uid())) WITH CHECK (public.ppo_can_admin(auth.uid()));

-- ============ PESOS POR PILAR ============
CREATE TABLE public.ppo_pesos_pilar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ciclo_id uuid REFERENCES public.ppo_ciclos(id) ON DELETE CASCADE,
  setor_id uuid REFERENCES public.ppo_setores(id) ON DELETE CASCADE,
  cargo_id uuid REFERENCES public.ppo_cargos(id) ON DELETE CASCADE,
  p1 numeric(5,2) NOT NULL DEFAULT 50,
  p2 numeric(5,2) NOT NULL DEFAULT 25,
  p3 numeric(5,2) NOT NULL DEFAULT 15,
  p4 numeric(5,2) NOT NULL DEFAULT 10,
  padrao boolean NOT NULL DEFAULT false,
  justificativa text,
  aprovado_por uuid,
  aprovado_em timestamptz,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ppo_pesos_soma_chk CHECK (p1 + p2 + p3 + p4 = 100)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ppo_pesos_pilar TO authenticated;
GRANT ALL ON public.ppo_pesos_pilar TO service_role;
ALTER TABLE public.ppo_pesos_pilar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pesos leitura" ON public.ppo_pesos_pilar FOR SELECT TO authenticated USING (true);
CREATE POLICY "pesos gestao" ON public.ppo_pesos_pilar FOR ALL TO authenticated
  USING (public.ppo_can_admin(auth.uid())) WITH CHECK (public.ppo_can_admin(auth.uid()));

-- ============ INDICADORES ============
CREATE TABLE public.ppo_indicadores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setor_id uuid REFERENCES public.ppo_setores(id) ON DELETE SET NULL,
  cargo_id uuid REFERENCES public.ppo_cargos(id) ON DELETE SET NULL,
  pilar smallint NOT NULL CHECK (pilar BETWEEN 1 AND 4),
  nome text NOT NULL,
  descricao text,
  formula text,
  unidade text CHECK (unidade IN ('%','dias','qtd','score','sim_nao')),
  direcao text NOT NULL DEFAULT 'maior_melhor' CHECK (direcao IN ('maior_melhor','menor_melhor','binario')),
  meta numeric,
  peso numeric(5,2),
  fonte_dado text,
  responsavel_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  requisito_minimo boolean NOT NULL DEFAULT false,
  critico boolean NOT NULL DEFAULT false,
  ativo boolean NOT NULL DEFAULT true,
  versao integer NOT NULL DEFAULT 1,
  indicador_origem_id uuid,
  motivo_alteracao text,
  vigencia_inicio date,
  vigencia_fim date,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ppo_indicadores TO authenticated;
GRANT ALL ON public.ppo_indicadores TO service_role;
ALTER TABLE public.ppo_indicadores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "indicadores leitura" ON public.ppo_indicadores FOR SELECT TO authenticated USING (true);
CREATE POLICY "indicadores gestao" ON public.ppo_indicadores FOR ALL TO authenticated
  USING (public.ppo_can_admin(auth.uid()) OR public.ppo_is_gerencia(auth.uid()))
  WITH CHECK (public.ppo_can_admin(auth.uid()) OR public.ppo_is_gerencia(auth.uid()));
CREATE POLICY "indicadores sesmt pilar3" ON public.ppo_indicadores FOR UPDATE TO authenticated
  USING (public.ppo_is_sesmt(auth.uid()) AND pilar = 3)
  WITH CHECK (public.ppo_is_sesmt(auth.uid()) AND pilar = 3);

CREATE TABLE public.ppo_faixas_indicador (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  indicador_id uuid NOT NULL REFERENCES public.ppo_indicadores(id) ON DELETE CASCADE,
  limite_inferior numeric,
  limite_superior numeric,
  nota numeric(5,2) NOT NULL CHECK (nota >= 0 AND nota <= 100),
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ppo_faixas_indicador TO authenticated;
GRANT ALL ON public.ppo_faixas_indicador TO service_role;
ALTER TABLE public.ppo_faixas_indicador ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faixas leitura" ON public.ppo_faixas_indicador FOR SELECT TO authenticated USING (true);
CREATE POLICY "faixas gestao" ON public.ppo_faixas_indicador FOR ALL TO authenticated
  USING (public.ppo_can_admin(auth.uid()) OR public.ppo_is_gerencia(auth.uid()))
  WITH CHECK (public.ppo_can_admin(auth.uid()) OR public.ppo_is_gerencia(auth.uid()));

-- ============ SLA ============
CREATE TABLE public.ppo_sla (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setor_id uuid REFERENCES public.ppo_setores(id) ON DELETE CASCADE,
  setor_nome text,
  processo text NOT NULL,
  sla_valor text NOT NULL,
  sla_unidade text,
  indicador_texto text,
  indicador_id uuid REFERENCES public.ppo_indicadores(id) ON DELETE SET NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ppo_sla TO authenticated;
GRANT ALL ON public.ppo_sla TO service_role;
ALTER TABLE public.ppo_sla ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sla leitura" ON public.ppo_sla FOR SELECT TO authenticated USING (true);
CREATE POLICY "sla gestao" ON public.ppo_sla FOR ALL TO authenticated
  USING (public.ppo_can_admin(auth.uid()) OR public.ppo_is_gerencia(auth.uid()))
  WITH CHECK (public.ppo_can_admin(auth.uid()) OR public.ppo_is_gerencia(auth.uid()));

-- ============ AVALIAÇÕES ============
CREATE TABLE public.ppo_avaliacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ciclo_id uuid NOT NULL REFERENCES public.ppo_ciclos(id) ON DELETE CASCADE,
  colaborador_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cargo_id uuid REFERENCES public.ppo_cargos(id) ON DELETE SET NULL,
  setor_id uuid REFERENCES public.ppo_setores(id) ON DELETE SET NULL,
  gestor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'rascunho',
  nota_p1 numeric(6,2),
  nota_p2 numeric(6,2),
  nota_p3 numeric(6,2),
  nota_p4 numeric(6,2),
  nota_final numeric(6,2),
  faixa text,
  percentual_referencia numeric(5,2),
  elegivel boolean NOT NULL DEFAULT true,
  motivo_inelegibilidade text,
  eleg_vinculo boolean NOT NULL DEFAULT false,
  eleg_cargo_contemplado boolean NOT NULL DEFAULT false,
  eleg_indicadores_definidos boolean NOT NULL DEFAULT false,
  eleg_periodo_suficiente boolean NOT NULL DEFAULT false,
  eleg_evidencias_suficientes boolean NOT NULL DEFAULT false,
  eleg_requisitos_seguranca boolean NOT NULL DEFAULT false,
  requisito_ocupacional_atendido boolean,
  proporcional boolean NOT NULL DEFAULT false,
  fator_proporcional numeric(5,2),
  proporcional_motivo text,
  analise_rh text,
  analise_rh_por uuid,
  analise_rh_em timestamptz,
  valor_base numeric(12,2),
  validado_por uuid,
  validado_em timestamptz,
  comunicado_em timestamptz,
  encerrado_em timestamptz,
  ativo boolean NOT NULL DEFAULT true,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ppo_aval_status_chk CHECK (status IN ('rascunho','em_apuracao','aguardando_validacao','validada','comunicada','em_contestacao','encerrada')),
  CONSTRAINT ppo_aval_unica UNIQUE (ciclo_id, colaborador_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ppo_avaliacoes TO authenticated;
GRANT ALL ON public.ppo_avaliacoes TO service_role;
ALTER TABLE public.ppo_avaliacoes ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.ppo_is_gestor_da_avaliacao(_avaliacao_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ppo_avaliacoes a
    JOIN public.profiles g ON g.id = a.gestor_id
    WHERE a.id = _avaliacao_id AND g.user_id = auth.uid()
  )
$$;
REVOKE EXECUTE ON FUNCTION public.ppo_is_gestor_da_avaliacao(uuid) FROM anon;

CREATE POLICY "aval colaborador le proprio comunicado" ON public.ppo_avaliacoes FOR SELECT TO authenticated
  USING (public.ppo_is_owner(colaborador_id) AND status IN ('comunicada','em_contestacao','encerrada'));
CREATE POLICY "aval lideranca le equipe" ON public.ppo_avaliacoes FOR SELECT TO authenticated
  USING (public.ppo_is_gestor_da_avaliacao(id) OR public.ppo_is_gerencia(auth.uid())
         OR public.ppo_is_rh(auth.uid()) OR public.ppo_is_auditor(auth.uid()) OR public.ppo_is_sesmt(auth.uid()));
CREATE POLICY "aval lideranca edita equipe" ON public.ppo_avaliacoes FOR UPDATE TO authenticated
  USING (public.ppo_is_gestor_da_avaliacao(id) OR public.ppo_is_gerencia(auth.uid()) OR public.ppo_is_rh(auth.uid()))
  WITH CHECK (public.ppo_is_gestor_da_avaliacao(id) OR public.ppo_is_gerencia(auth.uid()) OR public.ppo_is_rh(auth.uid()));
CREATE POLICY "aval criacao rh gerencia" ON public.ppo_avaliacoes FOR INSERT TO authenticated
  WITH CHECK (public.ppo_is_rh(auth.uid()) OR public.ppo_is_gerencia(auth.uid()));
CREATE POLICY "aval exclusao rh" ON public.ppo_avaliacoes FOR DELETE TO authenticated
  USING (public.ppo_is_rh(auth.uid()) AND status = 'rascunho');

-- ============ ITENS ============
CREATE TABLE public.ppo_avaliacao_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  avaliacao_id uuid NOT NULL REFERENCES public.ppo_avaliacoes(id) ON DELETE CASCADE,
  indicador_id uuid NOT NULL REFERENCES public.ppo_indicadores(id) ON DELETE RESTRICT,
  pilar smallint NOT NULL DEFAULT 1 CHECK (pilar BETWEEN 1 AND 4),
  valor_apurado numeric,
  nota_convertida numeric(6,2),
  nota_manual numeric(6,2),
  nota_manual_justificativa text,
  peso_aplicado numeric(5,2),
  nota_ponderada numeric(8,4),
  fonte_dado text,
  evidencia_url text,
  evidencia_descricao text,
  requisito_minimo_atendido boolean,
  apurado_por uuid,
  apurado_em timestamptz,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ppo_item_unico UNIQUE (avaliacao_id, indicador_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ppo_avaliacao_itens TO authenticated;
GRANT ALL ON public.ppo_avaliacao_itens TO service_role;
ALTER TABLE public.ppo_avaliacao_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "itens leitura" ON public.ppo_avaliacao_itens FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ppo_avaliacoes a WHERE a.id = avaliacao_id));
CREATE POLICY "itens escrita" ON public.ppo_avaliacao_itens FOR ALL TO authenticated
  USING (public.ppo_is_gestor_da_avaliacao(avaliacao_id) OR public.ppo_is_gerencia(auth.uid())
         OR public.ppo_is_rh(auth.uid()) OR (public.ppo_is_sesmt(auth.uid()) AND pilar = 3))
  WITH CHECK (public.ppo_is_gestor_da_avaliacao(avaliacao_id) OR public.ppo_is_gerencia(auth.uid())
         OR public.ppo_is_rh(auth.uid()) OR (public.ppo_is_sesmt(auth.uid()) AND pilar = 3));

-- ============ OCORRÊNCIAS ============
CREATE TABLE public.ppo_ocorrencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  avaliacao_id uuid REFERENCES public.ppo_avaliacoes(id) ON DELETE SET NULL,
  colaborador_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ciclo_id uuid REFERENCES public.ppo_ciclos(id) ON DELETE SET NULL,
  tipo text NOT NULL CHECK (tipo IN ('indicador','qualidade','seguranca','compliance','integridade_informacao','outro')),
  data_ocorrencia date NOT NULL DEFAULT CURRENT_DATE,
  descricao text NOT NULL,
  evidencia_url text,
  indicador_impactado_id uuid REFERENCES public.ppo_indicadores(id) ON DELETE SET NULL,
  analise_lideranca text,
  manifestacao_colaborador text,
  manifestacao_em timestamptz,
  prazo_manifestacao date,
  decisao text,
  decidido_por uuid,
  decidido_em timestamptz,
  status text NOT NULL DEFAULT 'registrada' CHECK (status IN ('registrada','em_analise','aguardando_manifestacao','decidida','arquivada')),
  impacta_nota boolean NOT NULL DEFAULT false,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ppo_ocorrencias TO authenticated;
GRANT ALL ON public.ppo_ocorrencias TO service_role;
ALTER TABLE public.ppo_ocorrencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ocor colaborador le propria" ON public.ppo_ocorrencias FOR SELECT TO authenticated
  USING (public.ppo_is_owner(colaborador_id));
CREATE POLICY "ocor colaborador manifesta" ON public.ppo_ocorrencias FOR UPDATE TO authenticated
  USING (public.ppo_is_owner(colaborador_id) AND status = 'aguardando_manifestacao')
  WITH CHECK (public.ppo_is_owner(colaborador_id));
CREATE POLICY "ocor gestao le" ON public.ppo_ocorrencias FOR SELECT TO authenticated
  USING (public.ppo_is_lideranca(auth.uid()) OR public.ppo_is_rh(auth.uid())
         OR public.ppo_is_auditor(auth.uid()) OR public.ppo_is_sesmt(auth.uid()));
CREATE POLICY "ocor gestao insere" ON public.ppo_ocorrencias FOR INSERT TO authenticated
  WITH CHECK (public.ppo_is_lideranca(auth.uid()) OR public.ppo_is_rh(auth.uid()) OR public.ppo_is_sesmt(auth.uid()));
CREATE POLICY "ocor gestao edita" ON public.ppo_ocorrencias FOR UPDATE TO authenticated
  USING (public.ppo_is_lideranca(auth.uid()) OR public.ppo_is_rh(auth.uid()) OR public.ppo_is_sesmt(auth.uid()))
  WITH CHECK (public.ppo_is_lideranca(auth.uid()) OR public.ppo_is_rh(auth.uid()) OR public.ppo_is_sesmt(auth.uid()));

-- ============ BARREIRAS ============
CREATE TABLE public.ppo_barreiras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  avaliacao_id uuid NOT NULL REFERENCES public.ppo_avaliacoes(id) ON DELETE CASCADE,
  tipo_barreira text NOT NULL,
  descricao text NOT NULL,
  evidencia_url text,
  analise text,
  aprovado_por uuid,
  aprovado_em timestamptz,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ppo_barreiras TO authenticated;
GRANT ALL ON public.ppo_barreiras TO service_role;
ALTER TABLE public.ppo_barreiras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "barreiras leitura" ON public.ppo_barreiras FOR SELECT TO authenticated
  USING (public.ppo_is_rh(auth.uid()) OR public.ppo_is_gerencia(auth.uid()) OR public.ppo_is_auditor(auth.uid())
         OR EXISTS (SELECT 1 FROM public.ppo_avaliacoes a WHERE a.id = avaliacao_id AND public.ppo_is_owner(a.colaborador_id)));
CREATE POLICY "barreiras gestao" ON public.ppo_barreiras FOR ALL TO authenticated
  USING (public.ppo_is_rh(auth.uid()) OR public.ppo_is_gerencia(auth.uid()))
  WITH CHECK (public.ppo_is_rh(auth.uid()) OR public.ppo_is_gerencia(auth.uid()));

-- ============ CONTESTAÇÕES ============
CREATE TABLE public.ppo_contestacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  avaliacao_id uuid NOT NULL REFERENCES public.ppo_avaliacoes(id) ON DELETE CASCADE,
  indicador_id uuid REFERENCES public.ppo_indicadores(id) ON DELETE SET NULL,
  resultado_contestado text,
  motivo text NOT NULL,
  evidencia_url text,
  solicitacao_revisao text,
  aberta_em timestamptz NOT NULL DEFAULT now(),
  prazo_limite date,
  fora_do_prazo boolean NOT NULL DEFAULT false,
  override_rh_justificativa text,
  analise text,
  decisao text CHECK (decisao IN ('mantido','alterado','cancelado')),
  justificativa text,
  analisado_por uuid,
  analisado_em timestamptz,
  nota_anterior numeric(6,2),
  nota_nova numeric(6,2),
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ppo_contestacoes TO authenticated;
GRANT ALL ON public.ppo_contestacoes TO service_role;
ALTER TABLE public.ppo_contestacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contest colaborador" ON public.ppo_contestacoes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ppo_avaliacoes a WHERE a.id = avaliacao_id AND public.ppo_is_owner(a.colaborador_id)));
CREATE POLICY "contest colaborador abre" ON public.ppo_contestacoes FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.ppo_avaliacoes a WHERE a.id = avaliacao_id AND public.ppo_is_owner(a.colaborador_id))
              OR public.ppo_is_rh(auth.uid()));
CREATE POLICY "contest gestao le" ON public.ppo_contestacoes FOR SELECT TO authenticated
  USING (public.ppo_is_rh(auth.uid()) OR public.ppo_is_gerencia(auth.uid()) OR public.ppo_is_auditor(auth.uid()));
CREATE POLICY "contest gestao analisa" ON public.ppo_contestacoes FOR UPDATE TO authenticated
  USING (public.ppo_is_rh(auth.uid()) OR public.ppo_is_gerencia(auth.uid()))
  WITH CHECK (public.ppo_is_rh(auth.uid()) OR public.ppo_is_gerencia(auth.uid()));

-- ============ FEEDBACK / PLANO DE AÇÃO ============
CREATE TABLE public.ppo_feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  avaliacao_id uuid NOT NULL REFERENCES public.ppo_avaliacoes(id) ON DELETE CASCADE,
  pontos_positivos text,
  indicadores_destaque text,
  oportunidades text,
  expectativas text,
  gestor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  realizado_em timestamptz NOT NULL DEFAULT now(),
  ciente_gestor boolean NOT NULL DEFAULT false,
  ciente_gestor_em timestamptz,
  ciente_colaborador boolean NOT NULL DEFAULT false,
  ciente_em timestamptz,
  ciente_ip text,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ppo_feedbacks TO authenticated;
GRANT ALL ON public.ppo_feedbacks TO service_role;
ALTER TABLE public.ppo_feedbacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fb leitura" ON public.ppo_feedbacks FOR SELECT TO authenticated
  USING (public.ppo_is_rh(auth.uid()) OR public.ppo_is_gerencia(auth.uid()) OR public.ppo_is_auditor(auth.uid())
         OR public.ppo_is_gestor_da_avaliacao(avaliacao_id)
         OR EXISTS (SELECT 1 FROM public.ppo_avaliacoes a WHERE a.id = avaliacao_id AND public.ppo_is_owner(a.colaborador_id)));
CREATE POLICY "fb gestao" ON public.ppo_feedbacks FOR ALL TO authenticated
  USING (public.ppo_is_rh(auth.uid()) OR public.ppo_is_lideranca(auth.uid()))
  WITH CHECK (public.ppo_is_rh(auth.uid()) OR public.ppo_is_lideranca(auth.uid()));
CREATE POLICY "fb colaborador ciencia" ON public.ppo_feedbacks FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ppo_avaliacoes a WHERE a.id = avaliacao_id AND public.ppo_is_owner(a.colaborador_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.ppo_avaliacoes a WHERE a.id = avaliacao_id AND public.ppo_is_owner(a.colaborador_id)));

CREATE TABLE public.ppo_plano_acao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id uuid NOT NULL REFERENCES public.ppo_feedbacks(id) ON DELETE CASCADE,
  acao text NOT NULL,
  responsavel_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  responsavel_nome text,
  prazo date,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','em_andamento','concluida','cancelada')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ppo_plano_acao TO authenticated;
GRANT ALL ON public.ppo_plano_acao TO service_role;
ALTER TABLE public.ppo_plano_acao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plano leitura" ON public.ppo_plano_acao FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ppo_feedbacks f WHERE f.id = feedback_id));
CREATE POLICY "plano gestao" ON public.ppo_plano_acao FOR ALL TO authenticated
  USING (public.ppo_is_rh(auth.uid()) OR public.ppo_is_lideranca(auth.uid()))
  WITH CHECK (public.ppo_is_rh(auth.uid()) OR public.ppo_is_lideranca(auth.uid()));

-- ============ TERMOS DE CIÊNCIA ============
CREATE TABLE public.ppo_termos_ciencia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ciclo_id uuid NOT NULL REFERENCES public.ppo_ciclos(id) ON DELETE CASCADE,
  colaborador_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  aceito_em timestamptz NOT NULL DEFAULT now(),
  ip text,
  texto_versao text NOT NULL DEFAULT 'PO-ADM-03 rev 01',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ppo_termo_unico UNIQUE (ciclo_id, colaborador_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ppo_termos_ciencia TO authenticated;
GRANT ALL ON public.ppo_termos_ciencia TO service_role;
ALTER TABLE public.ppo_termos_ciencia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "termo colaborador le" ON public.ppo_termos_ciencia FOR SELECT TO authenticated
  USING (public.ppo_is_owner(colaborador_id) OR public.ppo_is_rh(auth.uid()) OR public.ppo_is_auditor(auth.uid()));
CREATE POLICY "termo colaborador aceita" ON public.ppo_termos_ciencia FOR INSERT TO authenticated
  WITH CHECK (public.ppo_is_owner(colaborador_id) OR public.ppo_is_rh(auth.uid()));

-- ============ MELHORIAS ============
CREATE TABLE public.ppo_melhorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  avaliacao_id uuid REFERENCES public.ppo_avaliacoes(id) ON DELETE SET NULL,
  colaborador_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  descricao text NOT NULL,
  tipo text,
  encaminhado_melhoria_continua boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'registrada',
  resultado text,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ppo_melhorias TO authenticated;
GRANT ALL ON public.ppo_melhorias TO service_role;
ALTER TABLE public.ppo_melhorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "melhorias leitura" ON public.ppo_melhorias FOR SELECT TO authenticated USING (true);
CREATE POLICY "melhorias gestao" ON public.ppo_melhorias FOR ALL TO authenticated
  USING (public.ppo_is_rh(auth.uid()) OR public.ppo_is_lideranca(auth.uid()))
  WITH CHECK (public.ppo_is_rh(auth.uid()) OR public.ppo_is_lideranca(auth.uid()));

-- ============ GOVERNANÇA ============
CREATE TABLE public.ppo_governanca (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ordem integer NOT NULL DEFAULT 0,
  etapa text NOT NULL,
  responsavel_perfil text NOT NULL,
  validacao_perfil text,
  registro text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ppo_governanca TO authenticated;
GRANT ALL ON public.ppo_governanca TO service_role;
ALTER TABLE public.ppo_governanca ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gov leitura" ON public.ppo_governanca FOR SELECT TO authenticated USING (true);
CREATE POLICY "gov gestao" ON public.ppo_governanca FOR ALL TO authenticated
  USING (public.ppo_can_admin(auth.uid())) WITH CHECK (public.ppo_can_admin(auth.uid()));

-- ============ AUDITORIA ============
CREATE TABLE public.ppo_auditoria_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade text NOT NULL,
  entidade_id uuid,
  acao text NOT NULL,
  usuario_id uuid DEFAULT auth.uid(),
  dados_antes jsonb,
  dados_depois jsonb,
  ip text,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ppo_auditoria_log TO authenticated;
GRANT ALL ON public.ppo_auditoria_log TO service_role;
ALTER TABLE public.ppo_auditoria_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit leitura auditores" ON public.ppo_auditoria_log FOR SELECT TO authenticated
  USING (public.ppo_is_auditor(auth.uid()) OR public.ppo_is_rh(auth.uid()));
CREATE POLICY "audit insercao autenticada" ON public.ppo_auditoria_log FOR INSERT TO authenticated
  WITH CHECK (usuario_id = auth.uid());
CREATE INDEX ppo_audit_ent_idx ON public.ppo_auditoria_log (entidade, entidade_id, criado_em DESC);

-- ============ TRIGGER GENÉRICO DE AUDITORIA ============
CREATE OR REPLACE FUNCTION public.ppo_audit_trigger()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.ppo_auditoria_log (entidade, entidade_id, acao, usuario_id, dados_depois)
    VALUES (TG_TABLE_NAME, NEW.id, 'insert', auth.uid(), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.ppo_auditoria_log (entidade, entidade_id, acao, usuario_id, dados_antes, dados_depois)
    VALUES (TG_TABLE_NAME, NEW.id, 'update', auth.uid(), to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSE
    INSERT INTO public.ppo_auditoria_log (entidade, entidade_id, acao, usuario_id, dados_antes)
    VALUES (TG_TABLE_NAME, OLD.id, 'delete', auth.uid(), to_jsonb(OLD));
    RETURN OLD;
  END IF;
END;
$$;

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['ppo_ciclos','ppo_setores','ppo_cargos','ppo_pesos_pilar','ppo_indicadores',
    'ppo_faixas_indicador','ppo_sla','ppo_avaliacoes','ppo_avaliacao_itens','ppo_ocorrencias','ppo_barreiras',
    'ppo_contestacoes','ppo_feedbacks','ppo_plano_acao','ppo_termos_ciencia','ppo_melhorias','ppo_governanca'])
  LOOP
    EXECUTE format('CREATE TRIGGER trg_%s_audit AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.ppo_audit_trigger()', t, t);
    EXECUTE format('CREATE TRIGGER trg_%s_upd BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t, t);
  END LOOP;
END $$;

-- ============ CONVERSÃO DE NOTA ============
CREATE OR REPLACE FUNCTION public.fn_converter_nota(_indicador_id uuid, _valor numeric)
RETURNS numeric LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _nota numeric;
BEGIN
  IF _valor IS NULL THEN RETURN NULL; END IF;
  SELECT f.nota INTO _nota
  FROM public.ppo_faixas_indicador f
  WHERE f.indicador_id = _indicador_id
    AND (f.limite_inferior IS NULL OR _valor >= f.limite_inferior)
    AND (f.limite_superior IS NULL OR _valor <= f.limite_superior)
  ORDER BY f.ordem
  LIMIT 1;
  RETURN _nota;
END;
$$;

-- ============ CÁLCULO DA AVALIAÇÃO ============
CREATE OR REPLACE FUNCTION public.fn_calcular_avaliacao(_avaliacao_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  a record; w record;
  n1 numeric; n2 numeric; n3 numeric; n4 numeric;
  final numeric; fx text; pct numeric;
BEGIN
  SELECT * INTO a FROM public.ppo_avaliacoes WHERE id = _avaliacao_id;
  IF a IS NULL THEN RETURN; END IF;

  SELECT p1, p2, p3, p4 INTO w FROM public.ppo_pesos_pilar
  WHERE (ciclo_id = a.ciclo_id OR ciclo_id IS NULL)
  ORDER BY (cargo_id IS NOT NULL AND cargo_id = a.cargo_id) DESC,
           (setor_id IS NOT NULL AND setor_id = a.setor_id) DESC,
           (ciclo_id IS NOT NULL) DESC, padrao DESC
  LIMIT 1;
  IF w IS NULL THEN w := ROW(50,25,15,10); END IF;

  SELECT
    ROUND(COALESCE(SUM(CASE WHEN pilar=1 THEN COALESCE(nota_manual,nota_convertida)*COALESCE(peso_aplicado,0) END)
      / NULLIF(SUM(CASE WHEN pilar=1 AND COALESCE(nota_manual,nota_convertida) IS NOT NULL THEN COALESCE(peso_aplicado,0) END),0), 0), 2),
    ROUND(COALESCE(SUM(CASE WHEN pilar=2 THEN COALESCE(nota_manual,nota_convertida)*COALESCE(peso_aplicado,0) END)
      / NULLIF(SUM(CASE WHEN pilar=2 AND COALESCE(nota_manual,nota_convertida) IS NOT NULL THEN COALESCE(peso_aplicado,0) END),0), 0), 2),
    ROUND(COALESCE(SUM(CASE WHEN pilar=3 THEN COALESCE(nota_manual,nota_convertida)*COALESCE(peso_aplicado,0) END)
      / NULLIF(SUM(CASE WHEN pilar=3 AND COALESCE(nota_manual,nota_convertida) IS NOT NULL THEN COALESCE(peso_aplicado,0) END),0), 0), 2),
    ROUND(COALESCE(SUM(CASE WHEN pilar=4 THEN COALESCE(nota_manual,nota_convertida)*COALESCE(peso_aplicado,0) END)
      / NULLIF(SUM(CASE WHEN pilar=4 AND COALESCE(nota_manual,nota_convertida) IS NOT NULL THEN COALESCE(peso_aplicado,0) END),0), 0), 2)
  INTO n1, n2, n3, n4
  FROM public.ppo_avaliacao_itens WHERE avaliacao_id = _avaliacao_id;

  final := ROUND((COALESCE(n1,0)*w.p1 + COALESCE(n2,0)*w.p2 + COALESCE(n3,0)*w.p3 + COALESCE(n4,0)*w.p4) / 100, 2);

  IF a.proporcional AND a.fator_proporcional IS NOT NULL THEN
    final := ROUND(final * a.fator_proporcional / 100, 2);
  END IF;

  IF NOT a.elegivel THEN
    fx := 'inelegivel'; pct := 0;
  ELSIF final >= 95 THEN fx := '95,00 a 100,00'; pct := 100;
  ELSIF final >= 90 THEN fx := '90,00 a 94,99'; pct := 90;
  ELSIF final >= 80 THEN fx := '80,00 a 89,99'; pct := 80;
  ELSIF final >= 70 THEN fx := '70,00 a 79,99'; pct := 70;
  ELSE fx := 'sem_reconhecimento'; pct := 0;
  END IF;

  UPDATE public.ppo_avaliacoes
  SET nota_p1 = n1, nota_p2 = n2, nota_p3 = n3, nota_p4 = n4,
      nota_final = final, faixa = fx, percentual_referencia = pct
  WHERE id = _avaliacao_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.ppo_itens_after_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.fn_calcular_avaliacao(COALESCE(NEW.avaliacao_id, OLD.avaliacao_id));
  RETURN NULL;
END;
$$;
CREATE TRIGGER trg_ppo_itens_calc AFTER INSERT OR UPDATE OR DELETE ON public.ppo_avaliacao_itens
FOR EACH ROW EXECUTE FUNCTION public.ppo_itens_after_change();

-- converte nota automaticamente ao gravar valor apurado
CREATE OR REPLACE FUNCTION public.ppo_itens_before_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ind record;
BEGIN
  SELECT pilar, peso INTO ind FROM public.ppo_indicadores WHERE id = NEW.indicador_id;
  IF ind IS NOT NULL THEN
    NEW.pilar := ind.pilar;
    IF NEW.peso_aplicado IS NULL THEN NEW.peso_aplicado := ind.peso; END IF;
  END IF;
  NEW.nota_convertida := public.fn_converter_nota(NEW.indicador_id, NEW.valor_apurado);
  NEW.nota_ponderada := ROUND(COALESCE(NEW.nota_manual, NEW.nota_convertida, 0) * COALESCE(NEW.peso_aplicado,0) / 100, 4);
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_ppo_itens_prep BEFORE INSERT OR UPDATE ON public.ppo_avaliacao_itens
FOR EACH ROW EXECUTE FUNCTION public.ppo_itens_before_change();

-- bloqueia alteração de itens de avaliação encerrada
CREATE OR REPLACE FUNCTION public.ppo_itens_bloqueio_encerrada()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE st text;
BEGIN
  SELECT status INTO st FROM public.ppo_avaliacoes WHERE id = COALESCE(NEW.avaliacao_id, OLD.avaliacao_id);
  IF st = 'encerrada' THEN
    RAISE EXCEPTION 'Avaliação encerrada: alteração permitida apenas por contestação deferida.';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;
CREATE TRIGGER trg_ppo_itens_bloqueio BEFORE UPDATE OR DELETE ON public.ppo_avaliacao_itens
FOR EACH ROW EXECUTE FUNCTION public.ppo_itens_bloqueio_encerrada();

-- ============ PRAZO EM DIAS ÚTEIS ============
CREATE OR REPLACE FUNCTION public.fn_prazo_contestacao(_data_comunicacao date, _dias integer DEFAULT 3)
RETURNS date LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE d date := _data_comunicacao; restantes integer := _dias;
BEGIN
  WHILE restantes > 0 LOOP
    d := d + 1;
    IF EXTRACT(ISODOW FROM d) < 6 AND NOT EXISTS (SELECT 1 FROM public.feriados f WHERE f.data = d) THEN
      restantes := restantes - 1;
    END IF;
  END LOOP;
  RETURN d;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fn_converter_nota(uuid, numeric), public.fn_calcular_avaliacao(uuid),
  public.fn_prazo_contestacao(date, integer) FROM anon;

-- ============ SEEDS ============
INSERT INTO public.ppo_pesos_pilar (p1,p2,p3,p4,padrao,justificativa)
VALUES (50,25,15,10,true,'Pesos padrão do procedimento PO-ADM-03 rev 01');

INSERT INTO public.ppo_setores (nome) VALUES
 ('Recursos Humanos – RH'),('Departamento Pessoal – DP'),('Financeiro'),('Contabilidade'),
 ('Compras e Suprimentos'),('Comercial / Faturamento'),('Qualidade / SGI'),
 ('Segurança do Trabalho / SESMT'),('Meio Ambiente'),('Planejamento e Controle da Manutenção – PCM'),
 ('Tecnologia da Informação – TI'),('Administrativo Geral'),('Recepção e Apoio');

INSERT INTO public.ppo_governanca (ordem, etapa, responsavel_perfil, validacao_perfil, registro) VALUES
 (1,'Definição dos indicadores','Gestor da área / RH','Gerência','Matriz de Indicadores'),
 (2,'Apuração dos resultados','Gestor imediato','Gerência','Planilha de apuração'),
 (3,'Indicadores de SST','SESMT','Gerência','Sistema / registro'),
 (4,'Consolidação','RH','Gerência','Relatório'),
 (5,'Validação final','Gerência','Diretoria (quando aplicável)','Relatório'),
 (6,'Comunicação','Gestor / RH','RH','Avaliação'),
 (7,'Contestação','RH / Gerência','Responsável definido','Formulário'),
 (8,'Processamento','DP','RH','Registro'),
 (9,'Auditoria','SGI','Diretoria','Relatório de auditoria');

INSERT INTO public.ppo_sla (setor_id, setor_nome, processo, sla_valor, sla_unidade, indicador_texto)
SELECT s.id, s.nome, v.processo, v.valor, v.unidade, v.ind
FROM (VALUES
 ('Recursos Humanos – RH','Atendimento interno','2','dias úteis','% dentro do SLA'),
 ('Recursos Humanos – RH','Processo admissional','3','dias úteis','% dentro do SLA'),
 ('Departamento Pessoal – DP','Programação de férias','30','dias de antecedência','% dentro do SLA'),
 ('Departamento Pessoal – DP','Benefícios','5','dias úteis','% dentro do SLA'),
 ('Financeiro','Pagamentos','conforme calendário','—','% dentro do SLA'),
 ('Financeiro','Conciliação','5','dias úteis','% dentro do SLA'),
 ('Financeiro','Atendimento interno','2','dias úteis','% dentro do SLA'),
 ('Compras e Suprimentos','Cotação','3','dias úteis','% dentro do SLA'),
 ('Compras e Suprimentos','Pedido de compra','2','dias úteis','% dentro do SLA'),
 ('Compras e Suprimentos','Atendimento de solicitação','5','dias úteis','% dentro do SLA'),
 ('Tecnologia da Informação – TI','Chamado crítico','4','horas','% dentro do SLA'),
 ('Tecnologia da Informação – TI','Chamado normal','2','dias úteis','% dentro do SLA'),
 ('Tecnologia da Informação – TI','Solicitações','5','dias úteis','% dentro do SLA')
) AS v(setor, processo, valor, unidade, ind)
JOIN public.ppo_setores s ON s.nome = v.setor;