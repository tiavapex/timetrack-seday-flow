CREATE TABLE public.ppc_avaliacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id uuid NOT NULL REFERENCES public.profiles(id),
  periodo_inicio date NOT NULL,
  periodo_fim date NOT NULL,
  adm jsonb NOT NULL DEFAULT '{}'::jsonb,
  pts_seguranca numeric NOT NULL DEFAULT 40,
  pts_operacao numeric NOT NULL DEFAULT 60,
  observacao text,
  criado_por uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (colaborador_id, periodo_inicio),
  CONSTRAINT ppc_seg_chk CHECK (pts_seguranca BETWEEN 0 AND 40),
  CONSTRAINT ppc_op_chk CHECK (pts_operacao BETWEEN 0 AND 60)
);
GRANT SELECT, INSERT, UPDATE ON public.ppc_avaliacoes TO authenticated;
GRANT ALL ON public.ppc_avaliacoes TO service_role;
ALTER TABLE public.ppc_avaliacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ppc leitura" ON public.ppc_avaliacoes FOR SELECT TO authenticated
  USING (public.ppo_is_lideranca(auth.uid()) OR public.ppo_is_sesmt(auth.uid()) OR public.ppo_is_rh(auth.uid()) OR public.ppo_is_owner(colaborador_id));
CREATE POLICY "ppc insert" ON public.ppc_avaliacoes FOR INSERT TO authenticated
  WITH CHECK (public.ppo_is_lideranca(auth.uid()) OR public.ppo_is_sesmt(auth.uid()) OR public.ppo_is_rh(auth.uid()));
CREATE POLICY "ppc update" ON public.ppc_avaliacoes FOR UPDATE TO authenticated
  USING (public.ppo_is_lideranca(auth.uid()) OR public.ppo_is_sesmt(auth.uid()) OR public.ppo_is_rh(auth.uid()));
CREATE TRIGGER trg_ppc_upd BEFORE UPDATE ON public.ppc_avaliacoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();