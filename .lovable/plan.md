

## Corrigir Nomes dos Contatos de Comunidades

### Problema
O endpoint Z-API `group-metadata/{groupPhone}` retorna participantes apenas com o campo `phone` — sem nenhum campo de nome. O código atual tenta ler `p.name || p.short || p.notify` mas nenhum desses campos existe na resposta, resultando em todos os nomes `null` no banco.

### Solução
No case `sync-participants` da edge function `zapi-communities`, após coletar todos os phones dos participantes, buscar os nomes usando o endpoint `/contacts` da Z-API (que retorna `name`, `short`, `notify`, `phone`) e cruzar os dados antes do upsert.

### Alterações

**`supabase/functions/zapi-communities/index.ts`** — case `sync-participants`:

1. Antes do loop de subgrupos, buscar todos os contatos da instância via `GET /contacts` (paginado) e criar um Map `phone → name` para lookup rápido
2. No mapeamento de participantes, fazer lookup no Map de contatos para obter o nome: `contactsMap.get(p.phone) || null`
3. A busca de contatos usa o mesmo padrão paginado já existente no case `list`

### Fluxo técnico

```text
1. GET /contacts?page=1&pageSize=500  →  Map<phone, name>
   (repetir até não ter mais páginas)
2. Para cada subgrupo:
   GET /group-metadata/{sg.phone}  →  lista de phones
3. Cruzar phone com Map para obter nome
4. Upsert no community_contacts com nome preenchido
```

### Arquivo alterado
- `supabase/functions/zapi-communities/index.ts`

