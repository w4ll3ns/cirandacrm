## Como medir o custo do envio de hoje e validar as otimizações

O objetivo é responder duas perguntas com dados reais:
1. **Quanto custou o envio feito hoje?** (em invocações de edge function, escritas no banco, e tamanho ocupado)
2. **As 3 otimizações aplicadas surtiram efeito?** (comparando com a baseline anterior)

Não há código novo a escrever — é uma análise via consultas SQL e logs.

---

### Métricas que vamos coletar

| Métrica | Onde mora | O que mostra |
|---|---|---|
| Invocações `zapi-webhook` nas últimas 24h | `function_edge_logs` (analytics) | Quantas vezes a Z-API chamou o webhook |
| Invocações `broadcast-scheduler` 24h | `function_edge_logs` | Confirma se o pré-check SQL cortou as chamadas a vazio |
| Invocações `zapi-community-broadcast` 24h | `function_edge_logs` | Custo direto do envio em massa de hoje |
| Linhas novas em `webhook_events` 24h | `webhook_events` (count + group by `type`) | Confirma que `MessageStatusCallback` parou de ser gravado |
| Linhas em `messages` criadas 24h | `messages` | Volume real de mensagens do envio |
| Tamanho atual do banco | `pg_database_size` + `pg_total_relation_size` por tabela | Mostra se a limpeza liberou os ~200 MB |
| Execuções de cron 24h | `cron.job_run_details` | Confirma frequência e duração média |

---

### Etapas

**1. Snapshot pós-envio (agora):**
- Rodar SQL via `supabase--read_query`:
  - `SELECT pg_size_pretty(pg_database_size(current_database()))`
  - Top 10 tabelas por tamanho
  - `SELECT type, count(*) FROM webhook_events WHERE created_at > now() - interval '24 hours' GROUP BY type`
  - `SELECT count(*), date_trunc('hour', created_at) FROM messages WHERE created_at > now() - interval '24 hours' GROUP BY 1 ORDER BY 1`
  - `SELECT count(*), status FROM cron.job_run_details WHERE start_time > now() - interval '24 hours' GROUP BY status`

**2. Invocações de edge function 24h** via `supabase--analytics_query` no `function_edge_logs`, agrupando por `function_id` e contando chamadas + média de `execution_time_ms`.

**3. Comparação antes/depois:**
- Baseline conhecida (antes dos ajustes): banco 208 MB, ~43.200 invocações/mês do scheduler, milhares de `MessageStatusCallback`/dia gravados.
- Pós-ajuste esperado: banco ~5 MB, scheduler <10 invocações/dia, zero `MessageStatusCallback` em `webhook_events`.

**4. Relatório consolidado** apresentado em chat com:
- Tabela "antes vs depois" das 3 otimizações
- Custo isolado do envio de hoje (invocações + linhas escritas)
- Diagnóstico: ✅ funcionou / ⚠️ parcialmente / ❌ regrediu, por otimização
- Recomendações se algo ficou fora do esperado

---

### O que preciso de você

Confirme um ponto antes de eu rodar:

- **Janela do envio**: foi feito "hoje" — você sabe aproximadamente o horário (manhã/tarde) ou prefere que eu olhe as últimas 24h inteiras?
- **Quero focar em todos os 3 ajustes ou só validar o envio específico?** (recomendo os 3, é o mesmo trabalho)

Assim que confirmar, executo as consultas e te entrego o relatório.
