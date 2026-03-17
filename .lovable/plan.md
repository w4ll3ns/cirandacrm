

# Corrigir envio de mensagens pelo Flow Engine

## Problema
O `flow-engine` chama `zapi-send` com `Authorization: Bearer SERVICE_ROLE_KEY`, mas o `zapi-send` valida o token com `supabase.auth.getUser()`, que espera um JWT de usuário. O service role key não tem claim `sub`, resultando em "Invalid token". A mensagem é salva no banco (aparece no chat) mas nunca é enviada via Z-API.

## Solução

### Opção escolhida: Fazer o flow-engine chamar Z-API diretamente

Em vez de rotear pelo `zapi-send` (que exige auth de usuário), o `sendMessage` do flow-engine buscará a instância Z-API ativa e enviará diretamente, igual ao `zapi-send` faz internamente.

### Alteração em `supabase/functions/flow-engine/index.ts`

Reescrever a função `sendMessage` (linhas 484-528):

1. Buscar instância Z-API ativa (`zapi_instances` where `connected = true`)
2. Se existir instância com `client_token`, enviar direto via `fetch` para `https://api.z-api.io/instances/{id}/token/{token}/send-text`
3. Atualizar o status da mensagem no banco para `sent` após envio bem-sucedido
4. Se não houver instância, manter a mensagem como `pending` (comportamento atual do zapi-send sem instância)

Isso elimina a dependência de autenticação de usuário e replica a mesma lógica que o `zapi-send` já usa internamente.

### Redeploy
Redeployar o `flow-engine` após a correção.

