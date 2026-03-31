

## Adicionar caption ao envio de GIF

### Problema
Atualmente o payload do GIF é `{ phone, gif: media_url }` — sem `caption`. A documentação da Z-API confirma que `caption` é um **atributo opcional** suportado nativamente no `/send-gif`. Não precisa de mensagem follow-up.

### Alterações

**1. `supabase/functions/zapi-community-broadcast/index.ts`**
- No case `"gif"`, adicionar `caption` ao payload: `{ phone, gif: media_url, caption: caption || message || "" }`

**2. `supabase/functions/broadcast-scheduler/index.ts`**
- Mesma correção: `{ phone, gif: broadcast.media_url, caption: broadcast.caption || broadcast.message || "" }`

**3. `src/pages/Communities.tsx`**
- Na aba GIF, adicionar um campo de texto (Textarea) para "Mensagem/Legenda" — igual ao que já existe para imagem e vídeo
- Garantir que o valor do campo seja enviado como `caption` ou `message` no payload da edge function

### Impacto
3 arquivos, mudanças mínimas. O GIF passa a suportar texto nativamente sem mensagem duplicada.

