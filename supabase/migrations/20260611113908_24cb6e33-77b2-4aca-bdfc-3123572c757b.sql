
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cargo text,
  ADD COLUMN IF NOT EXISTS data_admissao date,
  ADD COLUMN IF NOT EXISTS setor_codigo text,
  ADD COLUMN IF NOT EXISTS setor_desc text,
  ADD COLUMN IF NOT EXISTS secao_codigo text,
  ADD COLUMN IF NOT EXISTS secao_desc text,
  ADD COLUMN IF NOT EXISTS depto text,
  ADD COLUMN IF NOT EXISTS funcao_completa text,
  ADD COLUMN IF NOT EXISTS area text;

-- Índice único parcial: ignora nulos/vazios
CREATE UNIQUE INDEX IF NOT EXISTS profiles_matricula_unique
  ON public.profiles (matricula)
  WHERE matricula IS NOT NULL AND matricula <> '';

-- Permite que admins/DP insiram profiles sem user_id (importação em massa)
ALTER TABLE public.profiles ALTER COLUMN user_id DROP NOT NULL;

-- Policy para admin/master inserir/atualizar perfis (importação)
DROP POLICY IF EXISTS "Admins manage all profiles" ON public.profiles;
CREATE POLICY "Admins manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (public.is_admin_or_higher(auth.uid()))
WITH CHECK (public.is_admin_or_higher(auth.uid()));
