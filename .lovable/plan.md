

# Remover toast "Mensagem enviada"

Remover o `toast.success('Mensagem enviada')` do `handleSend` em `src/pages/ConversationDetail.tsx`, já que a mensagem aparecendo no chat já confirma o envio.

### Alteração
- **`src/pages/ConversationDetail.tsx`**: Remover a linha `toast.success('Mensagem enviada');` da função `handleSend`.

