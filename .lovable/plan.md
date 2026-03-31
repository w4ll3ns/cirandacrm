

## Histórico não atualiza automaticamente após disparo agendado

### Problema
O histórico só é carregado quando o usuário clica na aba "Histórico". Disparos processados pelo cron em background não aparecem até um refresh manual.

### Solução
Adicionar um Supabase Realtime subscription na tabela `broadcast_logs` para atualizar automaticamente quando novos registros são inseridos. Também atualizar `scheduled_broadcasts` em realtime para refletir mudanças de status.

### Alterações

**1. Migration SQL — habilitar realtime**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcast_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scheduled_broadcasts;
```

**2. `src/pages/Communities.tsx`**
- Adicionar `useEffect` com subscription Realtime nos canais `broadcast_logs` e `scheduled_broadcasts`
- Quando um INSERT em `broadcast_logs` ou UPDATE em `scheduled_broadcasts` ocorrer, chamar `fetchBroadcastHistory()` e `fetchScheduledBroadcasts()` automaticamente
- Cleanup do channel no return do useEffect

### Resultado
O histórico e a lista de agendamentos atualizam em tempo real sem precisar recarregar a página.

