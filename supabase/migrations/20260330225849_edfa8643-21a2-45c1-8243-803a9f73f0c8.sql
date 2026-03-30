
CREATE TABLE public.community_disabled (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id text NOT NULL UNIQUE,
  disabled_at timestamptz NOT NULL DEFAULT now(),
  disabled_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.community_disabled ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view community_disabled"
  ON public.community_disabled FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin can manage community_disabled"
  ON public.community_disabled FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
