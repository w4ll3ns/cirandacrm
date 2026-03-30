

## Registrar Contatos de Comunidades no Banco de Dados

Criar uma tabela para armazenar todos os contatos que entraram em comunidades e alimentá-la automaticamente quando novos participantes forem detectados.

### 1. Nova tabela `community_contacts`

```sql
CREATE TABLE public.community_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  name text,
  community_id text NOT NULL,        -- ID da comunidade Z-API
  community_name text,
  group_phone text,                   -- subgrupo onde entrou
  group_name text,
  campaign_id uuid REFERENCES community_campaigns(id) ON DELETE SET NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (phone, community_id, group_phone)
);

ALTER TABLE public.community_contacts ENABLE ROW LEVEL SECURITY;
-- Authenticated podem visualizar; admins gerenciam
```

O `UNIQUE` constraint evita duplicatas — o mesmo telefone no mesmo subgrupo não é inserido duas vezes.

### 2. Alimentação automática — dois pontos de entrada

**a) Edge Function `community-join` (landing page de campanha)**
Quando um lead clica para entrar via campanha e recebe o link de convite, registrar o contato na tabela `community_contacts` com os dados da campanha, grupo e telefone (se disponível via formulário na landing page — ou apenas registrar o grupo/campanha sem telefone por enquanto, e capturar depois).

**b) Edge Function `zapi-communities` → action `metadata` / `group-metadata`**
Criar uma nova action `sync-participants` que, ao ser chamada (manual ou periodicamente), compara os participantes atuais de cada subgrupo da comunidade com os já registrados em `community_contacts` e insere os novos. Isso é o mecanismo principal de detecção.

**c) Botão "Sincronizar Contatos" na UI de Comunidades**
Ao visualizar os detalhes de uma comunidade, adicionar um botão que chama `sync-participants` para carregar todos os participantes de todos os subgrupos e gravar os novos no banco.

### 3. Alterações na Edge Function `zapi-communities`

Adicionar case `sync-participants`:
- Recebe `communityId` e `communityName`
- Busca metadata da comunidade (subgrupos)
- Para cada subgrupo, busca `group-metadata` (lista de participantes)
- Faz upsert em `community_contacts` para cada participante (phone, name, community_id, group_phone, group_name)
- Retorna contagem de novos vs existentes

### 4. UI na página Communities

- **Botão "Sincronizar Contatos"** no dialog de detalhes da comunidade (ao lado dos botões existentes)
- **Nova aba/seção "Contatos"** na página de Comunidades mostrando a lista de `community_contacts` com filtros por comunidade/grupo, busca por telefone/nome, e contagem total
- Exibir badge com total de contatos registrados no card de cada comunidade

### 5. Arquivos alterados
- **Migration SQL**: criar tabela `community_contacts`
- **`supabase/functions/zapi-communities/index.ts`**: nova action `sync-participants`
- **`src/pages/Communities.tsx`**: botão de sync + aba de contatos

