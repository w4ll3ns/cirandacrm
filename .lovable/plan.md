

## Flag de Criação Automática de Comunidade + Configurações Z-API

### Contexto
Quando todos os grupos de uma campanha estão lotados e a flag `auto_create_community` está ativa, o sistema cria automaticamente uma nova comunidade no WhatsApp. O nome segue o padrão sequencial: se a campanha tem comunidades terminando em `#55`, a próxima será `#56`.

### API Z-API utilizada

**Criar comunidade**: `POST /communities` com `{ name, description }`
- Retorna `{ id, subGroups: [{ name, phone }] }`

**Configurar comunidade**: `POST /communities/settings` com:
- `communityId` (string, obrigatório) - ID da comunidade
- `whoCanAddNewGroups` (string: `"admins"` ou `"all"`, obrigatório) - Quem pode adicionar novos grupos

### Alterações

**1. Migration - Nova coluna na tabela `community_campaigns`**
```sql
ALTER TABLE public.community_campaigns
  ADD COLUMN auto_create_community boolean NOT NULL DEFAULT false;
```

**2. `src/pages/Campaigns.tsx` - Toggle no formulário**
- Adicionar estado `formAutoCreate` (boolean)
- Switch no formulário: "Criar comunidade automaticamente quando todos os grupos estiverem lotados"
- Salvar/carregar `auto_create_community` no insert/update
- Atualizar tipo `Campaign` com `auto_create_community`

**3. `supabase/functions/community-join/index.ts` - Lógica de auto-criação**
Após confirmar que todos os grupos estão lotados e `campaign.auto_create_community === true`:
1. Extrair o número sequencial do nome da última comunidade (ex: `@DEZENINHAS - #98` → 98)
2. Criar nova comunidade: `POST /communities` com `{ name: "@DEZENINHAS - #99" }`
3. Aplicar configurações: `POST /communities/settings` com `{ communityId, whoCanAddNewGroups: "admins" }`
4. Buscar metadata para obter subgrupo e link de convite
5. Inserir novo registro em `campaign_groups` com `max_participants` herdado do primeiro grupo
6. Retornar o link de convite ao usuário

A lógica de extração do sequencial:
- Pega o nome da última comunidade nos `campaign_groups` da campanha
- Usa regex para encontrar `#(\d+)` no final do nome
- Incrementa +1 para o novo nome
- Se não encontrar padrão, usa `#2` como fallback

**4. `supabase/functions/zapi-communities/index.ts` - Novo action `community-settings`**
- Adicionar action `community-settings` que faz proxy para `POST /communities/settings`
- Body: `{ communityId, whoCanAddNewGroups }`

### Arquivos alterados
- Migration (nova coluna `auto_create_community`)
- `src/pages/Campaigns.tsx`
- `supabase/functions/community-join/index.ts`
- `supabase/functions/zapi-communities/index.ts`

