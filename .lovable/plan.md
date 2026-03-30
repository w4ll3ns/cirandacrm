

## Rebrand: Hora de Aprender → Dezenas CRM

### Resumo
Substituir toda a identidade visual do sistema (logo, textos, favicon) de "Centro Educacional Hora de Aprender / CRM Escolar" para "Dezenas CRM" usando a imagem enviada como nova logo.

### Alterações

1. **Copiar nova logo** — salvar a imagem enviada como `public/logo.png` (substituindo a atual) e como `public/favicon.ico` (ou gerar um favicon a partir dela)

2. **`index.html`** — Atualizar title, description e meta tags:
   - Title: "Dezenas CRM"
   - Description: "Dezenas CRM - Realizando Sonhos!"

3. **`src/components/AppSidebar.tsx`** (linha 65-69):
   - alt: "Dezenas CRM"
   - Texto: "Dezenas CRM" em vez de "Hora de Aprender"
   - Subtítulo: "Realizando Sonhos!" em vez de "CRM Escolar"

4. **`src/components/Layout.tsx`** (linha 20-22):
   - alt e título: "Dezenas CRM"

5. **`src/pages/Login.tsx`** (linhas 66-68, 100-102):
   - Desktop: alt "Dezenas CRM", título "Dezenas CRM", subtexto "Realizando Sonhos!"
   - Mobile: mesmas alterações

6. **Atualizar memory de branding** para refletir a nova identidade "Dezenas CRM"

### Arquivos alterados
- `public/logo.png` (substituído pela nova imagem)
- `index.html`
- `src/components/AppSidebar.tsx`
- `src/components/Layout.tsx`
- `src/pages/Login.tsx`

