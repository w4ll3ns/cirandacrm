

# Reenviar Mensagens com Status "Failed"

## Mudanças

### `src/pages/ConversationDetail.tsx`

1. **`MessageStatusIcon`** — tornar o ícone `failed` clicável: receber `onRetry` callback opcional, renderizar como `<button>` com tooltip "Reenviar" quando status é `failed`.

2. **`handleRetry(msg)`** — nova função que:
   - Chama `supabase.functions.invoke('zapi-send', { body: { conversation_id, message: msg.content_text, phone, retry_message_id: msg.id } })`
   - Mostra toast de erro se falhar
   - Usa um estado `retryingId` para mostrar spinner no ícone durante o retry

3. **Atualizar renderização das mensagens** — passar `onRetry` para `MessageStatusIcon` quando `msg.status === 'failed'`, e mostrar `Loader2` spinner quando `retryingId === msg.id`.

### `supabase/functions/zapi-send/index.ts`

4. **Suportar `retry_message_id`** — quando presente no body, ao invés de inserir nova mensagem, atualizar o status da mensagem existente para `sent`/`pending` e reenviar via Z-API. Isso evita mensagens duplicadas.

### Migration SQL

5. **RLS policy UPDATE em messages** — adicionar policy para que authenticated users possam atualizar mensagens (necessário para o edge function atualizar status via service role, mas já usa service role key então não precisa). Verificar se o edge function já usa `SUPABASE_SERVICE_ROLE_KEY` — sim, já usa, então não precisa de migration.

## Arquivos

| Arquivo | Ação |
|---|---|
| `src/pages/ConversationDetail.tsx` | Retry UI + handleRetry |
| `supabase/functions/zapi-send/index.ts` | Suportar retry_message_id |

