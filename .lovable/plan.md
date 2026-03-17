

# Builder de Fluxos de Conversa — Plano de Implementação

Este é um módulo complexo. Vou dividir em **3 etapas incrementais**, começando pelo backend e motor de execução, depois o editor visual, e por fim testes e métricas.

---

## ETAPA 1 — Backend, Tabelas e Motor de Execução

### 1.1 Criar tabelas via migração

6 tabelas novas com RLS:

| Tabela | Finalidade |
|---|---|
| `conversation_flows` | Definição dos fluxos (nome, status, gatilho, ativo) |
| `flow_nodes` | Nós do fluxo (tipo, config JSON, posição x/y) |
| `flow_edges` | Conexões entre nós (source, target, condição) |
| `conversation_flow_sessions` | Sessão de execução por conversa (nó atual, contexto, status) |
| `flow_execution_logs` | Log de cada ação executada |
| `flow_versions` | Versionamento (snapshot JSON do fluxo) |

**RLS**: admin e gestor gerenciam fluxos; atendente pode visualizar. Sessions e logs seguem o mesmo padrão de conversas (authenticated can view).

### 1.2 Motor de execução — Edge Function `flow-engine`

Nova edge function `supabase/functions/flow-engine/index.ts` que:

1. Recebe `conversation_id` e `input_text` (chamada pelo webhook)
2. Verifica se existe sessão ativa para a conversa
3. Se não, busca fluxo ativo compatível (por trigger_type, setor, canal)
4. Se sim, carrega nó atual e processa:
   - **Enviar mensagem**: chama `zapi-send` internamente via fetch
   - **Pergunta com opções**: envia menu, salva que aguarda input, para
   - **Capturar resposta**: valida input, salva variável no context_json
   - **Condição**: avalia e segue para edge correta
   - **Encaminhar setor / Atribuir atendente**: atualiza conversa
   - **Criar tarefa**: insere na tabela tasks
   - **Transferir para humano**: marca sessão como `transferred`, para execução
   - **Encerrar**: marca sessão `finished`
5. Registra cada passo em `flow_execution_logs`
6. Proteção contra duplicação via `external_message_id`

### 1.3 Integrar no webhook existente

Modificar `zapi-webhook/index.ts`: após inserir a mensagem inbound, chamar o flow-engine (via fetch interno) passando `conversation_id` e `content_text`. Se o flow-engine retornar que processou, não alterar o status da conversa para `nao_lida` (o engine cuida).

### 1.4 Permissões

Usar `has_role` existente nas RLS policies:
- `admin`: ALL em todas as tabelas de fluxo
- `gestor`: SELECT, INSERT, UPDATE em flows/nodes/edges; SELECT em sessions/logs
- `atendente`: SELECT em flows; pode UPDATE session status para `transferred` (interromper fluxo)

---

## ETAPA 2 — Editor Visual e Listagem

### 2.1 Dependência: React Flow

Adicionar `@xyflow/react` ao package.json (React Flow v12).

### 2.2 Novas páginas e rotas

| Rota | Componente | Descrição |
|---|---|---|
| `/app/fluxos` | `FlowList.tsx` | Listagem de fluxos com filtros |
| `/app/fluxos/:id` | `FlowBuilder.tsx` | Editor visual do fluxo |

### 2.3 Página de Listagem (`src/pages/FlowList.tsx`)

- Tabela com: nome, descrição, status (draft/active/inactive), gatilho, setor, canal, data atualização, toggle ativo/inativo
- Botões: criar novo, editar, duplicar, excluir
- Confirmação antes de desativar
- Badge visual de status

### 2.4 Página do Builder (`src/pages/FlowBuilder.tsx`)

**Barra superior:**
- Nome do fluxo (editável)
- Status badge (Rascunho / Ativo / Inativo)
- Botões: Salvar, Publicar, Ativar/Desativar, Testar, Duplicar, Voltar

**Painel esquerdo** — paleta de blocos arrastáveis:
- Início, Enviar Mensagem, Pergunta com Opções, Capturar Resposta, Condição, Encaminhar Setor, Atribuir Atendente, Transferir Humano, Atualizar Campo, Criar Tarefa, Encerrar

**Área central** — canvas React Flow:
- Nodes customizados por tipo (cores/ícones distintos)
- Edges customizadas com labels
- Zoom, pan, mini-mapa
- Drag-and-drop da paleta para o canvas

**Painel direito** — propriedades do nó selecionado:
- Formulário dinâmico conforme o tipo do bloco
- Suporte a variáveis ({{nome_contato}}, {{setor}}, etc.)
- Configurações de gatilho no bloco Início

### 2.5 Componentes auxiliares

- `src/components/flow/FlowNodeTypes.tsx` — custom nodes para React Flow
- `src/components/flow/FlowEdgeTypes.tsx` — custom edges
- `src/components/flow/NodePalette.tsx` — painel de blocos
- `src/components/flow/NodeProperties.tsx` — painel de propriedades
- `src/components/flow/FlowToolbar.tsx` — barra superior

### 2.6 Navegação

- Adicionar "Fluxos" no `AppSidebar.tsx` e `BottomNav.tsx` (ícone `Workflow`)
- Visível para admin e gestor apenas

### 2.7 Salvar / Publicar / Duplicar

- **Salvar**: persiste nodes e edges no banco (status = draft)
- **Publicar**: salva snapshot em `flow_versions`, muda status para active
- **Duplicar**: copia flow + nodes + edges com novo nome
- **Ativar/Desativar**: toggle no campo `ativo` + confirmação

---

## ETAPA 3 — Teste, Métricas e Melhorias

### 3.1 Modo simulação

- Botão "Testar" abre modal com chat simulado
- Executa o fluxo localmente sem enviar mensagens reais
- Mostra o caminho percorrido no canvas (highlight dos nós)

### 3.2 Métricas preparadas

- Query em `flow_execution_logs` para: execuções por fluxo, taxa conclusão, nó de abandono, transferências para humano
- Exibir na listagem (coluna "execuções") e futuramente em dashboard

### 3.3 Configuração de comportamento ao desativar

- Setting para definir se sessões ativas continuam ou são interrompidas ao desativar fluxo

---

## Arquivos que serão criados/modificados

**Novos:**
- `src/pages/FlowList.tsx`
- `src/pages/FlowBuilder.tsx`
- `src/components/flow/FlowNodeTypes.tsx`
- `src/components/flow/FlowEdgeTypes.tsx`
- `src/components/flow/NodePalette.tsx`
- `src/components/flow/NodeProperties.tsx`
- `src/components/flow/FlowToolbar.tsx`
- `supabase/functions/flow-engine/index.ts`

**Modificados:**
- `src/App.tsx` — novas rotas
- `src/components/AppSidebar.tsx` — link "Fluxos"
- `src/components/BottomNav.tsx` — tab "Fluxos"
- `supabase/functions/zapi-webhook/index.ts` — hook para flow-engine
- `supabase/config.toml` — config do flow-engine
- `src/hooks/usePermissions.ts` — permissões de fluxo

**Migração SQL:** 1 migração com as 6 tabelas + RLS policies

---

## Decisão necessária sobre sessões ao desativar

Quando um fluxo for desativado e houver sessões em andamento, qual comportamento preferido?

- **A**: Sessões ativas continuam até terminar
- **B**: Sessões ativas são interrompidas imediatamente

Isso será configurável via settings, mas preciso saber o padrão inicial.

