

# Carregamento de Mensagens Sob Demanda

## Problema
O `DataContext` carrega TODAS as mensagens de TODAS as conversas no `fetchAll` inicial (`select('*')`). Com volume crescente, isso degrada performance e pode atingir o limite de 1000 linhas do Supabase.

## Solucao

Remover mensagens do carregamento global e criar um sistema de fetch por conversa.

### Mudancas

**`src/contexts/DataContext.tsx`**
1. Remover `mensagens` do estado global e do `fetchAll`
2. Remover `setMensagens` e o state associado
3. Adicionar `fetchMensagens(conversationId: string): Promise<Mensagem[]>` — busca mensagens de uma conversa especifica com cache
4. Manter cache em `Map<string, Mensagem[]>` para nao re-fetchar ao alternar conversas
5. Ajustar realtime de messages para inserir/atualizar no cache por `conversation_id`
6. Para a lista de conversas (preview da ultima mensagem), buscar apenas a ultima mensagem de cada conversa no `fetchAll` usando uma query otimizada ou armazenar `ultima_mensagem_texto` no cache de conversas

**Interface atualizada:**
```typescript
interface DataContextType {
  // remover: mensagens: Mensagem[]
  getMensagens: (conversationId: string) => Mensagem[];
  fetchMensagens: (conversationId: string) => Promise<void>;
  // ... resto igual
}
```

**`src/pages/ConversationDetail.tsx`**
- Substituir `mensagens.filter(...)` por `getMensagens(id)`
- Adicionar `useEffect` que chama `fetchMensagens(id)` ao montar/trocar de conversa
- Adicionar estado de loading local para mensagens

**`src/pages/Conversations.tsx`**
- Para preview da ultima mensagem na lista, usar o campo `ultima_mensagem_em` da conversa (ja existe) para timestamp
- Para o texto de preview, adicionar um campo `ultima_mensagem_texto` ao cache das conversas ou buscar apenas a ultima mensagem de cada conversa visivel
- Abordagem pragmatica: no `fetchAll`, buscar apenas as ultimas mensagens (1 por conversa) para preview, usando query com `limit`

### Fluxo

1. App inicia → `fetchAll` carrega conversas, responsaveis, etc. Para cada conversa, busca apenas a ultima mensagem (preview)
2. Usuario abre conversa → `fetchMensagens(convId)` busca todas mensagens daquela conversa
3. Cache guarda resultado → ao voltar para mesma conversa, usa cache
4. Realtime INSERT → adiciona ao cache da conversa correspondente + atualiza preview
5. Realtime UPDATE → atualiza no cache da conversa correspondente

### Arquivos afetados

| Arquivo | Mudanca |
|---|---|
| `src/contexts/DataContext.tsx` | Remover fetch global de messages, adicionar cache Map + fetchMensagens + getMensagens, ajustar realtime, buscar previews |
| `src/pages/ConversationDetail.tsx` | Usar getMensagens/fetchMensagens, loading local |
| `src/pages/Conversations.tsx` | Usar getMensagens para preview ou campo de preview |

