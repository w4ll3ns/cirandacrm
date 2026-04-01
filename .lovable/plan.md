
Objetivo: eliminar de forma definitiva o envio duplicado de texto causado pela lógica de “Mencionar todos” em disparos manuais e agendados.

Resumo do diagnóstico
- O problema não é pontual do GIF ou da imagem; ele vem de uma regra genérica no backend.
- Hoje, quando `mention_all` está ativo, os fluxos `zapi-community-broadcast` e `broadcast-scheduler` enviam:
  - a mídia/link com texto no payload principal; e depois
  - um `send-text` extra com o mesmo texto para tentar fazer a menção.
- Isso duplica o texto em:
  - `image` (caption + texto extra)
  - `video` (caption + texto extra)
  - `link` (message + texto extra)
- `text` já funciona em mensagem única.
- `gif` já foi parcialmente corrigido para mensagem única.
- `audio` não carrega texto, então não sofre essa duplicação.

Plano de correção
1. Unificar a regra de envio por tipo
- Nos dois backends de disparo, criar uma matriz de capacidades por tipo, em vez de usar condicionais soltas.
- Exemplo de regra:
  - `text`: suporta texto inline e menção nativa
  - `gif`: suporta texto inline e menção nativa
  - `image`: suporta texto inline, mas não usaremos follow-up automático
  - `video`: suporta texto inline, mas não usaremos follow-up automático
  - `link`: suporta texto inline, mas não usaremos follow-up automático
  - `audio`: não suporta texto inline e não terá menção

2. Remover a origem da duplicação
- Eliminar a lógica genérica de `send-text` complementar para `image`, `video` e `link`.
- O backend deve sempre priorizar “uma mensagem por grupo” como comportamento padrão.

3. Tornar o backend à prova de regressão
- Implementar a decisão de menção com base nessa matriz de capacidades, não em listas manuais espalhadas.
- Se um tipo não suportar menção nativa no modelo atual, o backend:
  - envia só a mensagem principal;
  - ignora o `mention_all` para esse tipo;
  - registra log interno para facilitar futuras auditorias.

4. Ajustar a interface para refletir a regra real
- Em `src/pages/Communities.tsx`, manter “Mencionar todos” apenas onde o envio é realmente seguro em mensagem única:
  - habilitado para `text` e `gif`
  - oculto ou desabilitado para `image`, `video` e `link`
  - ausente para `audio`
- Adicionar um texto curto explicando que, para evitar mensagens duplicadas, essa opção só aparece em tipos com suporte nativo no formato atual.

5. Garantir compatibilidade com agendamentos já criados
- Mesmo que existam registros antigos em `scheduled_broadcasts` com `mention_all = true` para imagem/vídeo/link, o backend corrigido deve impedir a duplicação sem depender de regravar esses dados.

Validação
- Testar manual e agendado para todos os tipos:
  - texto
  - imagem
  - áudio
  - vídeo
  - gif
  - link
- Confirmar:
  - `image`, `video` e `link` enviam apenas 1 mensagem
  - `text` e `gif` continuam com menção sem follow-up
  - agendamentos antigos também não duplicam mais
  - envio sem `mention_all` permanece inalterado

Detalhes técnicos
- Arquivos a revisar:
  - `supabase/functions/zapi-community-broadcast/index.ts`
  - `supabase/functions/broadcast-scheduler/index.ts`
  - `src/pages/Communities.tsx`
- Não precisa migration de banco.
- A correção principal é arquitetural: trocar a lógica reativa de “manda texto extra se for mídia” por uma regra centralizada por capacidade de cada tipo.
