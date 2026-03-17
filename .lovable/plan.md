

# Fase 1: Banco de Dados + Auth — Implementação

## Passo 1: Habilitar Lovable Cloud
Ativar o Lovable Cloud no projeto para provisionar banco PostgreSQL, Auth, Storage e Edge Functions.

## Passo 2: Migration SQL principal
Uma única migration criando toda a estrutura:

**Enums:** `app_role`, `canal_type`, `conversation_status`, `setor_type`, `sender_type`, `message_direction`, `message_type`, `message_status`, `task_status`, `task_priority`, `etapa_funil`, `origem_type`, `oportunidade_status`, `queue_status`

**15 tabelas** conforme especificado: profiles, user_roles, responsaveis, alunos, oportunidades, conversations, messages, conversation_assignments_history, tasks, zapi_instances, webhook_events, automation_rules, settings, audit_logs, message_queue

**Funções SQL:**
- `handle_updated_at()` — trigger genérico para updated_at
- `handle_new_user()` — cria profile automaticamente no signup
- `has_role(uuid, app_role)` — SECURITY DEFINER para RLS sem recursão

**Triggers:** updated_at em todas as tabelas relevantes + auto-criação de profile

**Índices:** FKs, telefone, external_message_id, status, etapa_funil, chave (settings)

## Passo 3: RLS Policies
- profiles: lê/edita próprio; admin lê todos
- user_roles: admin gerencia; leitura própria
- responsaveis/alunos/oportunidades/tasks: autenticados lêem e editam
- conversations/messages: autenticados com acesso por role
- zapi_instances/webhook_events/audit_logs: somente admin
- settings: leitura autenticados; escrita admin
- automation_rules/message_queue: admin apenas

## Passo 4: Seed inicial
Insert de configurações padrão (etapas do funil, setores, settings base).

## Passo 5: Frontend — Auth real
- Atualizar `AuthContext` para usar Supabase Auth (`signInWithPassword`, `signOut`, `onAuthStateChange`)
- Atualizar Login.tsx para formulário email/senha (mantendo layout visual)
- ProtectedRoute baseado em sessão Supabase
- Hook `useUserRole` para buscar role do usuário logado
- Manter DataContext mockado (migração na Fase 2)

## Passo 6: Tipos TypeScript
- Gerar/criar `src/integrations/supabase/types.ts` refletindo o schema
- Criar `src/integrations/supabase/client.ts`

## Arquivos que serão criados/modificados

| Arquivo | Ação |
|---|---|
| Migration SQL (via Lovable Cloud) | Criar |
| Seed SQL (via insert tool) | Criar |
| `src/integrations/supabase/client.ts` | Criar |
| `src/integrations/supabase/types.ts` | Criar |
| `src/contexts/AuthContext.tsx` | Reescrever para Supabase Auth |
| `src/pages/Login.tsx` | Adaptar para email/senha real |
| `src/hooks/useUserRole.ts` | Criar |
| `src/hooks/usePermissions.ts` | Adaptar para role real |
| `src/App.tsx` | Ajustar ProtectedRoute |

