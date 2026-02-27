

# Drag-and-Drop no Pipeline Kanban (Desktop)

## Abordagem
Implementar drag-and-drop nativo com HTML5 Drag API (sem dependência externa) apenas no desktop. Ao soltar um card em outra coluna, chamar `updateOportunidade` para atualizar a etapa. Incluir feedback visual (highlight na coluna alvo, opacidade no card arrastado).

## Mudanças

### `src/pages/Pipeline.tsx`
- Adicionar estado `draggingId` e `dragOverEtapa` para controle visual
- Nos cards desktop: adicionar `draggable`, `onDragStart` (setar id), `onDragEnd` (limpar estado)
- Nas colunas desktop: adicionar `onDragOver` (preventDefault + highlight), `onDragLeave` (remover highlight), `onDrop` (chamar `updateOportunidade` com nova etapa)
- Estilo: coluna com borda destacada quando `dragOverEtapa` coincide; card com opacidade reduzida durante arrasto
- Toast de confirmação ao mover ("Oportunidade movida para X")
- Mobile permanece inalterado (sem drag)

