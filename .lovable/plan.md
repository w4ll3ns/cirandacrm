

## Corrigir mensagem duplicada no disparo de GIF com menção

### Causa raiz
Na linha 175 do `broadcast-scheduler/index.ts` (e na mesma lógica em `zapi-community-broadcast/index.ts`), quando `mention_all` está ativo, o código envia um **follow-up text** com a mesma mensagem para todos os tipos de mídia exceto `text` e `audio`. Como o GIF já suporta `caption` nativamente (e a caption já foi incluída no payload do GIF), isso resulta em **duas mensagens**: o GIF com texto + um texto avulso idêntico.

### Correção
Excluir `gif` da lógica de follow-up de menção, já que o endpoint `/send-gif` suporta `caption` nativamente. A menção `@todos` para GIF precisará ser incluída diretamente no payload do GIF (não no follow-up).

**Arquivos:**

**1. `supabase/functions/broadcast-scheduler/index.ts`** (linha 175)
- Mudar condição de:
  `broadcast.type !== "text" && broadcast.type !== "audio"`
- Para:
  `broadcast.type !== "text" && broadcast.type !== "audio" && broadcast.type !== "gif"`
- Adicionar `mentioned` ao payload do case `gif` quando `mentionedPhones` estiver disponível

**2. `supabase/functions/zapi-community-broadcast/index.ts`**
- Mesma correção: excluir `gif` do bloco de follow-up mention
- Adicionar `mentioned` ao payload do case `gif`

### Resultado
GIF com `mention_all` enviará uma única mensagem (GIF + caption + menções), sem texto duplicado.

