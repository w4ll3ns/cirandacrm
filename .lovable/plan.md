## Otimização de uso do Lovable Cloud — 3 etapas

Aplicar as 3 mudanças aprovadas, em sequência segura, para reduzir ~97% do tamanho do banco e ~80% das invocações de edge function, **sem impacto no funcionamento atual**.

---

### Etapa 1 — Limpeza e retenção de tabelas internas (zero impacto)

Migration única que:

1. **Deleta `webhook_events` antigos** (>7 dias) — foco em `MessageStatusCallback` (227k linhas).
2. **Cria job pg_cron de retenção semanal** para:
   - `webhook_events` → mantém 7 dias
   - `cron.job_run_details` → mantém 7 dias
   - `net._http_response` → mantém 3 dias
3. Executa `VACUUM` (não `FULL` em migration — apenas reclaim padrão via autovacuum após DELETE massivo).

**Impacto funcional:** nenhum. Tabelas são logs/telemetria que nenhum código de aplicação consulta.

---

### Etapa 2 — Pré-check SQL no cron do broadcast-scheduler

Mantém o cron rodando **a cada 1 minuto** (não muda frequência, preserva pontualidade dos agendamentos), mas envolve o `net.http_post` em um `IF EXISTS (... scheduled_broadcasts WHERE status='pending' AND scheduled_at <= now())`.

- Reagenda o cron via `cron.unschedule` + `cron.schedule` com o novo SQL.
- Resultado: edge function só é chamada quando há trabalho real. Invocações caem de 1.440/dia para apenas as necessárias (tipicamente <10/dia).

**Impacto funcional:** nenhum. Agendamentos continuam sendo processados no minuto correto.

---

### Etapa 3 — Parar de gravar `MessageStatusCallback` em `webhook_events`

Editar `supabase/functions/zapi-webhook/index.ts`:

- Mover o `insert` em `webhook_events` para **depois** do early-return de `MessageStatusCallback`, ou condicionar a `payload.type !== "MessageStatusCallback"`.
- O `UPDATE` em `messages` (linhas 60-79) **continua intacto** — status de mensagens segue funcionando.

**Impacto funcional:** nenhum. Apenas para de duplicar payload bruto num log que ninguém consulta. Eventos `ReceivedCallback` e outros continuam sendo logados.

---

### Ordem de execução

1. Migration da Etapa 1 (requires-approval do usuário)
2. Insert/SQL da Etapa 2 (via `supabase--insert` pois contém URL+anon key)
3. Edição do arquivo `zapi-webhook/index.ts` (Etapa 3) — deploy automático

### Arquivos afetados

| Arquivo | Ação |
|---|---|
| `supabase/migrations/*_cleanup_and_retention.sql` | Criar (Etapa 1) |
| `cron.job` `broadcast-scheduler-cron` | Reagendar via SQL (Etapa 2) |
| `supabase/functions/zapi-webhook/index.ts` | Editar (Etapa 3) |

### Resultado esperado

- Banco: 208 MB → ~5 MB
- Invocações edge/mês: 43.200 → <300
- Escritas/dia: 5.000+ → dezenas
- **Funcionalidades preservadas:** envio agendado, status de mensagens (sent/delivered/read), webhook de mensagens recebidas, flow engine.
