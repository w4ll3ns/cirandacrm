

## Campanhas de Comunidades com Limite de Participantes e Landing Page Pública

### Resumo

Criar um sistema de **campanhas** que agrupa comunidades/subgrupos com limite máximo de participantes por subgrupo. Cada campanha gera um **link público único** (landing page) onde o lead clica para entrar — o sistema verifica automaticamente qual subgrupo tem vaga e redireciona para o link de convite do WhatsApp correspondente.

### Arquitetura

```text
┌──────────────────────────────┐
│  Admin: Gerenciar Campanhas  │
│  /app/campanhas              │
│  - Criar campanha            │
│  - Nome, descrição, imagem,  │
│    cores                     │
│  - Vincular subgrupos com    │
│    limite max por subgrupo   │
└──────────┬───────────────────┘
           │
┌──────────▼───────────────────┐
│  DB: community_campaigns     │
│  + campaign_groups           │
│  (limite, subgrupo, phone)   │
└──────────┬───────────────────┘
           │
┌──────────▼───────────────────┐
│  Landing Page Pública        │
│  /entrar/:slug               │
│  - Sem login                 │
│  - Logo, título, botão       │
│  - Ao clicar: chama edge fn  │
└──────────┬───────────────────┘
           │ invoke
┌──────────▼───────────────────┐
│  Edge Fn: community-join     │
│  - Lê subgrupos da campanha  │
│  - Busca metadata de cada um │
│    (participant count via     │
│    Z-API)                    │
│  - Encontra primeiro com     │
│    vagas                     │
│  - Retorna invitationLink    │
└──────────────────────────────┘
```

### 1. Tabelas no banco de dados

**`community_campaigns`** — dados da campanha:
- `id` (uuid, PK)
- `nome` (text)
- `descricao` (text, nullable)
- `imagem_url` (text, nullable — URL da imagem de capa)
- `cor_primaria` (text, default `#8B5CF6`)
- `cor_fundo` (text, default `#FFFFFF`)
- `slug` (text, unique — gerado automaticamente, usado na URL pública)
- `ativa` (boolean, default true)
- `created_at`, `updated_at`
- RLS: admin pode CRUD, público pode SELECT (para a landing page)

**`campaign_groups`** — subgrupos vinculados à campanha com limite:
- `id` (uuid, PK)
- `campaign_id` (uuid, FK → community_campaigns)
- `community_id` (text — ID da comunidade Z-API)
- `community_name` (text — nome para exibição)
- `group_phone` (text — phone do subgrupo)
- `group_name` (text)
- `max_participants` (integer, default 1000)
- `sort_order` (integer, default 0 — ordem de prioridade para preenchimento)
- `created_at`
- RLS: admin pode CRUD, público pode SELECT

### 2. Edge Function `community-join`

- **Sem autenticação** (público)
- Recebe `{ slug }` como parâmetro
- Busca a campanha ativa pelo slug
- Carrega os `campaign_groups` ordenados por `sort_order`
- Para cada grupo, busca metadata da Z-API (via instância ativa) para contar participantes atuais
- Compara com `max_participants`
- Retorna o `invitationLink` do primeiro grupo com vagas disponíveis
- Se nenhum grupo tem vaga, retorna erro "Comunidade lotada"

### 3. Página pública `/entrar/:slug`

- Rota pública (fora do `/app`, sem login)
- Busca dados da campanha diretamente do banco (via supabase client com anon key — RLS permite SELECT público)
- Exibe: imagem de capa, nome, descrição, botão "Entrar na Comunidade" com cores personalizadas
- Ao clicar no botão:
  - Chama a edge function `community-join` passando o slug
  - Recebe o link de convite do WhatsApp
  - Redireciona o usuário (`window.location.href = invitationLink`)
  - Se lotado, exibe mensagem "Comunidade cheia no momento"

### 4. Página admin de campanhas `/app/campanhas`

- Listagem de campanhas existentes
- Criar/editar campanha: nome, descrição, imagem (URL), cor primária, cor de fundo
- Seletor de subgrupos: lista todos os subgrupos de todas as comunidades carregadas, com checkbox e campo de limite máximo para cada um selecionado
- Copiar link público da campanha
- Ativar/desativar campanha

### 5. Alterações no roteamento

- Adicionar rota pública `/entrar/:slug` → `CampaignLanding.tsx`
- Adicionar rota protegida `/app/campanhas` → `Campaigns.tsx`
- Adicionar link no sidebar para "Campanhas"

### Arquivos criados/alterados

| Arquivo | Ação |
|---|---|
| Migration SQL | Criar tabelas `community_campaigns` e `campaign_groups` |
| `supabase/functions/community-join/index.ts` | Criar edge function pública |
| `src/pages/CampaignLanding.tsx` | Criar landing page pública |
| `src/pages/Campaigns.tsx` | Criar página admin de campanhas |
| `src/App.tsx` | Adicionar rotas |
| `src/components/AppSidebar.tsx` | Adicionar link "Campanhas" |

