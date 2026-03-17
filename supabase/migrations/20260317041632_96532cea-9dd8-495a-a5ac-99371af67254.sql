
-- Flow status enum
CREATE TYPE public.flow_status AS ENUM ('draft', 'active', 'inactive');

-- Flow session status enum
CREATE TYPE public.flow_session_status AS ENUM ('running', 'paused', 'finished', 'failed', 'transferred');

-- Flow trigger type enum
CREATE TYPE public.flow_trigger_type AS ENUM ('new_conversation', 'first_message', 'keyword', 'no_assignee', 'business_hours', 'specific_sector');

-- Flow node type enum
CREATE TYPE public.flow_node_type AS ENUM ('start', 'send_message', 'question_options', 'capture_input', 'condition', 'route_sector', 'assign_agent', 'transfer_human', 'update_field', 'create_task', 'end');

-- 1. conversation_flows
CREATE TABLE public.conversation_flows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  status flow_status NOT NULL DEFAULT 'draft',
  ativo BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  trigger_type flow_trigger_type NOT NULL DEFAULT 'new_conversation',
  trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  canal canal_type,
  setor setor_type,
  instancia_id UUID REFERENCES public.zapi_instances(id),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. flow_nodes
CREATE TABLE public.flow_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id UUID NOT NULL REFERENCES public.conversation_flows(id) ON DELETE CASCADE,
  type flow_node_type NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  position_x DOUBLE PRECISION NOT NULL DEFAULT 0,
  position_y DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. flow_edges
CREATE TABLE public.flow_edges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id UUID NOT NULL REFERENCES public.conversation_flows(id) ON DELETE CASCADE,
  source_node_id UUID NOT NULL REFERENCES public.flow_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES public.flow_nodes(id) ON DELETE CASCADE,
  source_handle TEXT,
  condition_type TEXT,
  condition_value TEXT,
  priority_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. conversation_flow_sessions
CREATE TABLE public.conversation_flow_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  flow_id UUID NOT NULL REFERENCES public.conversation_flows(id),
  current_node_id UUID REFERENCES public.flow_nodes(id),
  status flow_session_status NOT NULL DEFAULT 'running',
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_input TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);

-- 5. flow_execution_logs
CREATE TABLE public.flow_execution_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.conversation_flow_sessions(id) ON DELETE CASCADE,
  flow_id UUID NOT NULL REFERENCES public.conversation_flows(id),
  node_id UUID REFERENCES public.flow_nodes(id),
  action TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'success',
  error_message TEXT,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. flow_versions
CREATE TABLE public.flow_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id UUID NOT NULL REFERENCES public.conversation_flows(id) ON DELETE CASCADE,
  version_number INT NOT NULL DEFAULT 1,
  snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.conversation_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_flow_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_versions ENABLE ROW LEVEL SECURITY;

-- RLS: conversation_flows
CREATE POLICY "Admin can manage flows" ON public.conversation_flows FOR ALL TO public USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Gestor can manage flows" ON public.conversation_flows FOR ALL TO public USING (has_role(auth.uid(), 'gestor'));
CREATE POLICY "Atendente can view flows" ON public.conversation_flows FOR SELECT TO authenticated USING (true);

-- RLS: flow_nodes
CREATE POLICY "Admin can manage flow_nodes" ON public.flow_nodes FOR ALL TO public USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Gestor can manage flow_nodes" ON public.flow_nodes FOR ALL TO public USING (has_role(auth.uid(), 'gestor'));
CREATE POLICY "Atendente can view flow_nodes" ON public.flow_nodes FOR SELECT TO authenticated USING (true);

-- RLS: flow_edges
CREATE POLICY "Admin can manage flow_edges" ON public.flow_edges FOR ALL TO public USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Gestor can manage flow_edges" ON public.flow_edges FOR ALL TO public USING (has_role(auth.uid(), 'gestor'));
CREATE POLICY "Atendente can view flow_edges" ON public.flow_edges FOR SELECT TO authenticated USING (true);

-- RLS: conversation_flow_sessions
CREATE POLICY "Authenticated can view sessions" ON public.conversation_flow_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert sessions" ON public.conversation_flow_sessions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update sessions" ON public.conversation_flow_sessions FOR UPDATE TO authenticated USING (true);

-- RLS: flow_execution_logs
CREATE POLICY "Authenticated can view logs" ON public.flow_execution_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert logs" ON public.flow_execution_logs FOR INSERT TO authenticated WITH CHECK (true);

-- RLS: flow_versions
CREATE POLICY "Admin can manage versions" ON public.flow_versions FOR ALL TO public USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Gestor can manage versions" ON public.flow_versions FOR ALL TO public USING (has_role(auth.uid(), 'gestor'));
CREATE POLICY "Atendente can view versions" ON public.flow_versions FOR SELECT TO authenticated USING (true);

-- updated_at triggers
CREATE TRIGGER set_updated_at_conversation_flows BEFORE UPDATE ON public.conversation_flows FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at_flow_nodes BEFORE UPDATE ON public.flow_nodes FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at_conversation_flow_sessions BEFORE UPDATE ON public.conversation_flow_sessions FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Enable realtime for sessions (to track flow execution in UI)
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_flow_sessions;
