ALTER TABLE public.ppc_avaliacoes ADD COLUMN seguranca_itens jsonb, ADD COLUMN operacao_itens jsonb;
CREATE OR REPLACE FUNCTION public.salvar_ppc_area(p_colaborador uuid, p_inicio date, p_area text, p_adm jsonb, p_itens jsonb, p_observacao text DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE permitido boolean; ch text; fim date;
BEGIN
 permitido := CASE p_area WHEN 'operacional' THEN public.ppo_is_lideranca(auth.uid()) WHEN 'seguranca' THEN public.ppo_is_sesmt(auth.uid()) WHEN 'rh' THEN public.ppo_is_rh(auth.uid()) WHEN 'geral' THEN public.ppo_is_rh(auth.uid()) ELSE false END;
 IF auth.uid() IS NULL OR NOT permitido THEN RAISE EXCEPTION 'Área não autorizada'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=p_colaborador AND cliente='Gerdau' AND cargo='MOT CARRETEIRO') THEN RAISE EXCEPTION 'Colaborador fora do contrato'; END IF;
 IF extract(day from p_inicio)<>26 THEN RAISE EXCEPTION 'Período inválido'; END IF;
 fim := (p_inicio + interval '1 month' - interval '1 day')::date;
 FOR ch IN SELECT jsonb_object_keys(coalesce(p_adm,'{}')) LOOP
 IF NOT ((p_area='operacional' AND ch IN ('1.1.operacional','1.2','1.5')) OR (p_area='rh' AND ch='1.1.rh') OR (p_area='seguranca' AND ch IN ('1.3','1.4','1.6'))) OR jsonb_typeof(p_adm->ch)<>'boolean' THEN RAISE EXCEPTION 'Item administrativo inválido'; END IF;
 END LOOP;
 IF p_area IN ('seguranca','operacional') THEN
 FOR ch IN SELECT jsonb_object_keys(coalesce(p_itens,'{}')) LOOP
 IF p_area='seguranca' THEN
 IF ch IN ('2.1','2.2','2.3','2.4') THEN IF jsonb_typeof(p_itens->ch)<>'boolean' THEN RAISE EXCEPTION 'Resposta inválida'; END IF;
 ELSIF ch='incidente' THEN IF NOT ((p_itens->>ch) IN ('nenhum','baixo','medio','alto')) THEN RAISE EXCEPTION 'Classificação inválida'; END IF;
 ELSE RAISE EXCEPTION 'Item inválido'; END IF;
 ELSE
 IF ch IN ('3.1','3.2','3.3','3.4','3.5') THEN IF jsonb_typeof(p_itens->ch)<>'boolean' THEN RAISE EXCEPTION 'Resposta inválida'; END IF;
 ELSIF ch='dano' THEN IF jsonb_typeof(p_itens->ch)<>'number' OR (p_itens->>ch)::numeric<0 THEN RAISE EXCEPTION 'Dano inválido'; END IF;
 ELSE RAISE EXCEPTION 'Item inválido'; END IF;
 END IF;
 END LOOP;
 END IF;
 INSERT INTO public.ppc_avaliacoes(colaborador_id,periodo_inicio,periodo_fim,criado_por) VALUES(p_colaborador,p_inicio,fim,auth.uid()) ON CONFLICT(colaborador_id,periodo_inicio) DO NOTHING;
 PERFORM 1 FROM public.ppc_avaliacoes WHERE colaborador_id=p_colaborador AND periodo_inicio=p_inicio FOR UPDATE;
 UPDATE public.ppc_avaliacoes SET adm=adm||coalesce(p_adm,'{}'), seguranca_itens=CASE WHEN p_area='seguranca' THEN coalesce(p_itens,'{}') ELSE seguranca_itens END, operacao_itens=CASE WHEN p_area='operacional' THEN coalesce(p_itens,'{}') ELSE operacao_itens END, observacao=CASE WHEN p_area='geral' THEN p_observacao ELSE observacao END WHERE colaborador_id=p_colaborador AND periodo_inicio=p_inicio;
END $$;
REVOKE ALL ON FUNCTION public.salvar_ppc_area(uuid,date,text,jsonb,jsonb,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.salvar_ppc_area(uuid,date,text,jsonb,jsonb,text) TO authenticated;
REVOKE INSERT,UPDATE ON public.ppc_avaliacoes FROM authenticated;
CREATE TABLE public.ppo_motoristas_turnos(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), colaborador_id uuid NOT NULL REFERENCES public.profiles(id), data date NOT NULL, turno text NOT NULL CHECK(length(trim(turno))>0), viagens integer NOT NULL DEFAULT 0 CHECK(viagens>=0), meias_viagens integer NOT NULL DEFAULT 0 CHECK(meias_viagens>=0), tara boolean NOT NULL DEFAULT false, observacao text, criado_por uuid NOT NULL DEFAULT auth.uid(), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(colaborador_id,data,turno));
GRANT SELECT,INSERT,UPDATE,DELETE ON public.ppo_motoristas_turnos TO authenticated;
GRANT ALL ON public.ppo_motoristas_turnos TO service_role;
ALTER TABLE public.ppo_motoristas_turnos ENABLE ROW LEVEL SECURITY;
CREATE POLICY motoristas_turnos_leitura ON public.ppo_motoristas_turnos FOR SELECT TO authenticated USING(public.ppo_is_lideranca(auth.uid()) OR public.ppo_is_rh(auth.uid()) OR public.ppo_is_owner(colaborador_id));
CREATE POLICY motoristas_turnos_inserir ON public.ppo_motoristas_turnos FOR INSERT TO authenticated WITH CHECK(public.ppo_is_lideranca(auth.uid()) AND criado_por=auth.uid() AND EXISTS(SELECT 1 FROM public.profiles WHERE id=colaborador_id AND cliente='Gerdau' AND cargo='MOT CARRETEIRO'));
CREATE POLICY motoristas_turnos_atualizar ON public.ppo_motoristas_turnos FOR UPDATE TO authenticated USING(public.ppo_is_lideranca(auth.uid())) WITH CHECK(public.ppo_is_lideranca(auth.uid()) AND EXISTS(SELECT 1 FROM public.profiles WHERE id=colaborador_id AND cliente='Gerdau' AND cargo='MOT CARRETEIRO'));
CREATE POLICY motoristas_turnos_excluir ON public.ppo_motoristas_turnos FOR DELETE TO authenticated USING(public.ppo_is_lideranca(auth.uid()));
CREATE TRIGGER motoristas_turnos_updated BEFORE UPDATE ON public.ppo_motoristas_turnos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();