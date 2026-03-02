

# Fix: Scroll apenas nas mensagens no mobile

## Problema
No iPhone, a página inteira rola — header e campo de input saem da tela. O layout deveria fixar header no topo e input no fundo, com apenas as mensagens rolando.

## Causa
O `ConversationDetail` usa `h-screen` e `flex flex-col`, mas no iOS o `h-screen` não desconta a barra de endereço do Safari, causando overflow. Além disso, a área de mensagens com `overflow-y-auto` perde a contenção quando o viewport muda.

## Solução — `src/pages/ConversationDetail.tsx`

Trocar `h-screen` por `h-[100dvh]` (dynamic viewport height) que respeita a barra do Safari no iOS. Isso garante que o container flex ocupe exatamente a tela visível, mantendo:

- **Header** → `shrink-0` (já está)
- **Mensagens** → `flex-1 overflow-y-auto min-h-0` (adicionar `min-h-0` para que o flex item respeite o overflow)
- **Input** → `shrink-0` (já está)

### Alteração na linha 88:
```tsx
// De:
<div className={`flex flex-col ${isEmbedded ? 'h-full' : 'h-screen'} bg-muted`}>

// Para:
<div className={`flex flex-col ${isEmbedded ? 'h-full' : 'h-[100dvh]'} bg-muted`}>
```

### Alteração na linha 154 (área de mensagens):
```tsx
// De:
<div className="flex-1 overflow-y-auto p-4 space-y-2">

// Para:
<div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
```

Duas linhas alteradas, resolve o problema no iOS sem afetar desktop ou modo embedded.

