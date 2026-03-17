

# Corrigir título dos cards do Pipeline

## Problema
Os cards mostram `aluno?.nome || 'Aluno'` como título principal. Quando não há aluno vinculado, aparece "Aluno" como fallback. O correto é mostrar o nome do **contato (responsável)** como título.

## Alteração

### `src/pages/Pipeline.tsx`
Nos dois métodos de renderização (`renderCard` e `renderDesktopCard`):
- **Título principal**: trocar de `aluno?.nome || 'Aluno'` para `resp?.nome || 'Contato'`
- **Subtítulo**: trocar de `resp?.nome || 'Responsável'` para `aluno?.nome` (mostrar nome do aluno como informação secundária, só se existir)

São 4 linhas alteradas no total (2 em cada função de card).

