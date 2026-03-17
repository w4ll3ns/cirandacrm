

# Conversas: Auto-Leitura, Ações e Integração com Pipeline

## Problemas Identificados

### 1. Conversa não é marcada como lida ao abrir
Não existe nenhuma lógica para atualizar o status de `nao_lida` para `em_atendimento` quando o usuário abre uma conversa. O badge de não lida permanece indefinidamente.

### 2. "Vincular Oportunidade" não vincula — apenas navega
O modal mostra as oportunidades do responsável, mas ao clicar, apenas navega para `/app/oportunidades/:id`. Não atualiza `conversations.oportunidade_id`. O botão deveria realmente vincular a oportunidade à conversa.

### 3. "Resolver" não atualiza o pipeline
`markResolved` muda o status da conversa para `resolvida`, mas não interage com a oportunidade vinculada. Dependendo do fluxo, resolver uma conversa poderia avançar a etapa da oportunidade no pipeline.

### 4. Status `em_atendimento` nunca é utilizado
O tipo `ConversationStatus` inclui `em_atendimento`, mas nenhum fluxo define esse status. É o status natural quando um atendente abre a conversa.

### 5. Criar Tarefa — funcional, mas precisa de ajuste menor
O `NewTaskForm` recebe `defaultOportunidadeId` como `relOpps[0]?.id` (primeira oportunidade), mas deveria usar `conv.oportunidade_id` (a oportunidade vinculada à conversa) quando disponível.

### 6. Transferir — funcional
A ação de transferir está completa: registra histórico, atualiza `assigned_user_id` e mostra feedback.

## Plano de Implementação

### `src/pages/ConversationDetail.tsx`

**Auto-marcar como lida:**
- Adicionar `useEffect` que, ao montar ou trocar de `id`, verifica se `conv.status === 'nao_lida'` e chama `updateConversa(id, { status: 'em_atendimento' })`.

**Vincular Oportunidade (corrigir modal):**
- Mudar o comportamento do clique no modal: ao invés de navegar, chamar `updateConversa(conv.id, { oportunidade_id: o.id })` para vincular.
- Adicionar opção "Desvincular" quando já existe uma oportunidade vinculada.
- Manter um botão secundário "Ver detalhes" para navegação.

**Resolver com integração ao pipeline:**
- Ao resolver, se existir `conv.oportunidade_id`, perguntar se deseja avançar a etapa da oportunidade (ex: de `primeiro_contato` para `qualificado`).
- Implementar como um modal simples com as opções: "Apenas resolver conversa" ou "Resolver e avançar etapa".

**Criar Tarefa — ajuste:**
- Usar `conv.oportunidade_id` como `defaultOportunidadeId` quando disponível, com fallback para `relOpps[0]?.id`.

### `src/pages/Conversations.tsx`

**Auto-marcar ao selecionar (desktop):**
- No `handleSelect`, após setar `selectedId`, verificar se a conversa tem status `nao_lida` e atualizar para `em_atendimento`.

### Filtro de status

- Adicionar `em_atendimento` ao array `STATUS_FILTER` com label "Em atendimento" para que conversas nesse status sejam filtráveis.

## Resumo de Arquivos

| Arquivo | Mudança |
|---|---|
| `src/pages/ConversationDetail.tsx` | Auto-read, vincular oportunidade real, resolver com pipeline, ajuste criar tarefa |
| `src/pages/Conversations.tsx` | Adicionar filtro `em_atendimento`, auto-read no `handleSelect` |

