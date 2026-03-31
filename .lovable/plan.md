

## Mencionar Todos nos Disparos em Massa

### Resumo
Adicionar switch "Mencionar todos" nos disparos. A mensagem fica inalterada — apenas o array `mentioned` com os participantes do grupo é adicionado ao payload, e o WhatsApp cuida de notificar todos.

### Alterações

**1. `src/pages/Communities.tsx` — UI**
- Novo estado `mentionAll` (boolean, default false)
- Switch abaixo dos textareas (texto, legenda imagem, legenda vídeo, mensagem link) — desabilitado para áudio
- Resetar no `resetBroadcast`
- Enviar `mention_all: true` no body da chamada à edge function

**2. `supabase/functions/zapi-community-broadcast/index.ts` — Backend**
- Receber `mention_all` do body
- Quando `mention_all === true`:
  - Para cada grupo, buscar participantes via `GET {baseUrl}/group-metadata/{phone}` (retorna lista de participantes com números)
  - Extrair array de números
  - Adicionar `mentioned: [números]` ao payload do `/send-text`
  - Para `image`, `video`, `link`: enviar a mídia normalmente e em seguida enviar um `/send-text` com a mensagem original + `mentioned` array (única forma de mencionar nesses tipos)
  - Para `audio`: ignorar menção (sem texto)

### Arquivos alterados
- `src/pages/Communities.tsx`
- `supabase/functions/zapi-community-broadcast/index.ts`

