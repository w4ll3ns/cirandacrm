

# Corrigir ordem de atualização: preview aparece antes do chat

## Problema
Quando uma nova mensagem chega (via polling ou realtime), o `lastMessages` (preview na lista) é atualizado antes do `msgCache` (mensagens no chat). No polling, isso é agravado porque:
1. `lastMessages` é atualizado em uma única query (linhas 270-284)
2. `msgCache` é atualizado sequencialmente, uma conversa por vez (linhas 289-302)
3. O `setState` do `lastMessages` dispara re-render antes que o loop do `msgCache` termine

## Solução
Atualizar ambos simultaneamente no polling, e garantir no realtime que `msgCache` e `lastMessages` sejam atualizados no mesmo ciclo de render.

### 1. Polling: atualizar tudo junto antes do setState
**Arquivo**: `src/contexts/DataContext.tsx`

No `pollForUpdates`, buscar as mensagens de preview E do cache em paralelo, e só depois chamar os setStates juntos:

```typescript
// Buscar preview msgs e cache msgs em paralelo
const [previewResult, ...cacheResults] = await Promise.all([
  supabase.from('messages').select('*')
    .in('conversation_id', convIds)
    .order('created_at', { ascending: false })
    .limit(convIds.length * 2),
  ...Array.from(fetchedConvsRef.current).map(convId =>
    supabase.from('messages').select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .then(r => ({ convId, data: r.data }))
  ),
]);

// Preparar todos os dados antes de qualquer setState
const lastMap = new Map<string, Mensagem>();
// ... build lastMap from previewResult

const newCache = new Map(msgCache);
// ... update from cacheResults

// Atualizar ambos juntos (React batching)
setLastMessages(lastMap);
setMsgCache(newCache);
```

### 2. Realtime INSERT: garantir atualização simultânea
No handler de INSERT de mensagens, mover o `setLastMessages` para dentro do mesmo bloco condicional que o `setMsgCache`, usando um único callback que atualiza ambos, ou simplesmente garantir que ambos os `setState` estejam no mesmo microtask (React 18 já faz batching automático, mas verificar).

Na prática, o realtime já atualiza ambos no mesmo handler — o problema principal é o **polling**. A correção foca em paralelizar as queries e agrupar os setStates.

### Arquivo modificado
- `src/contexts/DataContext.tsx` — polling `pollForUpdates` e realtime INSERT handler

