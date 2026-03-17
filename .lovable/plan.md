

# Criar Oportunidade Automaticamente para Novos Contatos via Webhook

## Problema
O webhook `zapi-webhook` cria `responsavel` + `conversation` para mensagens de novos contatos, mas não cria uma `oportunidade`. Sem oportunidade, o lead não aparece no pipeline nem no dashboard.

## Solução
Adicionar lógica no webhook para criar automaticamente uma oportunidade na etapa `novo_lead` sempre que um **novo responsável** for criado (ou quando não houver oportunidade aberta existente para o responsável).

### `supabase/functions/zapi-webhook/index.ts`

Após criar/encontrar o responsável e a conversa, adicionar:

1. Verificar se já existe uma oportunidade aberta (`status = 'aberta'`) para esse `responsavel_id`
2. Se não existir, criar uma nova oportunidade com:
   - `responsavel_id`: id do responsável
   - `etapa`: `novo_lead`
   - `temperatura`: `morno`
   - `status`: `aberta`
   - `origem`: `whatsapp`
3. Vincular a oportunidade à conversa (`conversations.oportunidade_id`)

### Fluxo atualizado

```text
Mensagem inbound → webhook
  ├─ Encontra/cria responsável
  ├─ Encontra/cria conversa
  ├─ Encontra/cria oportunidade  ← NOVO
  │   └─ Vincula oportunidade à conversa
  ├─ Insere mensagem
  └─ Atualiza timestamp da conversa
```

### Arquivo afetado

| Arquivo | Mudança |
|---|---|
| `supabase/functions/zapi-webhook/index.ts` | Adicionar criação automática de oportunidade + vínculo com conversa |

Nenhuma mudança no banco necessária — a tabela `oportunidades` e o campo `conversations.oportunidade_id` já existem.

