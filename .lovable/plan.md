

# Substituir "Aguardando" por "Concluídas" no filtro de Conversas

## Análise

O status `aguardando` **não é usado em nenhum lugar do código**. Nenhuma ação ou webhook define uma conversa como "aguardando" — ele existe apenas como opção no enum do banco e no filtro da tela. É efetivamente um filtro morto.

Já temos "Resolvidas" e "Arquivadas" como filtros separados, que cumprem papel similar de "conversas encerradas".

## Proposta

Simplificar os filtros removendo "Aguardando" e substituindo por "Concluídas", que mostrará conversas com status `resolvida` ou `arquivada` juntas. Os filtros ficariam:

| Antes | Depois |
|---|---|
| Todas | Todas |
| Não lidas | Não lidas |
| Em atendimento | Em atendimento |
| ~~Aguardando~~ | **Concluídas** |
| ~~Resolvidas~~ | *(removido)* |
| ~~Arquivadas~~ | *(removido)* |

## Alteração

### `src/pages/Conversations.tsx`
- Substituir os 3 filtros (`aguardando`, `resolvida`, `arquivada`) por um único `concluidas`
- Na lógica de filtragem, `concluidas` filtra por `status IN ['resolvida', 'arquivada']`

Nenhuma alteração de banco de dados necessária — o enum `aguardando` pode continuar existindo sem impacto.

