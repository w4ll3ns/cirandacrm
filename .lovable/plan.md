

## Exibir quantitativo de participantes por subgrupo

### Problema atual
A Z-API retorna participantes apenas no nível da comunidade via `communities-metadata`. Para saber quantos participantes cada subgrupo tem, é necessário chamar `group-metadata/{phone}` para cada subgrupo individualmente (como já é feito no edge function `community-join`).

### Solução

**1. Edge Function `zapi-communities` — nova action `group-metadata`**

Adicionar uma action que aceita um `groupPhone` e retorna os metadados do grupo (incluindo lista de participantes):

```typescript
case "group-metadata": {
  zapiResponse = await fetch(`${baseUrl}/group-metadata/${params.groupPhone}`, {
    method: "GET",
    headers: { "Content-Type": "application/json", ...(clientToken ? { "Client-Token": clientToken } : {}) },
  });
  break;
}
```

**2. Frontend `Communities.tsx` — Detalhes da comunidade**

No dialog de "Detalhes", após carregar os metadados, buscar o `group-metadata` de cada subgrupo para obter a contagem de participantes. Exibir ao lado de cada subgrupo:

```
📌 Grupo de Avisos          — 245 participantes
   Grupo Turma A            — 198 participantes
   Grupo Turma B            — 87 participantes
```

**3. Frontend `Communities.tsx` — Card da comunidade**

No card de cada comunidade, exibir o total de participantes da comunidade (já disponível em `metadata.participants.length`) quando os dados estiverem carregados.

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `supabase/functions/zapi-communities/index.ts` | Nova action `group-metadata` |
| `src/pages/Communities.tsx` | Buscar contagem de participantes por subgrupo no dialog de detalhes; exibir total no card |

### Fluxo técnico

1. Ao abrir "Detalhes", o `handleViewMeta` já busca `communities-metadata`
2. Após receber os subgrupos, fazer chamadas paralelas `group-metadata` para cada subgrupo
3. Armazenar contagens em um state `Record<string, number>` (phone → count)
4. Exibir badge com contagem ao lado de cada subgrupo no dialog
5. No card, exibir participantes totais da comunidade (soma ou dado do metadata)

