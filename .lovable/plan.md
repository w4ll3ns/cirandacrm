

# Adicionar histórico de atendentes e badge do último atendente nas conversas

## Alterações

### 1. `src/types/index.ts`
- Adicionar tipo `HistoricoAtendente`:
  ```ts
  export interface HistoricoAtendente {
    usuario_id: string;
    inicio_em: string;
    fim_em?: string;
  }
  ```
- Adicionar campo `historico_atendentes: HistoricoAtendente[]` na interface `Conversa`

### 2. `src/data/mock.ts`
- Gerar `historico_atendentes` para cada conversa com 1-3 atendentes anteriores (usando os 3 usuários internos), onde o último é o `responsavel_interno_id` atual

### 3. `src/pages/Conversations.tsx`
- Importar `Badge` e `usuarios` do mock
- No item da lista, abaixo da última mensagem, exibir um `Badge variant="secondary"` com o primeiro nome do último atendente (baseado no último item de `historico_atendentes`)
- Formato: `🎧 Fernanda`

### 4. `src/pages/ConversationDetail.tsx`
- No header ou em seção colapsável, exibir o histórico completo de atendentes com nome e datas
- Ao enviar uma mensagem outbound, se o usuário logado for diferente do último atendente, adicionar nova entrada no histórico via `updateConversa`

### 5. `src/contexts/DataContext.tsx`
- Nenhuma alteração estrutural necessária — `updateConversa` já aceita `Partial<Conversa>`

