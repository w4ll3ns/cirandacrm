

## Problema

O botão "Disparar Mensagem" está desabilitado porque `allGroups` é calculado a partir de `communities[].subGroups`, mas a chamada de listagem (`list`) da Z-API não retorna `subGroups` — esses dados só vêm quando se busca os metadados individuais de cada comunidade (`metadata`).

Resultado: `allGroups.length === 0` sempre, e o botão fica `disabled`.

## Solução

Após carregar a lista de comunidades, buscar automaticamente os metadados (incluindo `subGroups`) de cada uma delas, e mesclar esses dados no estado `communities`.

### Alterações em `src/pages/Communities.tsx`

1. **No `fetchCommunities`**: Após obter a lista, fazer um loop chamando `callCommunities('metadata', { communityId: c.id })` para cada comunidade e mesclar os `subGroups` retornados no array de comunidades.

2. **Atualizar o estado**: Substituir cada community no array com os dados enriquecidos (incluindo `subGroups`, `invitationLink`, etc.).

3. **Indicador de loading**: Manter o estado de loading ativo enquanto os metadados estão sendo carregados, com feedback tipo "Carregando grupos... (3/5)".

### Detalhe técnico

```typescript
// Dentro de fetchCommunities, após obter a lista:
const enriched = await Promise.all(
  list.map(async (c) => {
    try {
      const meta = await callCommunities('metadata', { communityId: c.id });
      return { ...c, ...meta, subGroups: meta.subGroups || [] };
    } catch {
      return c;
    }
  })
);
setCommunities(enriched);
```

Isso garante que `allGroups` terá dados e o botão ficará habilitado.

