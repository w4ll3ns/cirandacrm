## Recuperar espaço em disco + mensurar custo de hoje

Dois objetivos:
1. **Liberar os ~200 MB** sem afetar nenhuma rotina do sistema
2. **Estimar em $ quanto o sistema custou hoje** no Lovable Cloud

---

### Parte 1 — Liberar disco com zero impacto

O comando padrão para devolver espaço ao SO é `VACUUM FULL`, mas ele **bloqueia a tabela** durante a execução (writes ficam esperando). Para garantir zero impacto, vou usar uma estratégia segura:

**Estratégia escolhida: `VACUUM FULL` em janela controlada**

Por quê é seguro nesse caso:
- `webhook_events` (120 MB): escrita apenas pela edge function `zapi-webhook`. Se um webhook chegar durante o vacuum (~5-15s), ele apenas espera o lock — Z-API faz retry automático, nada se perde.
- `cron.job_run_details` (53 MB): tabela interna do `pg_cron`. Nenhum código lê. Vacuum é transparente.
- `net._http_response` (24 MB): tabela interna do `pg_net`. Nenhum código lê. Vacuum é transparente.

**Mitigação adicional:** rodar em sequência rápida (não paralelo) com timeout curto. Tempo total estimado: **<30 segundos**.

**Se quiser risco ainda menor:** posso pular `webhook_events` (a única que tem escrita ativa) e rodar só nas 2 internas — libera ~77 MB sem nenhum risco de bloquear o webhook. Os 120 MB restantes em `webhook_events` serão reutilizados naturalmente pelas próximas inserções (sem inchar mais).

---

### Parte 2 — Mensurar custo de hoje em $

O Lovable Cloud cobra por 3 dimensões:

| Dimensão | Consumo 24h | Custo estimado |
|---|---|---|
| **Compute (DB)** | Instância sempre ligada (sem auto-pause em produção) | Fixo/dia conforme tamanho da instância |
| **Edge function invocations** | 190 invocações totais (179 webhook + 10 community-join + 1 broadcast) | Geralmente fração de centavo |
| **Storage do banco** | 216 MB (cai após vacuum) | Fixo/GB-mês |
| **Egress** | Tráfego de leitura do app | Variável |

**Vou consultar:**
- Métricas reais de invocações + tempo de execução total (já temos)
- Tamanho do banco antes e depois do vacuum
- O painel oficial de custo está em **Cloud → Advanced settings** (única fonte com valores em $ exatos — Lovable não expõe billing via SQL)

**Entrego:** estimativa em $ baseada nas tabelas públicas de pricing do Lovable Cloud + comparação "se nada tivesse sido otimizado, seriam X invocações e Y MB".

---

### Confirme antes de executar:

1. **Vacuum**: vai nas 3 tabelas (risco mínimo, ~15-30s total) ou só nas 2 internas (zero risco, libera ~77 MB)?
2. Após o vacuum, te entrego o relatório de custo consolidado.
