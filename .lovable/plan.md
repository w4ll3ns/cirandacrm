

## Otimização de imagem da landing page de campanha

### Problema
A imagem da campanha é armazenada e servida em resolução original (pode ser vários MB). Na landing page mobile, o `max-h-64` (256px) limita a exibição, mas o navegador baixa a imagem inteira.

### Solução: Redimensionar no upload + otimizar exibição

**1. Redimensionar a imagem no momento do upload (`src/pages/Campaigns.tsx`)**
- Antes do `supabase.storage.upload`, usar Canvas API para redimensionar a imagem para no máximo **800px de largura** e converter para **JPEG com qualidade 0.8** (~80%)
- Criar uma função utilitária `resizeImage(file: File, maxWidth: number, quality: number): Promise<Blob>` que:
  - Carrega a imagem em um `<img>` off-screen
  - Desenha no canvas com dimensões proporcionais
  - Exporta como `image/jpeg` com a qualidade especificada
- Isso reduz drasticamente o tamanho do arquivo (de vários MB para ~50-150KB)

**2. Otimizar a tag `<img>` na landing page (`src/pages/CampaignLanding.tsx`)**
- Adicionar atributos `loading="eager"`, `decoding="async"` e `fetchPriority="high"` para priorizar o carregamento
- Adicionar `width` e `height` fixos para evitar layout shift
- Mostrar um placeholder/skeleton enquanto a imagem carrega (estado `imageLoaded`)

### Arquivos alterados
- `src/lib/utils.ts` — nova função `resizeImage`
- `src/pages/Campaigns.tsx` — usar `resizeImage` antes do upload
- `src/pages/CampaignLanding.tsx` — otimizar tag `<img>` com atributos de performance e skeleton

