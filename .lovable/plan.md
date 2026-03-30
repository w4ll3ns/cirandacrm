

## Melhorias no Disparo de Mensagem (Comunidades)

### 1. Auto-fetch de preview no tab "Link"
Ao colar a URL no campo "URL do Link", adicionar botão "Buscar Preview" que chama a edge function `fetch-link-preview` já existente para preencher automaticamente título, descrição e imagem do preview. Campos continuam editáveis.

### 2. Upload de arquivo para Imagem, Áudio (e Vídeo)
Nos tabs de Imagem e Áudio, adicionar opção de upload de arquivo como alternativa à URL. O usuário escolhe: colar URL ou fazer upload do arquivo. O upload vai para o bucket `chat-media`, e a URL pública resultante é usada como `media_url` no disparo.

### Alterações

**Arquivo: `src/pages/Communities.tsx`**

1. **Novos states**:
   - `fetchingLinkPreview: boolean` — loading do fetch de preview
   - `broadcastFile: File | null` — arquivo selecionado para upload (imagem/áudio)
   - `broadcastFilePreview: string | null` — preview local do arquivo
   - `uploadingBroadcastFile: boolean` — loading do upload

2. **Tab Link (linhas ~761-783)**:
   - Adicionar botão "Buscar Preview" ao lado do campo URL
   - Ao clicar, chamar `supabase.functions.invoke('fetch-link-preview', { body: { url: broadcastLinkUrl } })`
   - Preencher `broadcastLinkTitle`, `broadcastLinkDesc`, `broadcastLinkImage` com os dados retornados
   - Mostrar spinner durante o fetch

3. **Tab Imagem (linhas ~743-752)**:
   - Substituir campo "URL da Imagem" por toggle: "Colar URL" ou "Enviar Arquivo"
   - Se arquivo: input file (accept="image/*") com preview da imagem
   - Se URL: input text como hoje

4. **Tab Áudio (linhas ~754-758)**:
   - Mesmo padrão: toggle entre URL e upload de arquivo (accept="audio/*")

5. **`handleBroadcast` (linha ~314)**:
   - Se `broadcastFile` existe, fazer upload para `chat-media` primeiro, obter URL pública, e usar como `media_url`

6. **`canSendBroadcast` (linha ~304)**:
   - Para image/audio: aceitar `broadcastFile` OU `broadcastMediaUrl`

7. **`resetBroadcast` (linha ~354)**:
   - Limpar `broadcastFile` e `broadcastFilePreview`

### Detalhes técnicos
- Upload usa `supabase.storage.from('chat-media').upload(path, file)` + `getPublicUrl()` (mesmo padrão já usado em ConversationDetail)
- Edge function `fetch-link-preview` já existe e retorna `{ title, description, image }`
- Nenhuma alteração na edge function `zapi-community-broadcast` necessária — ela já recebe `media_url` como string

