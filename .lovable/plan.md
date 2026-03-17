

# Mostrar Status de Entrega (✓✓) na Lista de Conversas

## Problema
Na linha 114 de `Conversations.tsx`, o preview da última mensagem usa apenas `'✓ '` hardcoded para mensagens outbound, sem considerar o `status` real da mensagem (sent, delivered, read).

## Solução
Substituir o `'✓ '` estático por ícones de status dinâmicos baseados em `lastMsg.status`, reutilizando a mesma lógica do `ConversationDetail.tsx`:

- `pending` → ícone Clock
- `sent` → ícone Check (✓)
- `delivered` → ícone CheckCheck (✓✓)
- `read` → ícone CheckCheck em azul (✓✓)
- `failed` → ícone AlertCircle

### `src/pages/Conversations.tsx`
1. Importar ícones: `Check`, `CheckCheck`, `Clock`, `AlertCircle` do lucide-react
2. Criar um pequeno componente inline `ListStatusIcon` que renderiza o ícone correto baseado no status
3. Na linha 114, substituir o texto `'✓ '` por esse componente renderizado antes do texto da mensagem

