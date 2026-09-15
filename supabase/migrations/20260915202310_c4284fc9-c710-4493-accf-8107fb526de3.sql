ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'encarregado';

CREATE OR REPLACE FUNCTION public.can_approve_ferias(_approver uuid, _solicitante uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT public.is_gestor_or_higher(_approver) AND _approver <> _solicitante
$function$;