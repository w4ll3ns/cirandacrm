
CREATE TABLE public.community_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  name text,
  community_id text NOT NULL,
  community_name text,
  group_phone text,
  group_name text,
  campaign_id uuid REFERENCES public.community_campaigns(id) ON DELETE SET NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (phone, community_id, group_phone)
);

ALTER TABLE public.community_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view community_contacts"
  ON public.community_contacts FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage community_contacts"
  ON public.community_contacts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
