
-- Tabela ases
CREATE TABLE public.ases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  periodo_data DATE NOT NULL,
  cliente TEXT NOT NULL,
  centro_custo TEXT NOT NULL, -- '605' | '607' | '609'
  responsavel TEXT NOT NULL,
  lider_gestor TEXT,
  setor TEXT NOT NULL, -- 'ADM' | 'EMPILHADEIRA' | 'TRANSPORTE' | 'OUTRO'
  setor_outro TEXT,
  horario_inicio TIME NOT NULL,
  horario_fim TIME NOT NULL,
  atividades TEXT NOT NULL,
  observacao TEXT,
  status TEXT NOT NULL DEFAULT 'pendente', -- rascunho|pendente|aprovada|reprovada|lancada
  criado_por UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  aprovado_por UUID REFERENCES auth.users(id),
  aprovado_em TIMESTAMPTZ,
  reprovado_motivo TEXT,
  lancado_por UUID REFERENCES auth.users(id),
  lancado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ases TO authenticated;
GRANT ALL ON public.ases TO service_role;
ALTER TABLE public.ases ENABLE ROW LEVEL SECURITY;

-- Tabela ase_colaboradores
CREATE TABLE public.ase_colaboradores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ase_id UUID NOT NULL REFERENCES public.ases(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  matricula TEXT,
  nome TEXT NOT NULL,
  cargo TEXT,
  escala_sim BOOLEAN NOT NULL DEFAULT false,
  numero INT,
  vt BOOLEAN NOT NULL DEFAULT false,
  alimentacao BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ase_colab_ase ON public.ase_colaboradores(ase_id);
CREATE INDEX idx_ase_colab_user ON public.ase_colaboradores(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ase_colaboradores TO authenticated;
GRANT ALL ON public.ase_colaboradores TO service_role;
ALTER TABLE public.ase_colaboradores ENABLE ROW LEVEL SECURITY;

-- Trigger updated_at
CREATE TRIGGER trg_ases_updated_at
BEFORE UPDATE ON public.ases
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== Policies ases =====
-- SELECT: gestor+ e dp veem tudo; colaborador vê se aparece na lista; autor vê o próprio
CREATE POLICY "ASE select gestor/dp"
ON public.ases FOR SELECT TO authenticated
USING (
  public.is_gestor_or_higher(auth.uid())
  OR public.is_dp_or_higher(auth.uid())
);

CREATE POLICY "ASE select autor"
ON public.ases FOR SELECT TO authenticated
USING (criado_por = auth.uid());

CREATE POLICY "ASE select participante"
ON public.ases FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.ase_colaboradores c
  WHERE c.ase_id = ases.id AND c.user_id = auth.uid()
));

-- INSERT: gestor+ pode criar
CREATE POLICY "ASE insert gestor"
ON public.ases FOR INSERT TO authenticated
WITH CHECK (
  public.is_gestor_or_higher(auth.uid()) AND criado_por = auth.uid()
);

-- UPDATE: gestor+ pode tudo; autor pode editar enquanto pendente/rascunho
CREATE POLICY "ASE update gestor"
ON public.ases FOR UPDATE TO authenticated
USING (public.is_gestor_or_higher(auth.uid()) OR public.is_dp_or_higher(auth.uid()))
WITH CHECK (public.is_gestor_or_higher(auth.uid()) OR public.is_dp_or_higher(auth.uid()));

CREATE POLICY "ASE update autor"
ON public.ases FOR UPDATE TO authenticated
USING (criado_por = auth.uid() AND status IN ('rascunho','pendente'))
WITH CHECK (criado_por = auth.uid());

-- DELETE: gestor+ ou autor enquanto pendente/rascunho
CREATE POLICY "ASE delete gestor"
ON public.ases FOR DELETE TO authenticated
USING (public.is_admin_or_higher(auth.uid()));

CREATE POLICY "ASE delete autor"
ON public.ases FOR DELETE TO authenticated
USING (criado_por = auth.uid() AND status IN ('rascunho','pendente'));

-- ===== Policies ase_colaboradores =====
CREATE POLICY "ASE colab select gestor/dp"
ON public.ase_colaboradores FOR SELECT TO authenticated
USING (
  public.is_gestor_or_higher(auth.uid())
  OR public.is_dp_or_higher(auth.uid())
  OR user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.ases a WHERE a.id = ase_id AND a.criado_por = auth.uid())
);

CREATE POLICY "ASE colab modify gestor"
ON public.ase_colaboradores FOR ALL TO authenticated
USING (
  public.is_gestor_or_higher(auth.uid())
  OR EXISTS (SELECT 1 FROM public.ases a WHERE a.id = ase_id AND a.criado_por = auth.uid() AND a.status IN ('rascunho','pendente'))
)
WITH CHECK (
  public.is_gestor_or_higher(auth.uid())
  OR EXISTS (SELECT 1 FROM public.ases a WHERE a.id = ase_id AND a.criado_por = auth.uid() AND a.status IN ('rascunho','pendente'))
);
