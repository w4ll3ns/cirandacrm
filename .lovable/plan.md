

## Correção: Grupos/Subgrupos não aparecem no dialog de Nova Campanha

### Causa raiz

Os dados da Z-API mostram que **todos** os subgrupos retornados possuem `isGroupAnnouncement: true`. O código atual filtra esses grupos com `filter(s => !s.isGroupAnnouncement)`, removendo todos e deixando a lista vazia.

Na página de Comunidades, esses mesmos grupos são exibidos normalmente porque a lógica de filtro é diferente. No contexto de campanhas, faz sentido mostrar **todos** os subgrupos (incluindo os de anúncio), pois o objetivo é vincular grupos para receber participantes.

### Correção

**Arquivo: `src/pages/Campaigns.tsx`**

Remover o filtro `!s.isGroupAnnouncement` na linha 399, permitindo que todos os subgrupos sejam listados para seleção:

```typescript
// Antes:
const subs = (comm.subGroups || []).filter(s => !s.isGroupAnnouncement);

// Depois:
const subs = comm.subGroups || [];
```

Isso é a única mudança necessária. Os subgrupos passarão a aparecer no seletor do dialog.

