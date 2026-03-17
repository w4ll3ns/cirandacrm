
-- ======================== ENUMS ========================
CREATE TYPE public.app_role AS ENUM ('admin', 'atendente', 'gestor');
CREATE TYPE public.canal_type AS ENUM ('whatsapp', 'telefone', 'email', 'presencial', 'site', 'instagram', 'facebook');
CREATE TYPE public.conversation_status AS ENUM ('nao_lida', 'aguardando', 'em_atendimento', 'resolvida', 'arquivada');
CREATE TYPE public.setor_type AS ENUM ('comercial', 'secretaria', 'financeiro', 'pedagogico', 'direcao');
CREATE TYPE public.sender_type AS ENUM ('responsavel', 'sistema', 'usuario');
CREATE TYPE public.message_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE public.message_type AS ENUM ('text', 'image', 'audio', 'video', 'document', 'sticker', 'location', 'contact');
CREATE TYPE public.message_status AS ENUM ('pending', 'sent', 'delivered', 'read', 'failed');
CREATE TYPE public.task_status AS ENUM ('pendente', 'em_andamento', 'concluida', 'cancelada');
CREATE TYPE public.task_priority AS ENUM ('baixa', 'media', 'alta', 'urgente');
CREATE TYPE public.etapa_funil AS ENUM ('novo_lead', 'primeiro_contato', 'qualificado', 'visita_agendada', 'proposta_valores', 'documentacao', 'matricula_fechada', 'perdido');
CREATE TYPE public.origem_type AS ENUM ('instagram', 'indicacao', 'google', 'site', 'panfleto', 'facebook', 'whatsapp', 'outro');
CREATE TYPE public.oportunidade_status AS ENUM ('aberta', 'ganha', 'perdida');
CREATE TYPE public.queue_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'dead_letter');

-- ======================== FUNCTION (no table deps) ========================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ======================== TABLES ========================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, email TEXT, phone TEXT, avatar_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE TABLE public.responsaveis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL, telefone TEXT NOT NULL, whatsapp TEXT, email TEXT, cpf TEXT, endereco TEXT, observacoes TEXT,
  origem public.origem_type DEFAULT 'outro', tags TEXT[] DEFAULT '{}',
  utm_source TEXT, utm_medium TEXT, utm_campaign TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL, data_nascimento DATE, serie_interesse TEXT, unidade_interesse TEXT,
  responsavel_id UUID NOT NULL REFERENCES public.responsaveis(id) ON DELETE CASCADE,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.oportunidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  responsavel_id UUID NOT NULL REFERENCES public.responsaveis(id) ON DELETE CASCADE,
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE SET NULL,
  etapa public.etapa_funil NOT NULL DEFAULT 'novo_lead',
  temperatura TEXT DEFAULT 'morno' CHECK (temperatura IN ('quente', 'morno', 'frio')),
  origem public.origem_type DEFAULT 'outro',
  status public.oportunidade_status NOT NULL DEFAULT 'aberta',
  valor_estimado NUMERIC(10,2),
  responsavel_interno_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  motivo_perda TEXT, proximo_followup_em TIMESTAMPTZ, notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  responsavel_id UUID NOT NULL REFERENCES public.responsaveis(id) ON DELETE CASCADE,
  oportunidade_id UUID REFERENCES public.oportunidades(id) ON DELETE SET NULL,
  canal public.canal_type NOT NULL DEFAULT 'whatsapp', telefone TEXT,
  status public.conversation_status NOT NULL DEFAULT 'nao_lida',
  setor public.setor_type DEFAULT 'comercial',
  assigned_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ultima_mensagem_em TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_type public.sender_type NOT NULL, direction public.message_direction NOT NULL,
  type public.message_type NOT NULL DEFAULT 'text',
  content_text TEXT, media_url TEXT, media_mime_type TEXT, media_filename TEXT,
  external_message_id TEXT, status public.message_status NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ, delivered_at TIMESTAMPTZ, read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.conversation_assignments_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  previous_user_id UUID REFERENCES auth.users(id), new_user_id UUID REFERENCES auth.users(id),
  changed_by UUID REFERENCES auth.users(id), motivo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL, descricao TEXT, tipo TEXT DEFAULT 'followup',
  status public.task_status NOT NULL DEFAULT 'pendente',
  prioridade public.task_priority NOT NULL DEFAULT 'media',
  due_date TIMESTAMPTZ,
  responsavel_interno_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  responsavel_id UUID REFERENCES public.responsaveis(id) ON DELETE SET NULL,
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE SET NULL,
  oportunidade_id UUID REFERENCES public.oportunidades(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.zapi_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_instancia TEXT NOT NULL, instance_id TEXT NOT NULL, token TEXT NOT NULL,
  client_token TEXT, phone_number TEXT, status TEXT DEFAULT 'disconnected', connected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'zapi', event_type TEXT NOT NULL, external_event_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}', processed BOOLEAN DEFAULT false, error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL, gatilho TEXT NOT NULL, ativo BOOLEAN DEFAULT true,
  configuracao JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave TEXT NOT NULL UNIQUE, valor TEXT, descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, entity TEXT NOT NULL, entity_id TEXT, details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.message_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  queue_type TEXT NOT NULL DEFAULT 'send', payload JSONB NOT NULL DEFAULT '{}',
  status public.queue_status NOT NULL DEFAULT 'pending',
  attempts INT DEFAULT 0, max_attempts INT DEFAULT 3, last_error TEXT, next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ======================== FUNCTIONS (with table deps) ========================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), NEW.email);
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- ======================== TRIGGERS ========================
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_responsaveis BEFORE UPDATE ON public.responsaveis FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_alunos BEFORE UPDATE ON public.alunos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_oportunidades BEFORE UPDATE ON public.oportunidades FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_conversations BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_tasks BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_zapi_instances BEFORE UPDATE ON public.zapi_instances FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_automation_rules BEFORE UPDATE ON public.automation_rules FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_settings BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_message_queue BEFORE UPDATE ON public.message_queue FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ======================== INDICES ========================
CREATE INDEX idx_responsaveis_telefone ON public.responsaveis(telefone);
CREATE INDEX idx_responsaveis_origem ON public.responsaveis(origem);
CREATE INDEX idx_alunos_responsavel ON public.alunos(responsavel_id);
CREATE INDEX idx_oportunidades_etapa ON public.oportunidades(etapa);
CREATE INDEX idx_oportunidades_status ON public.oportunidades(status);
CREATE INDEX idx_oportunidades_responsavel ON public.oportunidades(responsavel_id);
CREATE INDEX idx_oportunidades_responsavel_interno ON public.oportunidades(responsavel_interno_id);
CREATE INDEX idx_conversations_responsavel ON public.conversations(responsavel_id);
CREATE INDEX idx_conversations_status ON public.conversations(status);
CREATE INDEX idx_conversations_assigned ON public.conversations(assigned_user_id);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_messages_external_id ON public.messages(external_message_id);
CREATE INDEX idx_messages_status ON public.messages(status);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_responsavel_interno ON public.tasks(responsavel_interno_id);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_webhook_events_processed ON public.webhook_events(processed);
CREATE INDEX idx_webhook_events_external_id ON public.webhook_events(external_event_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity, entity_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_message_queue_status ON public.message_queue(status);
CREATE INDEX idx_settings_chave ON public.settings(chave);

-- ======================== RLS ========================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oportunidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_assignments_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zapi_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_queue ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- user_roles
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- responsaveis
CREATE POLICY "Authenticated can view responsaveis" ON public.responsaveis FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert responsaveis" ON public.responsaveis FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update responsaveis" ON public.responsaveis FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete responsaveis" ON public.responsaveis FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- alunos
CREATE POLICY "Authenticated can view alunos" ON public.alunos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert alunos" ON public.alunos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update alunos" ON public.alunos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete alunos" ON public.alunos FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- oportunidades
CREATE POLICY "Authenticated can view oportunidades" ON public.oportunidades FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert oportunidades" ON public.oportunidades FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update oportunidades" ON public.oportunidades FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete oportunidades" ON public.oportunidades FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- conversations
CREATE POLICY "Authenticated can view conversations" ON public.conversations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert conversations" ON public.conversations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update conversations" ON public.conversations FOR UPDATE TO authenticated USING (true);

-- messages
CREATE POLICY "Authenticated can view messages" ON public.messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (true);

-- conversation_assignments_history
CREATE POLICY "Authenticated can view assignment history" ON public.conversation_assignments_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Gestor can insert assignment history" ON public.conversation_assignments_history FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor')
);

-- tasks
CREATE POLICY "Authenticated can view tasks" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update tasks" ON public.tasks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete tasks" ON public.tasks FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- admin-only tables
CREATE POLICY "Admins can manage zapi_instances" ON public.zapi_instances FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view webhook_events" ON public.webhook_events FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage automation_rules" ON public.automation_rules FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view settings" ON public.settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage settings" ON public.settings FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view audit_logs" ON public.audit_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage message_queue" ON public.message_queue FOR ALL USING (public.has_role(auth.uid(), 'admin'));
