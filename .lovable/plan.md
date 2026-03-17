

# Envio de Arquivos, Fotos e Emojis via Z-API

## Análise da Documentação Z-API

A Z-API usa endpoints separados para cada tipo de mídia:

| Tipo | Endpoint | Body |
|---|---|---|
| Texto | `/send-text` | `{ phone, message }` |
| Imagem | `/send-image` | `{ phone, image, caption, viewOnce }` |
| Áudio | `/send-audio` | `{ phone, audio, viewOnce, waveform }` |
| Documento | `/send-document/{extension}` | `{ phone, document, fileName }` |

Todos aceitam URL ou Base64. O campo `image`/`audio`/`document` recebe o link ou a string base64.

## Estado Atual

- A edge function `zapi-send` só envia texto (`/send-text`)
- O input do chat é apenas um campo de texto sem opção de anexar arquivos
- A tabela `messages` já tem campos `media_url`, `media_mime_type`, `media_filename` e `type` (image, audio, document, etc.)
- O webhook de recebimento já trata imagens, áudios e documentos inbound

## Plano de Implementação

### 1. Storage Bucket para uploads
- Criar bucket `chat-media` para armazenar arquivos enviados pelo usuário
- RLS: authenticated users podem fazer upload e ler

### 2. `supabase/functions/zapi-send/index.ts`
- Aceitar novos campos no body: `type` (text/image/audio/document), `media_url`, `media_filename`
- Com base no `type`, chamar o endpoint Z-API correto:
  - `image` → `/send-image` com `{ phone, image: media_url, caption: message }`
  - `audio` → `/send-audio` com `{ phone, audio: media_url }`
  - `document` → `/send-document/{ext}` com `{ phone, document: media_url, fileName }`
- Salvar mensagem com `type`, `media_url`, `media_mime_type`, `media_filename` no banco

### 3. `src/pages/ConversationDetail.tsx` — UI de envio
- Adicionar botão de anexo (ícone de clipe/Paperclip) ao lado do input
- Ao clicar, abrir seletor de arquivo (`<input type="file" accept="image/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx">`)
- Fazer upload do arquivo para o bucket `chat-media` via Supabase Storage
- Obter URL pública do arquivo
- Enviar via `zapi-send` com `type` + `media_url` + `media_filename`
- Mostrar preview do arquivo selecionado antes de enviar (thumbnail para imagens, nome do arquivo para documentos)

### 4. `src/pages/ConversationDetail.tsx` — Renderização de mídia
- No render das mensagens, verificar `msg.type`:
  - `image` → renderizar `<img>` com `media_url` (clicável para expandir)
  - `audio` → renderizar `<audio>` player nativo
  - `document` → renderizar link com ícone de arquivo e nome
- Funciona tanto para mensagens inbound (já recebidas pelo webhook) quanto outbound

### 5. Emojis
- Adicionar emoji picker usando biblioteca `emoji-mart` ou similar
- Botão de emoji (ícone Smile) ao lado do input
- Ao selecionar emoji, inserir no campo de texto na posição do cursor
- Emojis são enviados como texto normal (WhatsApp os renderiza nativamente)

## Arquivos Afetados

| Arquivo | Mudança |
|---|---|
| Migration SQL | Criar bucket `chat-media` + políticas de storage |
| `supabase/functions/zapi-send/index.ts` | Suportar envio de image/audio/document |
| `src/pages/ConversationDetail.tsx` | Botão de anexo, upload, preview, renderização de mídia, emoji picker |
| `package.json` | Adicionar `@emoji-mart/react` + `@emoji-mart/data` |

