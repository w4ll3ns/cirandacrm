
-- Table: community_campaigns
CREATE TABLE public.community_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  imagem_url text,
  cor_primaria text NOT NULL DEFAULT '#8B5CF6',
  cor_fundo text NOT NULL DEFAULT '#FFFFFF',
  slug text NOT NULL UNIQUE,
  ativa boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table: campaign_groups
CREATE TABLE public.campaign_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.community_campaigns(id) ON DELETE CASCADE,
  community_id text NOT NULL,
  community_name text NOT NULL,
  group_phone text NOT NULL,
  group_name text NOT NULL,
  max_participants integer NOT NULL DEFAULT 1000,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.community_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_groups ENABLE ROW LEVEL SECURITY;

-- RLS: community_campaigns
CREATE POLICY "Public can view active campaigns" ON public.community_campaigns
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admin can manage campaigns" ON public.community_campaigns
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- RLS: campaign_groups
CREATE POLICY "Public can view campaign groups" ON public.campaign_groups
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admin can manage campaign groups" ON public.campaign_groups
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE TRIGGER handle_updated_at_community_campaigns
  BEFORE UPDATE ON public.community_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
