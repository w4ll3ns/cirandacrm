

## Módulos por Admin — Controle granular de acesso para administradores

### Problema atual
Administradores têm acesso automático a todos os módulos (`if (isAdmin) return true` no `usePermissions`). A UI esconde os checkboxes de módulos para admins, mostrando apenas "Admins têm acesso a todos os módulos".

### Solução
Permitir que admins também sejam atribuídos a módulos específicos, exatamente como gestores e atendentes.

### Alterações

**1. `src/hooks/usePermissions.ts`**
- Remover o bypass `if (isAdmin) return true` do `hasModule()`
- Admins passam a respeitar a tabela `user_modules` como qualquer outro perfil
- Permissões administrativas (gerenciar equipe, configurações, etc.) continuam vinculadas ao role `admin`, mas a visibilidade de módulos (CRM vs Comunidades) passa a depender de `user_modules`

**2. `src/components/TeamManagement.tsx`**
- Remover a condição `!isAdmin` que esconde os checkboxes de módulos (linha 210)
- Remover o texto "Admins têm acesso a todos os módulos" (linhas 223-225)
- Exibir checkboxes de módulos para todos os perfis, incluindo admins

**3. `supabase/functions/invite-member/index.ts`**
- Nenhuma alteração necessária — já envia módulos para admins ao criar o usuário

### Resultado
- Admin com módulo `crm` → vê Pipeline, Conversas, Contatos, Tarefas, Fluxos
- Admin com módulo `comunidades` → vê Comunidades e Campanhas  
- Admin com ambos → vê tudo (como antes)
- Permissões de gestão (equipe, Z-API, pipeline config) continuam exclusivas do role `admin`

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/hooks/usePermissions.ts` | Editar (remover bypass admin no hasModule) |
| `src/components/TeamManagement.tsx` | Editar (mostrar checkboxes para admins) |

