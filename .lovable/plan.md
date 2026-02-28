

# Fix: Botão de temperatura abrindo detalhes ao invés de alterar temperatura

## Problema
O `draggable` no div pai interfere com a propagação de eventos de clique. O `e.stopPropagation()` sozinho não é suficiente — é preciso também `e.preventDefault()` no botão de temperatura para evitar que o clique propague ao handler de navegação do card.

## Alterações

### `src/pages/Pipeline.tsx`

1. **`cycleTemperature`** — Adicionar `e.preventDefault()` junto ao `e.stopPropagation()`

2. **Botão de temperatura no `renderDesktopCard`** — Adicionar `onMouseDown={(e) => e.stopPropagation()}` para impedir que o drag do pai capture o evento antes do click, e aumentar a área clicável com padding extra

