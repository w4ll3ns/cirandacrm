
Diagnóstico rápido

- O envio não está falhando no app nem na autenticação do backend.
- A função de envio está sendo chamada corretamente.
- O erro real vem do provedor WhatsApp: `your client-token is not configured`.
- No banco de configuração, a instância ativa está `connected = true`, mas sem `client_token`.
- Por isso você recebe mensagens (webhook inbound funciona), mas não consegue enviar outbound.

O que você precisa fazer agora (para voltar a enviar)

1) Configurar o Client Token no provedor WhatsApp (painel da Z-API) para essa instância.
2) No app, em Configurações > WhatsApp:
   - remover a instância atual e cadastrar novamente com:
   - `instance_id`
   - `token`
   - `client_token` (obrigatório no seu cenário)
3) Deixar apenas 1 instância ativa/conectada.
4) Testar envio em uma conversa e validar mudança de status (pending/sent/failed).

Plano de melhoria (para não quebrar de novo)

1) `src/components/ZapiConfig.tsx`
   - tornar `client_token` obrigatório ao conectar.
   - adicionar validação visual “Configuração incompleta” se faltar token/client_token.
   - adicionar edição de credenciais (hoje só cria/remove).

2) `supabase/functions/zapi-send/index.ts`
   - validar antes da chamada externa: se `client_token` ausente, retornar erro claro de configuração.
   - quando provedor responder erro, retornar payload com mensagem amigável (não parecer “sucesso 200” no frontend).

3) `src/pages/ConversationDetail.tsx`
   - ao receber `status: failed`, mostrar feedback explícito com motivo (ex.: client token ausente).
   - manter botão “Reenviar”, mas com erro detalhado e orientação curta.

4) (Opcional, robustez) deduplicar fila de retry por mensagem para evitar múltiplos registros pendentes no mesmo erro.

Critérios de sucesso

- Envio de nova mensagem muda de loading para `sent` (ou `pending` seguido de atualização).
- Reenvio de mensagem `failed` passa a funcionar após configurar client token.
- Nenhuma nova ocorrência de `your client-token is not configured` nos logs de envio.

Detalhes técnicos

- Evidência principal do erro: logs da função de envio e respostas HTTP retornando `status: failed` com `zapi.error = "your client-token is not configured"`.
- A camada de backend está correta; o bloqueio é configuração da instância externa + validações de UX ainda permissivas no formulário de configuração.
