ALTER TABLE public.ppo_avaliacoes
  ADD COLUMN IF NOT EXISTS observacao_nao_reconhecimento text,
  ADD COLUMN IF NOT EXISTS colaborador_ciente boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS colaborador_ciente_em timestamptz;