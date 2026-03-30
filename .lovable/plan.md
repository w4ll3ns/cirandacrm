

## Histórico de Disparos em Massa

### Contexto
Salvar cada disparo (broadcast) feito para comunidades, registrando tipo, conteúdo, grupos alvo, resultados e quem disparou.

### Alterações

**1. Migration — Nova tabela `broadcast_logs`**
```sql
CREATE TABLE public.broadcast_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  type text NOT NULL,              -- text, image, audio, video, link
  message text,
  media_url text,
  caption text,
  link_url text,
  link_title text,
  link_description text,
  link_image text,
  group_phones text[] NOT NULL,
  results jsonb NOT NULL DEFAULT '[]',
  sent_count integer NOT NULL DEFAULT 0,
  error_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
```
RLS: admin/gestor pode ver e inserir.

**2. `src/pages/Communities.tsx` — Salvar após disparo**
No `handleBroadcast`, após receber os resultados, inserir registro na `broadcast_logs` com todos os dados do disparo e resultados.

**3. `src/pages/Communities.tsx` — Nova aba "Histórico"**
Adicionar uma aba "Histórico" no Tabs existente (ao lado de Comunidades e Contatos) que:
- Lista os disparos em ordem decrescente (mais recente primeiro)
- Mostra: data/hora, tipo (badge), mensagem (truncada), qtd grupos, enviados/erros
- Permite expandir para ver detalhes completos (grupos, resultados individuais)

### Arquivos alterados
- Migration (nova tabela `broadcast_logs`)
- `src/pages/Communities.tsx` — salvar disparo + aba de histórico

