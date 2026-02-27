

# Desktop Layout — Plano de Implementação

## Estratégia
Usar `useIsMobile()` para alternar entre layout mobile (atual, com bottom nav) e layout desktop (sidebar lateral + conteúdo expandido). Todas as telas ganham layouts mais largos no desktop.

## Mudanças por arquivo

### 1. `src/components/Layout.tsx` — Layout responsivo
- Desktop: sidebar fixa à esquerda (w-64) com navegação vertical + header superior com info do usuário e settings
- Mobile: manter layout atual com bottom nav
- Usar `useIsMobile()` para alternar

### 2. `src/components/Sidebar.tsx` — Novo componente
- Sidebar vertical com logo, links de navegação (ícone + label), indicadores de notificação
- Rodapé com perfil do usuário e botão de configurações
- Destaque visual na rota ativa

### 3. `src/components/BottomNav.tsx`
- Renderizar apenas em mobile (já controlado pelo Layout)

### 4. `src/pages/Home.tsx` — Dashboard desktop
- KPIs em grid de 4 colunas (ao invés de 2)
- Tarefas prioritárias ao lado dos KPIs em layout de 2 colunas
- Cards maiores com mais informação visível
- FAB reposicionado ou substituído por botão no header

### 5. `src/pages/Pipeline.tsx` — Kanban real no desktop
- Desktop: exibir todas as colunas do kanban lado a lado com scroll horizontal, cada coluna com seus cards empilhados verticalmente (layout kanban verdadeiro)
- Mobile: manter o layout atual com tabs por etapa

### 6. `src/pages/Conversations.tsx` — Split view
- Desktop: layout master-detail (lista à esquerda, chat à direita) — estilo WhatsApp Web
- Mobile: manter lista → detalhe separados

### 7. `src/pages/ConversationDetail.tsx`
- Desktop: usado como painel direito dentro da split view de Conversas, sem header próprio com back button
- Mobile: manter layout atual full-screen

### 8. `src/pages/Contacts.tsx`
- Desktop: lista em grid/tabela com mais colunas visíveis (nome, whatsapp, origem, status, data)
- Mobile: manter lista compacta atual

### 9. `src/pages/Tasks.tsx`
- Desktop: layout em tabela com colunas (título, tipo, prioridade, responsável, data, status)
- Mobile: manter lista atual

### 10. `src/pages/Settings.tsx`
- Desktop: conteúdo centralizado com max-width, cards em grid de 2 colunas
- Mobile: manter layout atual

### 11. `src/pages/OpportunityDetail.tsx` e `src/pages/ContactDetail.tsx`
- Desktop: conteúdo em max-width centralizado, seções em grid de 2 colunas
- Mobile: manter layout atual

### 12. `src/pages/Login.tsx`
- Desktop: layout split — ilustração/branding à esquerda, seletor de perfil à direita
- Mobile: manter layout atual

### 13. `src/App.tsx` — Rotas ajustadas
- Conversas no desktop: rota aninhada para suportar split view (lista + detalhe na mesma tela)

## Detalhes técnicos
- Hook `useIsMobile()` já existe (breakpoint 768px)
- Usar Tailwind responsive classes (`md:`, `lg:`) onde possível
- Para split views (Conversas), usar renderização condicional com `useIsMobile()`
- Sidebar usa as mesmas cores primárias do app bar atual
- Conteúdo desktop com `max-w-7xl mx-auto` para telas muito largas

