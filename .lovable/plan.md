

## Adicionar suporte a Vídeo no disparo de mensagens (Comunidades)

### Alterações em `src/pages/Communities.tsx`

1. **Tipo**: Adicionar `'video'` ao `BroadcastType` → `'text' | 'image' | 'audio' | 'video' | 'link'`

2. **Grid dos tabs**: Mudar de `grid-cols-4` para `grid-cols-5`, adicionar tab "Vídeo" com ícone `Video` do lucide-react

3. **Novo `TabsContent value="video"`**: Mesmo padrão dos tabs Imagem/Áudio — toggle "Enviar Arquivo" / "Colar URL", com `accept="video/*"`, preview do nome do arquivo, e campo de legenda (caption)

4. **`canSendBroadcast`**: Adicionar case `'video'` → aceitar `broadcastMediaUrl` ou `broadcastFile`

5. **`handleBroadcast`**: Incluir `'video'` na condição de upload de arquivo (linha 340: `broadcastType === 'image' || broadcastType === 'audio' || broadcastType === 'video'`)

6. **`caption`**: O campo de legenda do vídeo envia como `caption` no body, igual à imagem — a edge function `zapi-community-broadcast` já suporta o campo `caption` implicitamente na estrutura

### Alterações em `supabase/functions/zapi-community-broadcast/index.ts`

Adicionar case `'video'` no switch:
```typescript
case "video":
  endpoint = `${baseUrl}/send-video`;
  payload = { phone, video: media_url, caption: caption || message || "" };
  break;
```

### Resumo
- 2 arquivos alterados: `Communities.tsx` e `zapi-community-broadcast/index.ts`
- Padrão idêntico ao tab de Imagem (upload/URL + legenda)
- Segue a documentação Z-API para `send-video`

