

# Corrigir Nome do Contato na Notificação + Adicionar Edição de Contato

## Problemas Identificados

### 1. Notificação mostra "Novo contato" ao invés do nome
No `DataContext.tsx` (linha 154), o dispatch do evento `new-inbound-message` faz `conversas.find(c => c.id === convId)`. Quando um **novo contato** manda mensagem, o webhook cria responsável + conversa + mensagem. O realtime captura o INSERT da mensagem, mas a **conversa ainda não está no state** (o INSERT da conversa chega por outro canal). Resultado: `conv` é `null`, `responsavelId` é `null`, toast mostra "Novo contato".

Além disso, não há realtime para a tabela `responsaveis` — se o webhook cria um novo responsável, ele nunca aparece no frontend até um reload.

### 2. Webhook não atualiza nome de contato existente
O webhook encontra o responsável existente mas não atualiza o `nome` com o `senderName` do payload (linha 125-129).

### 3. Sem edição de contato na conversa
O header mostra nome e telefone mas não permite editar.

## Plano

### `src/contexts/DataContext.tsx`
1. **Adicionar realtime para `responsaveis`** — INSERT e UPDATE, para que novos contatos criados pelo webhook apareçam automaticamente.
2. **Corrigir dispatch do evento**: Buscar `responsavel_id` diretamente da conversa no state, mas se não encontrar (conversa nova), buscar a conversa no banco via query rápida, ou simplesmente incluir `responsavelId` no próprio payload da mensagem. Solução mais simples: no evento INSERT de mensagem, se `conv` não existir no state, agendar um re-fetch da conversa e não emitir evento (a notificação virá pelo INSERT da conversa). Alternativamente, o mais pragmático: no handler de INSERT de `conversations`, se o status é `nao_lida`, disparar o evento de notificação a partir daí (já que sabemos o `responsavel_id` direto da conversa).

**Abordagem escolhida**: Mover o dispatch da notificação para o handler de INSERT de `conversations` quando `status === 'nao_lida'`. Buscar a última mensagem do `lastMessages` para o preview. Isso garante que a conversa e o responsável já estejam disponíveis.

### `supabase/functions/zapi-webhook/index.ts`
- Após encontrar responsável existente, se `payload.senderName` existe e o nome atual começa com "WhatsApp ", atualizar o nome.

### `src/pages/ConversationDetail.tsx`
- Adicionar botão "Editar Contato" (ícone de lápis) no header ou no menu de ações.
- Modal/drawer com campos: Nome, WhatsApp, Email, Origem.
- Salvar via `updateResponsavel`.

## Arquivos Afetados

| Arquivo | Mudança |
|---|---|
| `src/contexts/DataContext.tsx` | Realtime para responsaveis; mover dispatch de notificação para INSERT de conversations |
| `supabase/functions/zapi-webhook/index.ts` | Atualizar nome do responsável existente com senderName |
| `src/pages/ConversationDetail.tsx` | Adicionar modal de edição de contato |

