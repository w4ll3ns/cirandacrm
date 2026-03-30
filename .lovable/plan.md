

## Desativar (soft) vs Excluir comunidade

### Problema atual
O botão "Desativar" chama a Z-API para desconectar a comunidade no WhatsApp (ação destrutiva). O usuário quer separar em duas ações:
- **Desativar**: flag local no sistema (soft-disable), não afeta o WhatsApp
- **Excluir**: ação destrutiva atual (Z-API deactivate), com confirmação digitando "excluir"

### Alterações

**1. Migration — Nova tabela `community_disabled`**
Tabela simples para rastrear comunidades desativadas localmente:
```sql
CREATE TABLE public.community_disabled (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id text NOT NULL UNIQUE,
  disabled_at timestamptz NOT NULL DEFAULT now(),
  disabled_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.community_disabled ENABLE ROW LEVEL SECURITY;
-- Políticas: authenticated pode ver, admin pode gerenciar
```

**2. `src/pages/Communities.tsx`**

- **Carregar comunidades desativadas** do banco ao iniciar e manter em estado local `disabledIds: Set<string>`
- **Botão "Desativar/Ativar"** (toggle): insere ou remove registro na tabela `community_disabled`. Comunidade desativada mostra badge "Desativada" e visual esmaecido (opacity)
- **Botão "Excluir"** (vermelho): abre dialog de confirmação onde o usuário precisa digitar "excluir" para confirmar. Só então chama `handleDeactivate` (Z-API)
- **Filtrar comunidades desativadas** das rotinas: não aparecem no disparo em massa, não são usadas como opção em campanhas

**3. `src/pages/Campaigns.tsx`**
- Ao buscar grupos para campanhas, filtrar comunidades que estão na tabela `community_disabled`

**4. `supabase/functions/community-join/index.ts`**
- Antes de processar o join, verificar se a comunidade do grupo não está desativada

### Arquivos alterados
- Migration (nova tabela `community_disabled`)
- `src/pages/Communities.tsx` — lógica de desativar/ativar + dialog de exclusão com digitação
- `src/pages/Campaigns.tsx` — filtrar comunidades desativadas
- `supabase/functions/community-join/index.ts` — verificar status antes do join

