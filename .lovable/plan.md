

# Implementar Pendências do Módulo de Fluxos

## Itens Pendentes Identificados

### 1. Adicionar "Fluxos" no BottomNav (mobile)
**`src/components/BottomNav.tsx`** — Adicionar tab "Fluxos" com ícone `Workflow`, visível apenas para admin/gestor. Importar `usePermissions` e condicionalmente incluir o item.

### 2. Configurar flow-engine no config.toml
**`supabase/config.toml`** — Adicionar `[functions.flow-engine]` com `verify_jwt = false` (chamado internamente pelo webhook com service role key).

### 3. Modo de Teste/Simulação no Builder
**`src/pages/FlowBuilder.tsx`** — Implementar modal de chat simulado ao clicar "Testar":
- Drawer/Dialog com interface de chat simples
- Percorre os nós do fluxo localmente (sem chamar edge function)
- Exibe mensagens do bot e permite digitar respostas
- Highlight do nó atual no canvas
- Lógica local que simula o motor: seguir edges, processar opções, capturar input, avaliar condições

Componente novo: **`src/components/flow/FlowTestChat.tsx`**

### 4. Contagem de Execuções na Listagem
**`src/pages/FlowList.tsx`** — Buscar count de `conversation_flow_sessions` agrupado por `flow_id` e exibir coluna "Execuções" na tabela.

### 5. Confirmação ao Desativar Fluxo
**`src/pages/FlowList.tsx`** — Adicionar AlertDialog de confirmação antes de desativar um fluxo ativo (já existe para exclusão, reutilizar padrão).

### 6. Deploy das Edge Functions
Executar deploy do `flow-engine` e `zapi-webhook` atualizados.

---

## Detalhes Técnicos

### FlowTestChat (Simulador)
- Recebe `nodes` e `edges` do canvas atual (não precisa salvar antes)
- State machine local: `currentNodeId`, `context`, `messages[]`
- Ao iniciar, encontra nó "start", segue primeira edge
- Para cada nó: exibe mensagem, aguarda input se necessário
- Interface: lista de mensagens estilo chat + input de texto
- Botão "Reiniciar" para testar de novo

### BottomNav
- Substituir tab "Tarefas" por "Fluxos" NÃO — manter os 5 tabs existentes
- Em mobile com 6 tabs fica apertado — melhor acessar via sidebar only
- Alternativa: adicionar como 6o tab apenas se admin/gestor, ajustando o layout

Vou adicionar condicionalmente como 6o item, reduzindo o tamanho dos ícones/texto para caber.

