

# Notificação Sonora e Visual para Novas Mensagens em Tempo Real

## Abordagem

Quando uma mensagem **inbound** (do contato) chega via realtime e o usuário **não está visualizando** aquela conversa, emitir:

1. **Toast visual** com nome do contato e preview do texto
2. **Som de notificação** curto (beep sintetizado via Web Audio API — sem necessidade de arquivo externo)
3. **Badge no título da aba** (document.title) com contador de não lidas

## Mudanças

### `src/contexts/DataContext.tsx`
- No handler de `INSERT` do canal `realtime-messages`, quando `newMsg.direction === 'inbound'`:
  - Disparar um **custom event** (`new-inbound-message`) no `window` com os dados da mensagem para que componentes possam reagir sem acoplar lógica de UI ao contexto

### `src/hooks/useInboundNotification.ts` (novo)
- Hook que escuta o custom event `new-inbound-message`
- Recebe o `conversationId` atualmente aberto (ou null) para suprimir notificação se o usuário já está naquela conversa
- Ao receber evento de outra conversa:
  - Toca som via `AudioContext` (beep curto sintetizado)
  - Mostra toast sonner com nome do responsável e texto truncado
  - Atualiza `document.title` com indicador (ex: `(1) Ciranda CRM`)
- Restaura título quando a aba ganha foco

### `src/pages/Conversations.tsx`
- Instanciar `useInboundNotification(selectedId)` para suprimir notificações da conversa atualmente aberta no desktop

### `src/pages/ConversationDetail.tsx`
- Instanciar `useInboundNotification(conversationId)` para suprimir na conversa aberta no mobile

## Arquivos

| Arquivo | Ação |
|---|---|
| `src/hooks/useInboundNotification.ts` | Criar — lógica de som, toast e badge de título |
| `src/contexts/DataContext.tsx` | Adicionar dispatch de custom event no INSERT inbound |
| `src/pages/Conversations.tsx` | Instanciar hook |
| `src/pages/ConversationDetail.tsx` | Instanciar hook |

