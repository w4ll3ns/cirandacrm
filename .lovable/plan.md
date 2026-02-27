

# Controle de Acesso por Perfil (RBAC)

## Matriz de Permissões Proposta

```text
Funcionalidade              | Admin | Secretaria | Comercial
────────────────────────────┼───────┼────────────┼──────────
Dashboard (Home)            |  ✓    |  ✓         |  ✓
  └ Relatórios/Gráficos     |  ✓    |  ✗         |  ✗
  └ Botão "Novo Lead"       |  ✓    |  ✓         |  ✓
Pipeline                    |  ✓    |  Leitura   |  ✓
  └ Mover etapa / Drag-drop |  ✓    |  ✗         |  ✓
  └ Filtro por responsável   |  ✓    |  ✗         |  ✗
  └ Criar lead              |  ✓    |  ✓         |  ✓
Conversas                   |  ✓    |  ✓         |  ✓
  └ Resolver / Ações        |  ✓    |  ✓         |  ✓
Contatos                    |  ✓    |  ✓         |  Leitura
  └ Editar contato          |  ✓    |  ✓         |  ✗
Tarefas                     |  ✓    |  ✓         |  ✓
  └ Criar tarefa            |  ✓    |  ✓         |  ✓
Configurações               |  ✓    |  Próprio   |  Próprio
  └ Equipe / Integrações    |  ✓    |  ✗         |  ✗
  └ Métricas / Growth       |  ✓    |  ✗         |  ✗
Oportunidade Detalhe        |  ✓    |  Leitura   |  ✓
  └ Mover etapa             |  ✓    |  ✗         |  ✓
  └ Marcar perdida          |  ✓    |  ✗         |  ✓
```

## Mudanças

### 1. Criar hook `usePermissions` (`src/hooks/usePermissions.ts`)
- Centraliza toda lógica de permissão baseada no `perfil` do usuário
- Exporta flags: `canEditPipeline`, `canEditContacts`, `canViewReports`, `canManageSettings`, `canFilterByResponsavel`

### 2. `src/pages/Home.tsx`
- Botão "Relatórios" visível apenas para admin (já implementado, confirmar)

### 3. `src/pages/Pipeline.tsx`
- Secretaria: remover drag-and-drop, esconder botão "Mover Etapa"
- Filtro por responsável: apenas admin
- Cards clicáveis para todos, mas ações de movimentação restritas

### 4. `src/pages/Contacts.tsx` e `ContactDetail.tsx`
- Comercial: esconder botão "Editar" no detalhe do contato

### 5. `src/pages/OpportunityDetail.tsx`
- Secretaria: esconder botões "Mover Etapa" e "WhatsApp" (ações comerciais)

### 6. `src/pages/Settings.tsx`
- Secretaria e Comercial: mostrar apenas perfil próprio e botão de logout
- Esconder seções Equipe, Integrações, Métricas/Growth

### 7. `src/components/AppSidebar.tsx` e `BottomNav.tsx`
- Configurações no sidebar/nav: visível para todos mas com conteúdo restrito (já tratado no Settings)

### 8. `src/components/NewLeadForm.tsx`
- Campo "Responsável Interno": secretaria e comercial pré-selecionam a si mesmos; admin pode escolher qualquer um

### 9. `src/components/NewTaskForm.tsx`
- Campo "Responsável Interno": mesma lógica do NewLeadForm

## Arquivos afetados
- Novo: `src/hooks/usePermissions.ts`
- Editar: `Pipeline.tsx`, `ContactDetail.tsx`, `OpportunityDetail.tsx`, `Settings.tsx`, `Home.tsx`, `NewLeadForm.tsx`, `NewTaskForm.tsx`

