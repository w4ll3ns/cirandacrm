

## Melhorar UX quando todos os grupos estão lotados

### Problema atual
Quando não há vagas, o usuário vê apenas uma pequena mensagem de erro vermelha abaixo do botão. Não há orientação clara sobre o que fazer.

### Melhorias propostas

1. **Estado visual dedicado "Lotado"** no `CampaignLanding.tsx`:
   - Quando receber erro 409 (ou mensagem contendo "lotados"), trocar a tela para um estado visual diferente
   - Mostrar ícone ilustrativo (ex: Users com X), título "Comunidade lotada" em destaque
   - Mensagem amigável: "Todos os grupos estão cheios no momento"
   - Botão "Tentar novamente" secundário (em vez do botão principal)
   - Opcional: campo para o usuário deixar o telefone/WhatsApp para ser avisado quando abrir vaga (lista de espera)

2. **Detecção inteligente do erro 409** no frontend:
   - Diferenciar erro "lotado" (409) de outros erros genéricos
   - Setar um estado `allFull = true` que renderiza o layout dedicado

### Alterações

**`src/pages/CampaignLanding.tsx`:**
- Adicionar estado `allFull`
- No `handleJoin`, detectar status 409 ou mensagem "lotados" e setar `allFull = true`
- Renderizar tela dedicada com visual amigável quando `allFull` for true
- Incluir botão "Tentar novamente" que reseta o estado e tenta de novo

### Arquivo alterado
- `src/pages/CampaignLanding.tsx`

