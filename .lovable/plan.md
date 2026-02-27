

# Corrigir barra de rolagem horizontal do Pipeline

## Problema
O container do Pipeline usa `h-full` dentro de um `main` com `overflow-y-auto`. Isso permite que o Pipeline cresça verticalmente além da viewport, empurrando a barra de rolagem horizontal para baixo da área visível.

## Solução

### `src/pages/Pipeline.tsx` (linha 169)
Trocar `h-full` por `h-[calc(100vh-3.5rem)]` no container desktop do Pipeline. Isso fixa a altura ao viewport menos o header (3.5rem = 56px), garantindo que:
- A barra de rolagem horizontal fique sempre visível na parte inferior da tela
- As colunas individuais rolem verticalmente dentro do espaço disponível
- O scrollbar nunca saia da viewport

**Antes:** `<div className="h-full flex flex-col">`
**Depois:** `<div className="h-[calc(100vh-3.5rem)] flex flex-col">`

### Arquivos afetados
- `src/pages/Pipeline.tsx` — 1 linha alterada

