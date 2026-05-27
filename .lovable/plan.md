## Diagnóstico

Investiguei a infra agora:

- **DB**: 206 MB · RAM 15% · disco 7% · 42/160 conexões · 1/800 pool clients · 0 restarts
- **Edge functions (24h)**: 48 invocações no total (46 `zapi-webhook` + 2 `community-join`)
- **Cron**: 1.440 execuções/dia (1/min), mas só dispara HTTP quando há broadcast pendente — custo desprezível
- **Mensagens recebidas (24h)**: 4 · webhooks: 130

Nesse volume, o custo de compute + edge + storage seria **menos de US$ 1/dia** em instância padrão (Micro).

**Causa real do gasto**: você subiu a instância para Small/Medium/Large. A instância está rodando 24h cobrando por capacidade que não está sendo usada (15% de RAM). Esse é 95%+ do seu custo.

## Plano (sem impacto em rotinas)

### 1. Downgrade da instância para Micro (ou Nano se disponível) — ação manual sua

Não há mudança de código. Você faz pela UI:

1. Abrir o projeto → **Backend** (Lovable Cloud) → **Advanced settings**
2. Em **Compute / Instance size**, selecionar **Micro**
3. Confirmar — leva alguns minutos e o app fica brevemente indisponível durante o resize

**Impacto esperado nas rotinas**: nenhum. Sua carga atual (4 msg/dia, 130 webhooks, 48 edge calls) cabe folgadíssima em Micro. Se um dia o volume crescer 100x, você sobe de novo.

**Economia estimada**: de ~$10/dia para ~$0,30–0,50/dia (>95%).

### 2. Botão "Atualizar agora" no painel de monitoramento (opcional, código pequeno)

Adicionar no `UsageMonitoringPanel.tsx` um card destacado no topo mostrando:
- Tamanho atual da instância (lido de uma `setting` que você preenche manualmente, ex.: `chave='cloud_instance_size'`, `valor='micro'`)
- Aviso amarelo se `valor != 'micro'` com texto: "Instância maior que o necessário para o uso atual — considere downgrade em Backend → Advanced settings."

Isso te lembra de não esquecer a instância subida no futuro.

### 3. Verificações de sanidade que NÃO mudam código

Antes do downgrade, confirmo com você que:
- Cron `cleanup_internal_logs` continua semanal (já está, schedule `0 3 * * 0`) ✓
- Cron do broadcast-scheduler continua de minuto-em-minuto mas com guard SQL (já está) ✓
- Sem Realtime ativo em tabelas pesadas (a verificar rapidamente após sua aprovação)

## Fora do escopo

- Refatoração de edge functions (não é o gargalo)
- Mexer em RLS, triggers, índices (não é o gargalo)
- Mudar o cron de 1/min para menos frequente (economia irrelevante perto da instância)

## Resumo

**A correção é 1 clique seu na UI do Cloud (downgrade para Micro).** Posso opcionalmente adicionar o aviso visual no painel de monitoramento (item 2) para evitar reincidência. Quer que eu implemente só o item 2, ou prefere primeiro fazer o downgrade e depois conversamos?
