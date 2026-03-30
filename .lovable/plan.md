

## Fix: Detecção do estado "lotado" no frontend

### Problema
O `supabase.functions.invoke()` retorna `res.error.message = "Edge Function returned a non-2xx status code"` para qualquer resposta non-2xx. A mensagem genérica não contém "lotados" nem "409", então a lógica de detecção do estado `allFull` nunca é ativada.

Porém, o body JSON da resposta (com `{ error: "Todos os grupos estão lotados..." }`) ainda vem em `res.data`.

### Solução
Ajustar o `handleJoin` em `CampaignLanding.tsx` para:
1. Quando houver `res.error`, verificar também `res.data?.error` (o body retornado pela edge function)
2. Checar se `res.data?.error` contém "lotados" para ativar o estado `allFull`
3. Manter o fallback para a mensagem genérica como erro normal

### Arquivo alterado
- `src/pages/CampaignLanding.tsx` — ajustar a lógica no `handleJoin` (linhas 57-66)

