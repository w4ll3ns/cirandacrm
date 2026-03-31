

## Adicionar tipo de disparo GIF nos disparos em massa

### Resumo
Adicionar uma 6ª aba "GIF" no broadcast de comunidades. Segundo a documentação da Z-API, o endpoint é `POST /send-gif` e o payload é `{ phone, gif: "<url do mp4>" }`. O arquivo precisa ser um **MP4** (o WhatsApp reproduz como GIF).

### Alterações

**1. `src/pages/Communities.tsx` — UI**
- Expandir o type: `BroadcastType = 'text' | 'image' | 'audio' | 'video' | 'gif' | 'link'`
- Mudar o grid de tabs de `grid-cols-5` para `grid-cols-6`
- Adicionar nova aba "GIF" (ícone `Film` ou reutilizar `Video`) entre Vídeo e Link
- O conteúdo da aba terá: seletor de arquivo (accept `video/mp4`) ou URL, campo opcional de legenda (nota: a doc Z-API não mostra campo caption para GIF, mas podemos manter a mensagem para o follow-up de menção)
- Switch de "Mencionar todos" como nas outras abas
- Atualizar `canSendBroadcast` para incluir o tipo `gif`
- Atualizar `handleBroadcast` para incluir `gif` no upload de arquivo
- Exibir nota informativa: "O arquivo deve ser MP4 (será exibido como GIF no WhatsApp)"

**2. `supabase/functions/zapi-community-broadcast/index.ts` — Backend**
- Adicionar case `gif` no switch:
  - Endpoint: `{baseUrl}/send-gif`
  - Payload: `{ phone, gif: media_url }`
- Para menção com GIF: enviar follow-up text com `mentioned` array (mesmo padrão de image/video)

### Arquivos alterados
- `src/pages/Communities.tsx`
- `supabase/functions/zapi-community-broadcast/index.ts`

