

## Sistema de Módulos: CRM e Comunidades

Criar um sistema de permissões por módulo para que o admin defina quais usuários têm acesso ao **CRM** (Pipeline, Conversas, Contatos, Tarefas, Fluxos) e ao **Gerenciamento de Comunidades** (Comunidades, Campanhas).

### 1. Nova tabela `user_modules`

```sql
CREATE TABLE public.user_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module text NOT NULL, -- 'crm' ou 'comunidades'
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module)
);

ALTER TABLE public.user_modules ENABLE ROW LEVEL SECURITY;

-- Admins gerenciam, todos autenticados podem ver os próprios
CREATE POLICY "Users can view own modules" ON public.user_modules
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all modules" ON public.user_modules
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage modules" ON public.user_modules
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
```

Admins recebem acesso a ambos os módulos automaticamente (tratado no código).

### 2. Hook `usePermissions.ts`

- Buscar módulos do usuário na tabela `user_modules`
- Expor `hasModule(module: 'crm' | 'comunidades'): boolean`
- Admins têm acesso a tudo automaticamente
- Atualizar `canManageFlows`/`canViewFlows` para depender de `hasModule('crm')`
- Adicionar `canViewCommunities` → `hasModule('comunidades')` ou admin

### 3. Navegação (`AppSidebar.tsx` e `BottomNav.tsx`)

- Items CRM (Pipeline, Conversas, Contatos, Tarefas, Fluxos): visíveis se `hasModule('crm')`
- Items Comunidades (Comunidades, Campanhas): visíveis se `hasModule('comunidades')`
- Home, Configurações: sempre visíveis

### 4. Gestão de módulos no `TeamManagement.tsx`

- Para cada membro, exibir checkboxes/toggles: "CRM" e "Comunidades"
- Admin pode ativar/desativar módulos por usuário
- Ao convidar novo membro, incluir seleção de módulos

### 5. Edge Function `invite-member`

- Aceitar array `modules: string[]` no body
- Inserir registros em `user_modules` junto com o role

### Arquivos alterados
- **Migration**: criar tabela `user_modules`
- `src/hooks/usePermissions.ts`: buscar e expor módulos
- `src/components/AppSidebar.tsx`: filtrar nav por módulo
- `src/components/BottomNav.tsx`: filtrar nav por módulo
- `src/components/TeamManagement.tsx`: UI de módulos por usuário + convite
- `supabase/functions/invite-member/index.ts`: inserir módulos ao convidar

