
CREATE TABLE public.user_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module)
);

ALTER TABLE public.user_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own modules" ON public.user_modules
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all modules" ON public.user_modules
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage modules" ON public.user_modules
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
