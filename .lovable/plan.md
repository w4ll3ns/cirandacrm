

# Plano: Confirmacao de Entrega (✓✓) via Webhook de Status Z-API

## Situacao Atual

- O webhook `zapi-webhook` so processa mensagens inbound (text, image, audio, document). Ele ignora eventos de status.
- Mensagens outbound ficam permanentemente com status `sent` porque nenhum webhook atualiza para `delivered` ou `read`.
- A Z-API envia um webhook separado chamado **Message Status** com payload tipo `MessageStatusCallback` contendo os status: `SENT`, `RECEIVED` (entregue = ✓✓), `READ` (lido = ✓✓ azul).

## Como Funciona na Z-API

A Z-API envia POST para a URL configurada como "webhook de status" com este payload:
```json
{
  "status": "RECEIVED",
  "ids": ["3EB04FD2A93536A481B0C9"],
  "momment": 1632234645000,
  "phone": "5544999999999",
  "type": "MessageStatusCallback",
  "instanceId": "instance.id"
}
```

Os status possíveis: `SENT` → enviado, `RECEIVED` → entregue (✓✓), `READ` → lido (✓✓ azul).

## Mudancas

### 1. `supabase/functions/zapi-webhook/index.ts`
Adicionar tratamento para eventos `MessageStatusCallback`:
- Detectar `payload.type === "MessageStatusCallback"` no início do handler
- Mapear status: `SENT` → `sent`, `RECEIVED` → `delivered`, `READ` → `read`
- Buscar mensagens pelo `external_message_id` em `payload.ids[]`
- Atualizar `status`, `delivered_at` (quando RECEIVED) e `read_at` (quando READ)
- Retornar early sem tentar criar mensagem/conversa

### 2. `src/components/ZapiConfig.tsx`
Exibir a URL do webhook de status separadamente para que o usuario configure no painel Z-API:
- Mostrar que a mesma URL `zapi-webhook` recebe tanto mensagens quanto status
- Adicionar instrucao: "Use esta mesma URL nos campos **Webhook Received** e **Webhook Message Status** no painel Z-API"

### 3. Nenhuma mudanca no frontend de chat
O `ConversationDetail.tsx` ja renderiza os icones corretos para `delivered` (✓✓) e `read` (✓✓ azul). O Realtime ja esta ativo na tabela `messages`, entao a UI vai atualizar automaticamente quando o webhook atualizar o status.

## Arquivos

| Arquivo | Acao |
|---|---|
| `supabase/functions/zapi-webhook/index.ts` | Tratar `MessageStatusCallback` e atualizar status |
| `src/components/ZapiConfig.tsx` | Melhorar instrucoes de configuracao do webhook |

