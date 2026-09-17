CREATE POLICY "PPO evidencias leitura interna"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'ppo-evidencias' AND (public.ppo_can_read_param(auth.uid()) OR public.ppo_is_lideranca(auth.uid()) OR public.ppo_is_rh(auth.uid()) OR public.ppo_is_auditor(auth.uid())));

CREATE POLICY "PPO evidencias envio"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'ppo-evidencias' AND (public.ppo_is_lideranca(auth.uid()) OR public.ppo_is_rh(auth.uid()) OR public.ppo_is_sesmt(auth.uid()) OR public.ppo_can_admin(auth.uid())));

CREATE POLICY "PPO evidencias atualizacao"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'ppo-evidencias' AND (public.ppo_is_lideranca(auth.uid()) OR public.ppo_is_rh(auth.uid()) OR public.ppo_can_admin(auth.uid())));