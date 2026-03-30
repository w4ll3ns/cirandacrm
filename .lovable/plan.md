

## Problemas Encontrados no Teste

### 1. Parsing incorreto da resposta da lista de comunidades
Em `Campaigns.tsx` (linha 98-99), o parsing da resposta é:
```typescript
const list = await callCommunities('list', { page: 1, pageSize: 50 });
const comms = Array.isArray(list) ? list : [];
```

Mas em `Communities.tsx` (linha 116), o mesmo dado é tratado assim:
```typescript
const list = Array.isArray(data) ? data : data?.communities || data?.data || [];
```

A Z-API pode retornar os dados como `{ communities: [...] }` ou outro formato aninhado, e o Campaigns.tsx não lida com isso, resultando em um array vazio.

### 2. Falta de verificação de sessão
Em `Communities.tsx`, a função `callCommunities` verifica a sessão antes de chamar a edge function. Em `Campaigns.tsx`, não há essa verificação, o que pode causar erro de autenticação silencioso.

### 3. Seção de grupos fica vazia sem feedback
Quando a lista retorna vazia (pelo parsing incorreto), a UI mostra a seção de grupos completamente vazia - sem mensagem de erro nem indicador.

---

### Correções

**Arquivo: `src/pages/Campaigns.tsx`**

1. Corrigir `callCommunities` para verificar sessão (igual ao Communities.tsx)
2. Corrigir `fetchCommunities` para lidar com formatos alternativos de resposta:
```typescript
const data = await callCommunities('list', { page: 1, pageSize: 50 });
const comms: Community[] = Array.isArray(data) ? data : data?.communities || data?.data || [];
```

3. Adicionar `console.log` temporário para debug da resposta recebida (remover depois)

Essas são as correções mínimas para que a seção de grupos carregue corretamente no dialog de criação de campanha, permitindo selecionar os subgrupos e completar o fluxo.

