# Painel de Monitoramento de Custo & Consumo (Admin)

Novo painel exclusivo para administradores que mostra, em tempo quase real, o custo estimado das últimas 24h e o consumo das edge functions.

## Onde fica

- Nova aba **"Monitoramento"** dentro de `Configurações` (`/app/configuracoes`), visível apenas para `role = admin` (usando `usePermissions().canManageSettings`).
- Alternativa caso prefira página dedicada: rota `/app/monitoramento` no menu lateral (admin-only). **Sugestão**: manter dentro de Configurações para não poluir a navegação.

## O que o painel mostra

### 1. Cards de resumo (topo)
- **Custo estimado 24h** (~$0,30/dia) — soma de Compute + Functions + Storage + Egress
- **Invocações de Edge Functions** (últimas 24h)
- **CPU total consumido** (soma de `execution_time_ms`)
- **Tamanho do banco** (MB)
- **Webhooks recebidos** (24h)

Cada card mostra valor + variação vs. 24h anteriores (seta verde/vermelha).

### 2. Tabela "Edge Functions — últimas 24h"
Colunas: Função | Invocações | CPU total (s) | CPU média (ms) | Erros | Custo estimado

Funções monitoradas: `zapi-webhook`, `zapi-community-broadcast`, `community-join`, `ai-copy-generator`, `broadcast-scheduler`, `zapi-send`, `flow-engine`, `invite-member`, `fetch-link-preview`, `zapi-communities`, `zapi-instance-manager`.

### 3. Gráfico de barras "Invocações por hora" (24h)
Recharts BarChart agrupado por hora, com toggle entre "Invocações" e "CPU (ms)".

### 4. Detalhamento de custo
Tabela com fórmula transparente:
| Recurso | Quantidade | Preço unit. | Subtotal |
|---|---|---|---|
| Compute DB (Micro) | 24h | $0,01307/h | $0,3137 |
| Edge invocations | N | $2/milhão | $… |
| Storage | X MB | $0,125/GB/mês | $… |
| Egress | Y MB | $0,09/GB | $… |
| **Total estimado** | | | **$0,XX** |

Texto-aviso: "Valores estimados. Os valores oficiais aparecem em Lovable Cloud → Cloud & AI balance."

## Como os dados são obtidos

Não existe API pública de billing. Vamos consultar tabelas internas do Postgres via uma **Edge Function `admin-usage-metrics`** (verifica JWT + role admin) que retorna JSON consolidado:

- **Invocações + CPU por função**: query em `function_edge_logs` (banco de analytics) via `supabase.rpc` indireta — ou alternativamente uma query SQL agregada na tabela `cron.job_run_details` + contagem de `webhook_events` por `event_type` como proxy para `zapi-webhook`.
- **Tamanho do banco**: `pg_database_size(current_database())`.
- **Storage**: `SELECT sum(metadata->>'size')::bigint FROM storage.objects`.
- **Egress**: estimado a partir de invocações * payload médio (aproximação) — marcado como "estimativa grosseira".

A função retorna `{ summary, hourly, perFunction, costBreakdown }`.

## Realtime / atualização

- Polling automático a cada **30s** via React Query (`refetchInterval: 30000`).
- Botão "Atualizar agora" + timestamp da última atualização.
- (Logs de função são imutáveis e não suportam Postgres Realtime — polling é o correto.)

## Detalhes técnicos

**Arquivos novos:**
- `supabase/functions/admin-usage-metrics/index.ts` — agrega métricas, valida JWT, exige role admin via `has_role`.
- `src/components/UsageMonitoringPanel.tsx` — UI completa (cards + tabela + gráfico).
- `src/hooks/useUsageMetrics.ts` — React Query hook.

**Arquivos editados:**
- `src/pages/Settings.tsx` — adicionar seção "Monitoramento" (admin-only) com o `<UsageMonitoringPanel />`.

**Constantes de preço** (centralizadas em `admin-usage-metrics/index.ts`):
```ts
const PRICING = {
  computeMicroPerHour: 0.01307,
  edgeInvocationPerMillion: 2.00,
  storagePerGbMonth: 0.125,
  egressPerGb: 0.09,
};
```

**Segurança:** RLS já protege `webhook_events`/`audit_logs` (admin-only). A edge function valida JWT e checa `has_role(user_id, 'admin')` antes de retornar dados.

**Sem mudanças de schema** — somente leitura de tabelas existentes + `pg_database_size` + `storage.objects`.

## Fora do escopo
- Alertas por e-mail/push quando custo passar de limite (pode ser fase 2).
- Histórico além de 24h (dados antigos são limpos pelo `cleanup_internal_logs`).
- Exportar CSV (fase 2 se você pedir).
