

## Home com Dashboard por Módulo

A página Home será adaptada para mostrar conteúdo relevante com base nos módulos que o usuário tem acesso. Usuários com ambos os módulos verão tabs para alternar entre dashboards.

### Lógica

- **Só CRM**: Dashboard atual (KPIs de leads, tarefas, conversas não lidas)
- **Só Comunidades**: Novo dashboard com KPIs de comunidades/campanhas (total de campanhas ativas, grupos gerenciados, último disparo)
- **Ambos (ou admin)**: Tabs "CRM" / "Comunidades" no topo para alternar, com conteúdo de cada dashboard
- **Nenhum módulo**: Tela de boas-vindas simples

### Alterações em `src/pages/Home.tsx`

1. **Importar `usePermissions`** (já importado) — usar `canViewCRM` e `canViewCommunities` para decidir o que renderizar

2. **Novo state `activeModule`**: `'crm' | 'comunidades'` — inicializado automaticamente com base nos módulos disponíveis

3. **Tabs no topo** (quando ambos os módulos disponíveis): Botões "CRM" e "Comunidades" ao lado do filtro de período

4. **Dashboard CRM** (conteúdo atual): KPI cards de leads/visitas/follow-ups/matrículas, conversas não lidas, tarefas prioritárias, botão "Novo Lead"

5. **Novo Dashboard Comunidades**: 
   - KPI cards: Campanhas Ativas, Total de Grupos nas Campanhas, Campanhas Inativas
   - Lista de campanhas recentes com status
   - Atalhos rápidos para "Comunidades" e "Campanhas"
   - Dados carregados via query direta ao Supabase (`community_campaigns`, `campaign_groups`)

6. **Esconder elementos CRM** quando `activeModule === 'comunidades'`: botão "Novo Lead", filtro de período (não relevante), relatórios

### Arquivo alterado
- `src/pages/Home.tsx` — único arquivo

