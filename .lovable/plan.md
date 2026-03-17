

# Encerrar fluxo ao resolver conversa

## Problema
Quando o usuário resolve uma conversa, sessões de fluxo ativas (`conversation_flow_sessions` com `status = 'running'`) não são encerradas, podendo causar comportamento inesperado se o contato enviar nova mensagem.

## Solução
Adicionar chamada ao banco para encerrar sessões ativas nos 3 pontos onde a conversa é resolvida em `src/pages/ConversationDetail.tsx`:

1. **`handleResolve`** (resolve sem oportunidade vinculada)
2. **`resolveOnly`** (resolve sem avançar etapa)
3. **`resolveAndAdvance`** (resolve e avança pipeline)

Em cada um, após `updateConversa(..., { status: 'resolvida' })`, executar:

```typescript
await supabase
  .from('conversation_flow_sessions')
  .update({ status: 'finished', finished_at: new Date().toISOString() })
  .eq('conversation_id', conv!.id)
  .eq('status', 'running');
```

Isso encerra silenciosamente qualquer sessão de fluxo ativa associada à conversa. Não requer migração de banco — as tabelas e permissões já existem.

## Arquivo modificado
- `src/pages/ConversationDetail.tsx` — 3 pontos de resolução

