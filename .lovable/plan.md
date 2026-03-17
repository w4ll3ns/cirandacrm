

# Reutilizar Conversa Existente ao Invés de Criar Nova

## Problema
Na linha 168 do webhook, a busca por conversa filtra apenas por status `["nao_lida", "aguardando", "em_atendimento"]`. Quando uma conversa é marcada como "resolvida", ela não é encontrada, e o webhook cria uma nova — perdendo o histórico.

## Solução
Alterar a lógica para: primeiro buscar conversa ativa; se não encontrar, buscar a última conversa resolvida/fechada do mesmo contato e **reabri-la** (mudar status para `nao_lida`), em vez de criar uma nova.

### `supabase/functions/zapi-webhook/index.ts`

1. Manter a busca atual por conversas ativas (linhas 164-171)
2. Se não encontrar, adicionar uma **segunda busca** sem filtro de status, pegando a conversa mais recente do contato:
   ```
   .eq("responsavel_id", responsavel.id)
   .order("created_at", { ascending: false })
   .limit(1)
   ```
3. Se encontrar essa conversa antiga, fazer `update` do status para `nao_lida` e usá-la
4. Só criar conversa nova se **nenhuma** conversa existir para o contato

### Arquivo afetado

| Arquivo | Mudança |
|---|---|
| `supabase/functions/zapi-webhook/index.ts` | Reabrir conversa resolvida em vez de criar nova |

