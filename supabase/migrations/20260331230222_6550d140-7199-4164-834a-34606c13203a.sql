
-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create scheduled_broadcasts table
CREATE TABLE public.scheduled_broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  scheduled_at timestamptz NOT NULL,
  type text NOT NULL,
  message text,
  media_url text,
  caption text,
  link_url text,
  link_title text,
  link_description text,
  link_image text,
  group_phones text[] NOT NULL,
  mention_all boolean DEFAULT false,
  results jsonb DEFAULT '[]',
  sent_count integer DEFAULT 0,
  error_count integer DEFAULT 0,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.scheduled_broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Gestor manage scheduled_broadcasts" ON public.scheduled_broadcasts
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gestor'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gestor'));

-- Add updated_at trigger
CREATE TRIGGER handle_updated_at_scheduled_broadcasts
  BEFORE UPDATE ON public.scheduled_broadcasts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
