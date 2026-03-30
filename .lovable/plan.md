

## Melhorar Captura de Nomes dos Contatos de Comunidades

O código atual já salva `p.name` dos participantes retornados pela Z-API, mas a API do grupo-metadata pode retornar o nome em campos diferentes: `name` (nome salvo nos contatos), `short` (nome abreviado), ou `notify` (pushname do WhatsApp). Precisamos capturar todas essas variantes.

### Alteração na Edge Function `zapi-communities`

No case `sync-participants`, ao mapear participantes, usar fallback entre os campos disponíveis:

```typescript
name: p.name || p.short || p.notify || null
```

Isso garante que, mesmo que `name` esteja vazio, usaremos `short` ou `notify` como alternativa.

### Arquivo alterado
- `supabase/functions/zapi-communities/index.ts` — ajustar mapeamento do nome do participante no `sync-participants`

