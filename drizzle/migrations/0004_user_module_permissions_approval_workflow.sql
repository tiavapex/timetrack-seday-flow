CREATE TABLE public.user_module_permissions(user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE, module text NOT NULL CHECK(module IN ('dashboard','horas_extras','colaboradores','ferias','vagas','ppo','qp','dp','integracoes','relatorios','usuarios')), enabled boolean NOT NULL, updated_by uuid, updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,module));
GRANT SELECT ON public.user_module_permissions TO authenticated;
GRANT ALL ON public.user_module_permissions TO service_role;
ALTER TABLE public.user_module_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY permissions_read ON public.user_module_permissions FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.is_admin_or_higher(auth.uid()));
CREATE OR REPLACE FUNCTION public.can_access_module(p_user uuid,p_module text) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$ DECLARE override_value boolean; BEGIN
 IF p_user IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE user_id=p_user AND ativo) THEN RETURN false; END IF;
 IF public.is_admin_or_higher(p_user) THEN RETURN true; END IF;
 IF p_module='usuarios' OR (public.has_role(p_user,'dp') AND p_module='vagas') THEN RETURN false; END IF;
 SELECT enabled INTO override_value FROM public.user_module_permissions WHERE user_id=p_user AND module=p_module;
 IF FOUND THEN RETURN override_value; END IF;
 IF public.has_role(p_user,'dp') THEN RETURN p_module<>'vagas'; END IF;
 IF public.ppo_is_lideranca(p_user) THEN RETURN p_module NOT IN ('integracoes','dp'); END IF;
 IF public.has_role(p_user,'rh') THEN RETURN p_module IN ('dashboard','vagas','colaboradores','relatorios','ppo'); END IF;
 IF public.has_role(p_user,'sesmt') THEN RETURN p_module IN ('dashboard','ppo','colaboradores','relatorios'); END IF;
 RETURN p_module IN ('dashboard','horas_extras','ppo'); END $$;
REVOKE ALL ON FUNCTION public.can_access_module(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.can_access_module(uuid,text) TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.set_user_permissions(p_user uuid,p_permissions jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE k text; BEGIN
 IF NOT public.is_admin_or_higher(auth.uid()) THEN RAISE EXCEPTION 'Acesso administrativo obrigatório'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE user_id=p_user) THEN RAISE EXCEPTION 'Usuário não encontrado'; END IF;
 IF public.is_admin_or_higher(p_user) AND NOT public.has_role(auth.uid(),'master') THEN RAISE EXCEPTION 'Somente Master altera administradores'; END IF;
 IF jsonb_typeof(p_permissions)<>'object' THEN RAISE EXCEPTION 'Permissões inválidas'; END IF;
 FOR k IN SELECT jsonb_object_keys(p_permissions) LOOP
 IF k NOT IN ('dashboard','horas_extras','colaboradores','ferias','vagas','ppo','qp','dp','integracoes','relatorios','usuarios') OR jsonb_typeof(p_permissions->k)<>'boolean' THEN RAISE EXCEPTION 'Permissão inválida'; END IF;
 IF k='usuarios' AND (p_permissions->>k)::boolean AND NOT public.is_admin_or_higher(p_user) THEN RAISE EXCEPTION 'Gestão de usuários é administrativa'; END IF;
 IF k='vagas' AND (p_permissions->>k)::boolean AND public.has_role(p_user,'dp') AND NOT public.is_admin_or_higher(p_user) THEN RAISE EXCEPTION 'DP não acessa vagas'; END IF;
 END LOOP;
 DELETE FROM public.user_module_permissions WHERE user_id=p_user;
 INSERT INTO public.user_module_permissions(user_id,module,enabled,updated_by) SELECT p_user,key,value::boolean,auth.uid() FROM jsonb_each_text(p_permissions);
 END $$;
REVOKE ALL ON FUNCTION public.set_user_permissions(uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.set_user_permissions(uuid,jsonb) TO authenticated;
ALTER TABLE public.horas_extras ADD COLUMN criado_por uuid DEFAULT auth.uid(), ADD COLUMN colaborador_id uuid REFERENCES public.profiles(id);
UPDATE public.horas_extras SET criado_por=user_id WHERE criado_por IS NULL;
ALTER TABLE public.ferias_solicitacoes ADD COLUMN colaborador_id uuid REFERENCES public.profiles(id);
ALTER TABLE public.vagas ADD COLUMN aprovado_por uuid, ADD COLUMN aprovado_em timestamptz;
ALTER TABLE public.qp_solicitacoes ADD COLUMN aprovado_por uuid, ADD COLUMN aprovado_em timestamptz;
ALTER TABLE public.ppc_avaliacoes ADD COLUMN status text NOT NULL DEFAULT 'rascunho', ADD COLUMN aprovado_por uuid, ADD COLUMN aprovado_em timestamptz;
ALTER TABLE public.ppo_motoristas_turnos ADD COLUMN status text NOT NULL DEFAULT 'pendente', ADD COLUMN aprovado_por uuid, ADD COLUMN aprovado_em timestamptz;
CREATE POLICY profiles_workflow_read ON public.profiles FOR SELECT TO authenticated USING(public.can_access_module(auth.uid(),'colaboradores') OR public.ppo_is_lideranca(auth.uid()) OR public.ppo_is_rh(auth.uid()) OR public.ppo_is_sesmt(auth.uid()));
DROP POLICY "DP can view all overtime records" ON public.horas_extras;
DROP POLICY "DP can mark overtime as launched in ERP" ON public.horas_extras;
CREATE POLICY overtime_dp_read ON public.horas_extras FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'dp') AND status='aprovado');
CREATE POLICY overtime_dp_update ON public.horas_extras FOR UPDATE TO authenticated USING(public.has_role(auth.uid(),'dp') AND status='aprovado') WITH CHECK(status='aprovado');
CREATE POLICY overtime_supervisor_read ON public.horas_extras FOR SELECT TO authenticated USING(criado_por=auth.uid() AND public.ppo_is_lideranca(auth.uid()));
CREATE POLICY overtime_supervisor_create ON public.horas_extras FOR INSERT TO authenticated WITH CHECK(public.ppo_is_lideranca(auth.uid()) AND criado_por=auth.uid() AND status='pendente');
DROP POLICY vagas_insert_gestor ON public.vagas;
DROP POLICY vagas_select_gestor ON public.vagas;
DROP POLICY vagas_update_rh ON public.vagas;
CREATE POLICY vagas_create ON public.vagas FOR INSERT TO authenticated WITH CHECK(public.ppo_is_lideranca(auth.uid()) AND criado_por=auth.uid() AND status='pendente_aprovacao');
CREATE POLICY vagas_read ON public.vagas FOR SELECT TO authenticated USING(public.is_gestor_or_higher(auth.uid()) OR criado_por=auth.uid() OR (public.has_role(auth.uid(),'rh') AND (aprovado_em IS NOT NULL OR status IN ('aprovada','congelada','fechada'))));
CREATE POLICY vagas_update ON public.vagas FOR UPDATE TO authenticated USING(public.is_gestor_or_higher(auth.uid()) OR (public.has_role(auth.uid(),'rh') AND aprovado_em IS NOT NULL));
DROP POLICY vaga_cand_modify ON public.vaga_candidatos;
DROP POLICY vaga_cv_modify ON public.vaga_curriculos;
CREATE POLICY vaga_cand_rh ON public.vaga_candidatos FOR ALL TO authenticated USING(public.is_admin_or_higher(auth.uid()) OR (public.has_role(auth.uid(),'rh') AND EXISTS(SELECT 1 FROM public.vagas WHERE id=vaga_id AND aprovado_em IS NOT NULL))) WITH CHECK(public.is_admin_or_higher(auth.uid()) OR (public.has_role(auth.uid(),'rh') AND EXISTS(SELECT 1 FROM public.vagas WHERE id=vaga_id AND aprovado_em IS NOT NULL)));
CREATE POLICY vaga_cv_rh ON public.vaga_curriculos FOR ALL TO authenticated USING(public.is_admin_or_higher(auth.uid()) OR (public.has_role(auth.uid(),'rh') AND EXISTS(SELECT 1 FROM public.vagas WHERE id=vaga_id AND aprovado_em IS NOT NULL))) WITH CHECK(public.is_admin_or_higher(auth.uid()) OR (public.has_role(auth.uid(),'rh') AND EXISTS(SELECT 1 FROM public.vagas WHERE id=vaga_id AND aprovado_em IS NOT NULL)));
CREATE POLICY ferias_supervisor_create ON public.ferias_solicitacoes FOR INSERT TO authenticated WITH CHECK(public.ppo_is_lideranca(auth.uid()) AND criado_por=auth.uid() AND status='pendente');
CREATE POLICY qp_dp_update ON public.qp_solicitacoes FOR UPDATE TO authenticated USING(public.has_role(auth.uid(),'dp') AND status='aprovado') WITH CHECK(status IN ('aprovado','concluido'));
CREATE POLICY ppo_supervisor_read ON public.ppo_avaliacoes FOR SELECT TO authenticated USING(public.ppo_is_lideranca(auth.uid()));
CREATE POLICY ppo_supervisor_update ON public.ppo_avaliacoes FOR UPDATE TO authenticated USING(public.ppo_is_lideranca(auth.uid()) AND created_by=auth.uid() AND status IN ('rascunho','aguardando_gestor'));
DO $$ DECLARE t text; m text; BEGIN
 FOR t,m IN SELECT * FROM (VALUES ('horas_extras','horas_extras'),('ferias_solicitacoes','ferias'),('vagas','vagas'),('vaga_curriculos','vagas'),('vaga_candidatos','vagas'),('qp_solicitacoes','qp'),('ppc_avaliacoes','ppo'),('ppo_motoristas_turnos','ppo'),('ppo_avaliacoes','ppo'),('ppo_avaliacao_itens','ppo'),('ppo_operacional_avaliacoes','ppo'),('ppo_operacional_itens','ppo')) AS v(t,m) LOOP
 EXECUTE format('CREATE POLICY module_access ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING(public.can_access_module(auth.uid(),%L)) WITH CHECK(public.can_access_module(auth.uid(),%L))',t,m,m);
 END LOOP;
 FOR t IN SELECT unnest(ARRAY['horas_extras','ferias_solicitacoes','qp_solicitacoes','ppo_avaliacoes','ppc_avaliacoes','ppo_motoristas_turnos','ppo_operacional_avaliacoes']) LOOP
 EXECUTE format('CREATE POLICY dp_approved_only ON public.%I AS RESTRICTIVE FOR SELECT TO authenticated USING(NOT public.has_role(auth.uid(),''dp'') OR public.is_admin_or_higher(auth.uid()) OR status IN (''aprovado'',''aprovada'',''lancada'',''concluido'',''aguardando_validacao'',''validada'',''comunicada'',''em_contestacao'',''encerrada''))',t);
 END LOOP;
 END $$;
CREATE OR REPLACE FUNCTION public.guard_request_workflow() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ DECLARE n jsonb:=to_jsonb(NEW); o jsonb; approved boolean; BEGIN
 IF auth.uid() IS NULL THEN RETURN NEW; END IF;
 IF TG_OP='INSERT' THEN
 IF NOT public.is_admin_or_higher(auth.uid()) AND n->>'status' NOT IN ('pendente','pendente_aprovacao','rascunho','aguardando_gestor','em_apuracao') THEN RAISE EXCEPTION 'Solicitação deve aguardar aprovação'; END IF;
 IF (n->>'aprovado_por') IS NOT NULL OR (n->>'aprovado_em') IS NOT NULL THEN RAISE EXCEPTION 'Aprovação deve ser feita pelo gestor'; END IF;
 RETURN NEW; END IF;
 o:=to_jsonb(OLD);
 IF public.is_admin_or_higher(auth.uid()) THEN RETURN NEW; END IF;
 IF n->>'status' IS DISTINCT FROM o->>'status' THEN
 approved:=n->>'status' IN ('aprovado','aprovada','aguardando_validacao','reprovado','reprovada','rejeitado');
 IF approved AND NOT public.is_gestor_or_higher(auth.uid()) THEN RAISE EXCEPTION 'Somente gestor aprova solicitações'; END IF;
 IF approved AND coalesce(o->>'criado_por',o->>'created_by',o->>'user_id')=auth.uid()::text THEN RAISE EXCEPTION 'Não é permitido aprovar a própria solicitação'; END IF;
 IF NOT approved AND NOT public.is_gestor_or_higher(auth.uid()) AND NOT (public.has_role(auth.uid(),'dp') AND o->>'status' IN ('aprovada','aprovado') AND n->>'status' IN ('lancada','concluido')) AND NOT (public.has_role(auth.uid(),'rh') AND TG_TABLE_NAME='vagas' AND o->>'aprovado_em' IS NOT NULL AND n->>'status' IN ('congelada','cancelada','fechada','aprovada')) AND NOT (public.ppo_is_lideranca(auth.uid()) AND n->>'status' IN ('pendente','aguardando_gestor','rascunho')) AND NOT (public.ppo_is_rh(auth.uid()) AND TG_TABLE_NAME='ppo_avaliacoes' AND o->>'status' NOT IN ('rascunho','aguardando_gestor')) THEN RAISE EXCEPTION 'Transição não autorizada'; END IF;
 END IF;
 IF public.has_role(auth.uid(),'dp') AND (n-'lancado_erp'-'lancado_em'-'lancado_por'-'status'-'updated_at') IS DISTINCT FROM (o-'lancado_erp'-'lancado_em'-'lancado_por'-'status'-'updated_at') THEN RAISE EXCEPTION 'DP pode lançar somente solicitações aprovadas'; END IF;
 IF (n->>'aprovado_por' IS DISTINCT FROM o->>'aprovado_por' OR n->>'aprovado_em' IS DISTINCT FROM o->>'aprovado_em') AND NOT public.is_gestor_or_higher(auth.uid()) THEN RAISE EXCEPTION 'Aprovação exclusiva do gestor'; END IF;
 RETURN NEW; END $$;
DO $$ DECLARE t text; BEGIN FOR t IN SELECT unnest(ARRAY['horas_extras','ferias_solicitacoes','vagas','qp_solicitacoes','ppo_avaliacoes','ppo_motoristas_turnos','ppo_operacional_avaliacoes']) LOOP EXECUTE format('CREATE TRIGGER guard_workflow BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.guard_request_workflow()',t); END LOOP; END $$;
CREATE OR REPLACE FUNCTION public.decidir_solicitacao(p_tipo text,p_id uuid,p_aprovar boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE t text; m text; destino text; atual text; criador uuid; BEGIN
 IF NOT public.is_gestor_or_higher(auth.uid()) THEN RAISE EXCEPTION 'Somente gestor aprova'; END IF;
 SELECT v.t,v.m,v.destino INTO t,m,destino FROM (VALUES('horas_extras','horas_extras','horas_extras','aprovado'),('ferias','ferias_solicitacoes','ferias','aprovada'),('vagas','vagas','vagas','aprovada'),('qp','qp_solicitacoes','qp','aprovado'),('ppo','ppo_avaliacoes','ppo','aguardando_validacao'),('ppc','ppc_avaliacoes','ppo','aprovado'),('viagens','ppo_motoristas_turnos','ppo','aprovado')) AS v(tipo,t,m,destino) WHERE tipo=p_tipo;
 IF t IS NULL OR NOT public.can_access_module(auth.uid(),m) THEN RAISE EXCEPTION 'Módulo não autorizado'; END IF;
 EXECUTE format('SELECT status,coalesce((to_jsonb(r)->>''criado_por'')::uuid,(to_jsonb(r)->>''created_by'')::uuid) FROM public.%I r WHERE id=$1 FOR UPDATE',t) INTO atual,criador USING p_id;
 IF atual IS NULL OR atual NOT IN ('pendente','pendente_aprovacao','aguardando_gestor') THEN RAISE EXCEPTION 'Solicitação não está pendente'; END IF;
 IF criador=auth.uid() AND NOT public.is_admin_or_higher(auth.uid()) THEN RAISE EXCEPTION 'Não pode aprovar a própria solicitação'; END IF;
 IF NOT p_aprovar THEN destino:=CASE p_tipo WHEN 'horas_extras' THEN 'rejeitado' WHEN 'ferias' THEN 'reprovada' WHEN 'vagas' THEN 'cancelada' WHEN 'ppo' THEN 'rascunho' ELSE 'reprovado' END; END IF;
 IF p_tipo='ppo' THEN EXECUTE format('UPDATE public.%I SET status=$2 WHERE id=$1',t) USING p_id,destino;
 ELSE EXECUTE format('UPDATE public.%I SET status=$2,aprovado_por=$3,aprovado_em=now() WHERE id=$1',t) USING p_id,destino,auth.uid(); END IF;
 END $$;
REVOKE ALL ON FUNCTION public.decidir_solicitacao(text,uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.decidir_solicitacao(text,uuid,boolean) TO authenticated;