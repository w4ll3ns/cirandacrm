

## Fix: contagem de participantes no modal de campanha

### Problema
A mesma causa raiz do bug anterior em Communities.tsx: `c.subGroups` pode ser um objeto (truthy) retornado pela API, e `(c.subGroups || [])` nao converte para array. O `flatMap` com `.filter()` falha silenciosamente, resultando em `allSubs` vazio -- nenhuma contagem e buscada.

### Correcao

**Arquivo: `src/pages/Campaigns.tsx`**

1. **Linha ~121-122** -- No `fetchCommunities`, trocar:
```ts
const allSubs = enriched.flatMap((c: Community) =>
  (c.subGroups || []).filter(...)
```
por:
```ts
const allSubs = enriched.flatMap((c: Community) => {
  const sgs = Array.isArray(c.subGroups) ? c.subGroups : [];
  return sgs.filter(s => !s.isGroupAnnouncement).map(s => s.phone);
});
```

2. **Linha ~110** -- Na construcao do `enriched`, garantir que `subGroups` seja array:
```ts
const subs = Array.isArray(meta.subGroups) ? meta.subGroups : [];
return { ...c, ...meta, subGroups: subs };
```

3. **Na renderizacao dos subgrupos no dialog** (~linha 420-430), aplicar o mesmo `Array.isArray` guard ao iterar `comm.subGroups`.

