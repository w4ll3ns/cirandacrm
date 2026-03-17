

# Adicionar Contadores em Todos os Filtros de Conversas

## Alteração

### `src/pages/Conversations.tsx` (linhas 74-84)

Substituir a lógica atual que só conta "não lidas" por uma função genérica que calcula contadores para cada filtro relevante (`nao_lida`, `em_atendimento`, `concluidas`). O filtro "Todas" não terá contador.

A lógica de contagem usará `useMemo` para calcular os counts uma vez, e no render do botão exibirá `(N)` quando `count > 0` para cada filtro (exceto "todas").

Para `concluidas`, contará conversas com status `resolvida` ou `arquivada`, mantendo consistência com o filtro existente.

