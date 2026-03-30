

## Corrigir Edge Function `invite-member`

### Problema
A edge function falha com `supabaseKey is required` porque usa `Deno.env.get("SUPABASE_PUBLISHABLE_KEY")` — esse nome não existe nos secrets. O nome correto é `SUPABASE_ANON_KEY`.

### Correção

**`supabase/functions/invite-member/index.ts`** — linha 34:

Trocar:
```typescript
const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "");
```

Por:
```typescript
const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") || "");
```

Depois, re-deploy da função e teste.

### Arquivo alterado
- `supabase/functions/invite-member/index.ts`

