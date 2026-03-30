

## Correções: Carregamento automático de comunidades

### Problema 1: Communities.tsx não carrega automaticamente
A página de Comunidades não tem `useEffect` para chamar `fetchCommunities` ao montar. O usuário precisa clicar manualmente em "Carregar Comunidades".

**Correção**: Adicionar `useEffect(() => { fetchCommunities(); }, [fetchCommunities]);` para carregar automaticamente ao abrir a página. Manter o botão "Carregar Comunidades" como opção de refresh manual.

### Problema 2: Campaigns.tsx — grupos não carregam no dialog
O `fetchCommunities` só é chamado ao abrir o dialog de criação/edição, mas o carregamento pode falhar silenciosamente.

**Correção**: Adicionar logs de erro mais claros e garantir que o `fetchCommunities` é chamado corretamente ao abrir o dialog. Adicionar um botão de retry dentro do dialog caso o carregamento falhe.

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `src/pages/Communities.tsx` | Adicionar `useEffect` para auto-carregar comunidades ao montar |
| `src/pages/Campaigns.tsx` | Adicionar botão de retry no dialog + melhorar feedback de erro |

### Detalhes técnicos

**Communities.tsx** — adicionar após a definição de `fetchCommunities`:
```typescript
useEffect(() => { fetchCommunities(); }, [fetchCommunities]);
```

**Campaigns.tsx** — no bloco de "Grupos / Subgrupos" do dialog, adicionar um botão de retry quando `communities.length === 0` e `!loadingCommunities`, permitindo recarregar sem fechar o dialog.

