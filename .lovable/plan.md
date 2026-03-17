

# Plano: Envio de Mensagens via Edge Function com Status Visual

## Situação Atual
- `ConversationDetail.tsx` já tem input de texto e botão enviar
- `handleSend` chama `addMensagem` que insere direto na tabela `messages` via Supabase client
- Edge function `zapi-send` já existe e funciona: salva mensagem, tenta enviar via Z-API, faz fallback local
- Realtime já está configurado para `messages` e `conversations`
- O problema: o frontend não usa a edge function, insere direto no banco sem passar pelo backend

## Mudanças

### 1. `src/pages/ConversationDetail.tsx`
- Reescrever `handleSend` para:
  - Adicionar estado `sending` (boolean) para loading no botão
  - Chamar `supabase.functions.invoke('zapi-send', { body: { conversation_id, message, phone } })` ao invés de `addMensagem`
  - O phone vem de `resp?.whatsapp || resp?.telefone || conv.telefone`
  - Em caso de erro, mostrar `toast.error` com mensagem
  - Não precisa inserir manualmente na tabela -- a edge function faz isso e o realtime atualiza a UI
  - Desabilitar input e botão enquanto `sending === true`
  - Tratar Enter key para não enviar duplicado durante loading
- Adicionar indicadores de status nas mensagens outbound:
  - `pending`/`queued`: ícone relógio (Clock)
  - `sent`: check simples (Check)
  - `delivered`: check duplo (CheckCheck)
  - `read`: check duplo azul (CheckCheck com cor diferente)
  - `failed`: ícone de erro (AlertCircle) + texto "Falha ao enviar" clicável

### 2. `src/contexts/DataContext.tsx`
- Remover a lógica de `addMensagem` que insere direto no banco (o `zapi-send` edge function cuida disso agora)
- Manter `addMensagem` no contexto mas simplificar -- ou remover completamente e fazer a chamada diretamente no componente
- Decisão: manter `addMensagem` mas redirecionar para a edge function, para que outros componentes que precisem enviar mensagens também usem o backend

### 3. Edge function `zapi-send` -- sem mudanças necessárias
Já funciona corretamente: valida auth, salva mensagem, tenta Z-API, faz fallback local.

## Arquivos Modificados

| Arquivo | Ação |
|---|---|
| `src/pages/ConversationDetail.tsx` | Reescrever handleSend + status icons |
| `src/contexts/DataContext.tsx` | Redirecionar addMensagem para edge function |

