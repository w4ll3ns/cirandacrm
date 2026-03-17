

# Fase 2: Migrar DataContext para Dados Reais

## Análise

O `DataContext` atual carrega dados mock e mantém estado local com `useState`. Ele é consumido por 14 componentes/páginas. Além disso, vários arquivos importam `usuarios` diretamente de `@/data/mock` para exibir nomes de atendentes internos.

### Mapeamento Tipos Frontend → Tabelas DB

| Frontend Type | DB Table | Diferenças de Schema |
|---|---|---|
| `Responsavel` | `responsaveis` | DB não tem `status_relacionamento`; usa `created_at`/`updated_at` ao invés de `criado_em`/`atualizado_em` |
| `Aluno` | `alunos` | DB usa `serie_interesse` ao invés de `serie_turma_interesse`; timestamps diferentes |
| `OportunidadeMatricula` | `oportunidades` | DB usa enums (`etapa_funil`, `origem_type`); `temperatura` é `text` no DB |
| `Conversa` | `conversations` | Schema completamente diferente: `assigned_user_id`, `canal`, `setor`, sem `historico_atendentes` inline |
| `Mensagem` | `messages` | Schema diferente: `content_text`, `direction`, `sender_type`, sem `texto`/`direcao`/`lida` |
| `Tarefa` | `tasks` | DB usa `due_date` ao invés de `data_hora`; `tipo` é `text`; timestamps diferentes |
| `UsuarioInterno` | `profiles` + `user_roles` | Completamente diferente |

## Estratégia

Reescrever `DataContext` para buscar dados reais do banco via Supabase SDK, com funções de mutação que fazem INSERT/UPDATE no banco e atualizam o estado local otimisticamente. Criar uma camada de mapeamento entre os tipos DB e os tipos frontend para minimizar mudanças nos componentes consumidores.

## Passos

### 1. Atualizar tipos TypeScript (`src/types/index.ts`)
Alinhar as interfaces com o schema real do banco:
- `Responsavel`: remover `status_relacionamento`, usar `created_at`/`updated_at`
- `Aluno`: renomear `serie_turma_interesse` → `serie_interesse`, ajustar timestamps
- `OportunidadeMatricula`: alinhar com colunas reais (`origem` como `origem_type`, etc.)
- Substituir `Conversa` por interface alinhada com `conversations` (sem `historico_atendentes` inline — isso vem de `conversation_assignments_history`)
- Substituir `Mensagem` por interface alinhada com `messages`
- `Tarefa`: usar `due_date`, `completed_at`, timestamps reais

### 2. Reescrever `DataContext` → `DataContext` com Supabase
- Carregar dados com `supabase.from('table').select()` no mount
- Cada `add*` faz `supabase.from('table').insert()` + atualiza estado local
- Cada `update*` faz `supabase.from('table').update()` + atualiza estado local
- Adicionar estados de loading/error
- Manter a mesma interface do contexto (com ajustes nos tipos)

### 3. Criar hook `useProfiles` para substituir `import { usuarios } from '@/data/mock'`
- Busca `profiles` + `user_roles` para listar usuários internos
- Usado em Pipeline (filtro por responsável), ConversationDetail (transferir, histórico), NewLeadForm, NewTaskForm

### 4. Atualizar todos os componentes consumidores
Ajustar referências de campos renomeados em ~14 arquivos:
- `r.whatsapp` → `r.whatsapp || r.telefone`
- `a.serie_turma_interesse` → `a.serie_interesse`
- `t.data_hora` → `t.due_date`
- `c.responsavel_interno_id` → `c.assigned_user_id`
- `c.historico_atendentes` → busca separada de `conversation_assignments_history`
- `m.texto` → `m.content_text`, `m.direcao` → `m.direction`, `m.enviada_em` → `m.sent_at`
- `o.criado_em` → `o.created_at`, `o.atualizado_em` → `o.updated_at`
- Substituir `import { usuarios } from '@/data/mock'` por `useProfiles()`

### 5. Remover `src/data/mock.ts`
Após migração completa, excluir o arquivo de dados mock.

## Arquivos Modificados/Criados

| Arquivo | Ação |
|---|---|
| `src/types/index.ts` | Alinhar interfaces com DB |
| `src/contexts/DataContext.tsx` | Reescrever com Supabase queries |
| `src/hooks/useProfiles.ts` | Criar (substituir mock usuarios) |
| `src/pages/Home.tsx` | Ajustar campos |
| `src/pages/Pipeline.tsx` | Ajustar campos + useProfiles |
| `src/pages/Contacts.tsx` | Ajustar campos |
| `src/pages/ContactDetail.tsx` | Ajustar campos |
| `src/pages/Conversations.tsx` | Ajustar campos + useProfiles |
| `src/pages/ConversationDetail.tsx` | Ajustar campos + useProfiles + assignments_history |
| `src/pages/OpportunityDetail.tsx` | Ajustar campos |
| `src/pages/Tasks.tsx` | Ajustar campos |
| `src/components/NewLeadForm.tsx` | Ajustar + useProfiles |
| `src/components/NewTaskForm.tsx` | Ajustar + useProfiles |
| `src/components/GlobalSearch.tsx` | Ajustar campos |
| `src/components/ReportsPanel.tsx` | Ajustar campos |
| `src/components/AppSidebar.tsx` | Ajustar campos |
| `src/components/BottomNav.tsx` | Ajustar campos |
| `src/data/mock.ts` | Deletar |

## Considerações
- O banco está vazio — a app vai iniciar sem dados, o que é correto para produção
- Loading states serão adicionados no DataContext para evitar flash de conteúdo vazio
- Mutações usam abordagem otimista (atualiza estado local + sync com DB)

