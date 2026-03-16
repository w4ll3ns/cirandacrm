

# Rebranding: Centro Educacional Hora de Aprender

## Alterações

### 1. Substituir logo
- Copiar `user-uploads://Design_sem_nome.png` para `public/logo.png` (sobrescreve a logo atual)
- O favicon e todas as referências `/logo.png` serão atualizadas automaticamente

### 2. Renomear "Ciranda ABC" em todos os arquivos

| Arquivo | Alteração |
|---------|-----------|
| `index.html` | Title, og:title, twitter:title |
| `src/components/Layout.tsx` | Header mobile (alt + h1) |
| `src/components/AppSidebar.tsx` | Sidebar header (alt + texto) |
| `src/pages/Login.tsx` | Tela de login desktop e mobile (alt + h1, 4 ocorrencias) |
| `src/pages/Settings.tsx` | Card "Escola Ciranda do ABC" → "Centro Educacional Hora de Aprender", "CRM Ciranda ABC" → "CRM Hora de Aprender", e a letra "C" no ícone → "H" |

Todas as ocorrencias de "Ciranda ABC" viram "Centro Educacional Hora de Aprender" (ou forma abreviada "Hora de Aprender" onde o espaço for limitado, como sidebar e CRM label).

