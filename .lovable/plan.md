

## Agendamento de Disparos em Massa

### Abordagem

Criar uma tabela `scheduled_broadcasts` que armazena disparos programados. Um cron job (pg_cron + pg_net) verifica a cada minuto se há disparos pendentes e invoca a edge function de broadcast. O usuário pode cancelar disparos ainda não enviados.

### Alterações

**1. Nova tabela `scheduled_broadcasts` (migration)**
```sql
CREATE TABLE public.scheduled_broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, processing, sent, cancelled, error
  scheduled_at timestamptz NOT NULL,
  type text NOT NULL,
  message text,
  media_url text,
  caption text,
  link_url text,
  link_title text,
  link_description text,
  link_image text,
  group_phones text[] NOT NULL,
  mention_all boolean DEFAULT false,
  results jsonb DEFAULT '[]',
  sent_count integer DEFAULT 0,
  error_count integer DEFAULT 0,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.scheduled_broadcasts ENABLE ROW LEVEL SECURITY;
-- Admin/Gestor podem gerenciar
CREATE POLICY "Admin/Gestor manage scheduled_broadcasts" ON public.scheduled_broadcasts
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gestor'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gestor'));
```

**2. Nova edge function `broadcast-scheduler/index.ts`**
- Chamada pelo cron job a cada minuto
- Busca registros com `status = 'pending'` e `scheduled_at <= now()`
- Para cada um, marca como `processing`, invoca internamente a lógica de broadcast (fetch Z-API), atualiza com resultados (`sent`/`error`)
- Reutiliza a mesma lógica do `zapi-community-broadcast` (buscar instância, montar payloads, enviar com delay)

**3. Cron job (pg_cron via insert tool)**
- Configura um job que roda a cada minuto e chama `broadcast-scheduler` via `net.http_post`

**4. `src/pages/Communities.tsx` — UI**
- No dialog de broadcast, adicionar opção "Enviar agora" vs "Agendar envio"
- Ao selecionar "Agendar", exibir um date/time picker para escolher data e hora
- Botão muda de "Iniciar Disparo" para "Agendar Disparo"
- Ao agendar: insere na tabela `scheduled_broadcasts` em vez de invocar a edge function diretamente
- Na aba "Histórico", adicionar seção de **disparos agendados** com:
  - Lista dos agendamentos pendentes com data/hora, tipo, qtd de grupos
  - Botão "Cancelar" que atualiza o status para `cancelled` (apenas se `status = 'pending'`)
  - Badge de status (Agendado, Enviando, Enviado, Cancelado, Erro)

### Fluxo

```text
Usuário agenda disparo
       │
       ▼
scheduled_broadcasts (status: pending, scheduled_at: futuro)
       │
       ▼ (cron a cada 1 min)
broadcast-scheduler verifica scheduled_at <= now() AND status = pending
       │
       ▼
Marca processing → envia via Z-API → atualiza para sent/error
```

O cancelamento é simples: se `status = 'pending'`, o usuário atualiza para `cancelled` e o cron ignora.

### Arquivos

- **Migration**: nova tabela `scheduled_broadcasts`
- **`supabase/functions/broadcast-scheduler/index.ts`**: nova edge function (cron)
- **`src/pages/Communities.tsx`**: UI de agendamento + lista de agendados + cancelamento
- **SQL insert**: configurar pg_cron job

