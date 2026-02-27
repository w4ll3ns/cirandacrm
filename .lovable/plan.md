

# Corrigir barra de rolagem horizontal no Pipeline Kanban

## Problema
As classes `scrollbar-thin`, `scrollbar-thumb-border`, `scrollbar-track-transparent` usadas no container do Kanban não existem no CSS — são de um plugin Tailwind não instalado. Além disso, `overflow-x-auto` só mostra a scrollbar quando o usuário tenta rolar, e em muitos navegadores ela fica invisível.

## Solução

### 1. `src/index.css` — Adicionar classes utilitárias de scrollbar
Adicionar na `@layer utilities` estilos para `.scrollbar-always-visible` que forçam a scrollbar horizontal a ser sempre visível com estilo customizado (thumb na cor border, track transparente).

### 2. `src/pages/Pipeline.tsx` — Linha 197
Trocar `overflow-x-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent` por `overflow-x-scroll scrollbar-always-visible` e remover o `style={{ scrollbarWidth: 'thin' }}`.

- `overflow-x-scroll` força a scrollbar a sempre aparecer
- A classe CSS customizada estiliza o thumb e track para ficar visualmente integrado

