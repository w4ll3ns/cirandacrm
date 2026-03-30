

## Exibir badge de participantes no card da comunidade

### Problema
O badge de participantes no card só aparece se `c.participants` existir, mas os dados retornados pela listagem de comunidades (`action: list`) não incluem participantes — apenas o `communities-metadata` retorna essa informação. Por isso o badge nunca aparece.

### Solução
Ao carregar as comunidades automaticamente, buscar os metadados de cada comunidade em paralelo para obter a contagem de participantes, e armazenar num state `Record<string, number>`. Exibir o badge no card usando esse state.

### Mudanças em `src/pages/Communities.tsx`

1. **Novo state**: `communityParticipantCounts: Record<string, number>` para guardar total de participantes por comunidade ID.

2. **Após `fetchCommunities`**: Fazer chamadas paralelas de `metadata` para cada comunidade retornada, extrair `participants.length` e popular o state.

3. **No card** (linhas ~405-412): Substituir o badge condicional `(c as any).participants?.length` por uma leitura do `communityParticipantCounts[c.id]`, exibindo o badge sempre que houver dado disponível:

```tsx
<Badge variant="secondary" className="shrink-0">
  {c.subGroups?.length || 0} grupo(s)
</Badge>
{communityParticipantCounts[c.id] != null && (
  <Badge variant="outline" className="shrink-0 text-xs">
    <Users2 className="w-3 h-3 mr-1" />
    {communityParticipantCounts[c.id]} participantes
  </Badge>
)}
```

4. **Loading indicator**: Enquanto os counts estiverem sendo carregados, mostrar um skeleton/spinner sutil no lugar do badge.

