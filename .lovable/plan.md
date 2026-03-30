

## Corrigir Limite de 1000 Contatos de Comunidades

### Problema
Há um `.limit(1000)` explícito na query `fetchContacts` (linha 455 de `Communities.tsx`), e o Supabase também tem um limite padrão de 1000 linhas. Comunidades com mais de 1000 participantes ficam truncadas.

### Solução

**`src/pages/Communities.tsx`** — Remover o `.limit(1000)` e implementar paginação ou carregamento completo:

1. **Remover `.limit(1000)`** da query em `fetchContacts`
2. **Implementar busca paginada** para carregar todos os registros: fazer fetch em lotes de 1000 usando `.range(from, to)` até não haver mais resultados, concatenando os dados
3. Manter a filtragem/busca client-side existente sobre o conjunto completo

A edge function `zapi-communities` (sync-participants) não tem limite — ela já faz upsert de todos os participantes de todos os subgrupos. O problema é apenas na leitura/exibição.

### Arquivo alterado
- `src/pages/Communities.tsx` — ajustar `fetchContacts` para buscar todos os registros sem limite

