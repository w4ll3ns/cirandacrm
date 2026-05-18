-- Etapa 1: Limpeza e retenção de tabelas internas

-- 1. Deletar webhook_events antigos (>7 dias)
DELETE FROM public.webhook_events WHERE created_at < now() - interval '7 days';

-- 2. Função de limpeza para retenção periódica
CREATE OR REPLACE FUNCTION public.cleanup_internal_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.webhook_events WHERE created_at < now() - interval '7 days';
  DELETE FROM cron.job_run_details WHERE end_time < now() - interval '7 days';
  DELETE FROM net._http_response WHERE created < now() - interval '3 days';
END;
$$;

-- 3. Agendar limpeza semanal (domingo 03:00)
SELECT cron.schedule(
  'cleanup-internal-logs-weekly',
  '0 3 * * 0',
  $$ SELECT public.cleanup_internal_logs(); $$
);