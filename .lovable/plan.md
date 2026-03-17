

# Fase 1: Banco de Dados + Autenticação — CirandaCRM Backend

## Pré-requisito
Conectar o projeto Supabase externo ao Lovable usando o conector Supabase.

## O que será entregue nesta fase

### 1. Migration SQL principal
Uma migration criando toda a estrutura do banco:

**Enums (8):**
- `app_role` (admin, atendente, gestor)
- `canal_type`, `conversation_status`, `setor_type`
- `sender_type`, `message_direction`, `message_type`, `message_status`
- `task_status`, `task_priority`
- `etapa_funil`, `origem_type`, `oportunidade_status`
- `queue_status`

**Tabelas (15):**
1. `profiles` (id → auth.users, name, email, active, timestamps)
2. `user_roles` (user_id, role, unique constraint)
3. `responsaveis` (nome, telefone, email, cpf, observacoes)
4. `alunos` (nome, data_nascimento, serie_interesse, unidade_interesse, FK responsavel)
5. `oportunidades` (FK responsavel, FK aluno nullable, etapa_funil, origem, status, valor_estimado)
6. `conversations` (FK responsavel, FK oportunidade nullable, canal, telefone, status, setor, FK assigned_user, ultima_mensagem_em)
7. `messages` (FK conversation, sender_type, direction, type, content_text, media fields, external_message_id, status, timestamps de delivery)
8. `conversation_assignments_history` (FK conversation, previous/new user, changed_by, motivo)
9. `tasks` (titulo, descricao, status, prioridade, due_date, FKs opcionais)
10. `zapi_instances` (nome_instancia, instance_id, token, client_token, phone_number, status, connected)
11. `webhook_events` (provider, event_type, external_event_id, payload_json, processed)
12. `automation_rules` (nome, gatilho, ativo, configuracao_json)
13. `settings` (chave unique, valor, descricao)
14. `audit_logs` (user_id, action, entity, entity_id, details_json)
15. `message_queue` (message_id, queue_type, payload_json, status, attempts, last_error)

**Triggers:**
- `updated_at` automático em todas as tabelas relevantes
- Auto-criação de `profiles` quando novo usuário se cadastra no auth.users
- Índices em FKs, telefone, external_message_id, status fields

### 2. Funções SQL auxiliares
- `has_role(uuid, app_role)` — SECURITY DEFINER para RLS sem recursão
- `current_user_role()` — retorna role do usuário logado
- `handle_new_user()` — trigger function para criar profile
- `handle_updated_at()` — trigger function genérica

### 3. RLS Policies
Todas as tabelas com RLS habilitado:
- **profiles**: usuário lê/edita o próprio; admin lê todos
- **user_roles**: somente admin gerencia; leitura própria
- **responsaveis, alunos, oportunidades, tasks**: admin acesso total; atendente/gestor leitura e edição
- **conversations, messages**: autenticados com acesso baseado em role
- **conversation_assignments_history**: leitura para autenticados, insert para admin/gestor
- **zapi_instances, webhook_events**: somente admin (credenciais protegidas)
- **audit_logs**: somente admin lê; service_role insere
- **settings**: leitura para autenticados; escrita para admin
- **automation_rules**: admin apenas
- **message_queue**: acesso restrito (edge functions via service_role)

### 4. Integração Supabase no Frontend
- Criar `src/integrations/supabase/client.ts` com o cliente configurado
- Criar `src/integrations/supabase/types.ts` com tipos gerados
- Atualizar `AuthContext` para usar Supabase Auth (email/senha, onAuthStateChange, getSession)
- Criar página de Login real com email/senha (mantendo layout atual)
- Criar `ProtectedRoute` baseado em sessão Supabase
- Manter `DataContext` mockado nesta fase (será migrado na Fase 2)

### 5. Seed inicial
Via SQL insert:
- Configurações padrão (etapas do funil, setores)
- Será necessário criar um usuário admin manualmente no Supabase Auth + inserir role

## O que NÃO está nesta fase
- Edge Functions (Fase 2)
- Migração do DataContext para dados reais (Fase 2)
- Integração Z-API (Fase 3)
- Webhooks e filas (Fase 3)
- Storage de mídias (Fase 3)

## Próximo passo
Conectar o projeto Supabase externo ao Lovable para que eu possa criar as migrations e configurar o cliente.

