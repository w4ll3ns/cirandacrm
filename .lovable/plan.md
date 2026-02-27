

# Logo e Paleta de Cores — Identidade Visual Ciranda ABC

## Cores extraídas da logo (confirmadas pela memória do projeto)
- **Azul primário**: #3F6CEE (HSL: 225 84% 59%) — já está correto no CSS
- **Laranja (secondary/CTA)**: #DD7425 (HSL: 26 73% 51%) — já está correto
- **Amarelo (accent)**: #EEDA15 (HSL: 55 86% 51%) — já está correto
- **Fundo neutro**: #FFFFFF e #ECEEF0

As cores base já estão alinhadas. As mudanças são: **colocar a logo real** e **melhorar UX visual** em todo o sistema.

## Mudanças

### 1. Copiar logo para `public/logo.png` e usar como favicon
- Copiar `user-uploads://ChatGPT_Image_27_de_fev._de_2026_17_20_49.png` → `public/logo.png`
- Atualizar `index.html` para usar `/logo.png` como favicon

### 2. `src/pages/Login.tsx` — Usar a logo real
- Substituir o quadrado com letra "C" pela `<img src="/logo.png">` tanto no desktop (painel esquerdo) quanto no mobile
- Ajustar tamanhos: desktop 120x120, mobile 96x96
- Manter nome "Ciranda ABC" e subtítulo abaixo da logo

### 3. `src/components/AppSidebar.tsx` — Logo no sidebar
- Substituir o quadrado azul com "C" por `<img src="/logo.png" className="w-9 h-9 rounded-xl object-contain" />`

### 4. `src/components/Layout.tsx` — Logo no header mobile
- Substituir texto "Ciranda ABC" por logo pequena (32x32) + nome ao lado

### 5. Refinamentos de UX e consistência visual
- `src/index.css`: Ajustar `--muted` para `220 14% 95%` (mais suave), adicionar transição global suave nos botões
- Cards do pipeline e KPIs: Adicionar `shadow-sm` default para melhor hierarquia visual
- Botões de ação (FAB, "Novo Lead"): garantir uso consistente de `bg-secondary` (laranja) para CTAs primários de conversão

### Arquivos afetados
- Copiar: logo para `public/logo.png`
- Editar: `index.html`, `Login.tsx`, `AppSidebar.tsx`, `Layout.tsx`, `src/index.css`

