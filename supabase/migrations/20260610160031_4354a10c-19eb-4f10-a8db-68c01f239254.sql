
ALTER TABLE public.avaliacoes_competencias
  ADD COLUMN IF NOT EXISTS area text,
  ADD COLUMN IF NOT EXISTS setor_codigo text,
  ADD COLUMN IF NOT EXISTS secao text;
