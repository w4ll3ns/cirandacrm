

## Upload de imagem de capa na campanha

### Alteração

**Arquivo: `src/pages/Campaigns.tsx`**

1. **Novos states**:
   - `campaignImageMode: 'url' | 'file'` — toggle entre colar URL ou upload
   - `campaignImageFile: File | null` — arquivo selecionado
   - `uploadingCampaignImage: boolean` — loading do upload

2. **Campo de imagem (linhas ~421-425)**: Substituir o input simples por um toggle (botões "Colar URL" / "Enviar Arquivo"):
   - Se URL: input text como hoje
   - Se arquivo: input file (`accept="image/*"`) com preview local

3. **`handleCreateOrUpdate` (linhas ~215-245)**: Antes de salvar, se `campaignImageFile` existir, fazer upload para bucket `chat-media`, obter URL pública, e usar como `imagem_url`.

4. **`resetForm` (linha ~147)**: Limpar `campaignImageFile` e resetar `campaignImageMode` para `'url'`.

5. **`handleEditCampaign` (linha ~160)**: Setar `campaignImageMode` para `'url'` ao editar campanha existente.

Mesmo padrão de toggle já implementado nos tabs de Imagem/Áudio em Communities.tsx.

