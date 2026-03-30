

## Corrigir Acesso de Gestores à Página de Comunidades

### Problema
A edge function `zapi-communities` verifica `roleData.role !== "admin"` (linha 52), bloqueando qualquer usuário que não seja admin. O usuário Miqueias tem role `gestor`, então recebe erro 403.

### Solução
Alterar a verificação de role na edge function para permitir acesso de `admin` e `gestor`.

### Alteração

**`supabase/functions/zapi-communities/index.ts`** — linha 52:

Trocar:
```typescript
if (!roleData || roleData.role !== "admin") {
```

Por:
```typescript
if (!roleData || !["admin", "gestor"].includes(roleData.role)) {
```

### Arquivo alterado
- `supabase/functions/zapi-communities/index.ts`

