
-- 1. Create pipeline_stages table
CREATE TABLE public.pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  color text DEFAULT NULL,
  icon text DEFAULT NULL,
  is_final_win boolean NOT NULL DEFAULT false,
  is_final_loss boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies
CREATE POLICY "Admins can manage pipeline_stages"
  ON public.pipeline_stages FOR ALL
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view pipeline_stages"
  ON public.pipeline_stages FOR SELECT
  TO authenticated
  USING (true);

-- 4. updated_at trigger
CREATE TRIGGER handle_pipeline_stages_updated_at
  BEFORE UPDATE ON public.pipeline_stages
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- 5. Seed with current stages
INSERT INTO public.pipeline_stages (key, label, sort_order, is_final_win, is_final_loss) VALUES
  ('novo_lead', 'Novo Lead', 0, false, false),
  ('primeiro_contato', 'Primeiro Contato', 1, false, false),
  ('qualificado', 'Qualificado', 2, false, false),
  ('visita_agendada', 'Visita Agendada', 3, false, false),
  ('proposta_valores', 'Proposta/Valores', 4, false, false),
  ('documentacao', 'Documentação', 5, false, false),
  ('matricula_fechada', 'Matrícula Fechada', 6, true, false),
  ('perdido', 'Perdido', 7, false, true);

-- 6. Convert oportunidades.etapa from enum to text
ALTER TABLE public.oportunidades ALTER COLUMN etapa TYPE text USING etapa::text;
ALTER TABLE public.oportunidades ALTER COLUMN etapa SET DEFAULT 'novo_lead';
