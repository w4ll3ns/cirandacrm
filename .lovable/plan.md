

# Diagnóstico e Correção: Mensagens não aparecem em tempo real + Fluxo executado sem reflexo no chat

## Problemas Identificados

### Problema 1: Fluxo executa mas não envia mensagens
Investigando o banco, o fluxo `9416f4da` tem **4 nós "start" duplicados** (IDs: `9f9b979d`, `d40af7eb`, `71dcdc35`, `21073826`), mas as **edges só conectam o último** (`21073826` → `8dcd05c4`). O flow-engine usa `.eq("type", "start").limit(1).maybeSingle()` sem ordenação, então pega `9f9b979d` — que **não tem edges**. Resultado: `session_started` → `execute_start` → `finished_no_more_nodes`. O fluxo inicia e termina imediatamente sem enviar nada.

### Problema 2: Mensagens inbound não aparecem em tempo real
As mensagens são inseridas corretamente pelo webhook (confirmado nos logs e banco), mas o Supabase Realtime pode perder a conexão silenciosamente. O `DataContext` não tem fallback de polling nem reconexão, então se o canal cair, as mensagens só aparecem ao recarregar a página.

## Soluções

### 1. Corrigir seleção do nó start no flow-engine
**Arquivo**: `supabase/functions/flow-engine/index.ts`

Alterar a query que busca o start node (linhas 133-139) para encontrar o nó start que **realmente tem edges de saída**:

```typescript
// Buscar todos os start nodes
const { data: startNodes } = await supabase
  .from("flow_nodes")
  .select("*")
  .eq("flow_id", matchedFlow.id)
  .eq("type", "start");

// Encontrar o que tem edges
let startNode = null;
for (const sn of (startNodes || [])) {
  const { data: outEdges } = await supabase
    .from("flow_edges")
    .select("id")
    .eq("source_node_id", sn.id)
    .limit(1);
  if (outEdges && outEdges.length > 0) {
    startNode = sn;
    break;
  }
}
if (!startNode) startNode = startNodes?.[0] || null;
```

### 2. Limpar nós duplicados no banco
Executar migração para remover os start nodes órfãos (sem edges) deste fluxo, mantendo apenas o conectado.

### 3. Corrigir save do FlowBuilder para evitar duplicatas futuras
**Arquivo**: `src/pages/FlowBuilder.tsx`

Adicionar verificação na função `save` para garantir que a exclusão dos nós antigos foi bem-sucedida antes de inserir novos. Usar `await` com verificação de erro nas operações de delete.

### 4. Adicionar polling fallback para mensagens em tempo real
**Arquivo**: `src/contexts/DataContext.tsx`

Adicionar um polling periódico como fallback ao realtime:
- Polling a cada 3s para conversas abertas, com backoff até 30s quando não há novas mensagens
- Verificar `ultima_mensagem_em` das conversas e recarregar dados se houver mudanças
- Manter o realtime como canal primário

### Redeploy
Redeployar o `flow-engine` após a correção.

