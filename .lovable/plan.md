

## Corrigir 404 no Vercel para rotas SPA

### Problema
O Vercel serve arquivos estáticos e não sabe redirecionar rotas como `/entrar/:slug` para o `index.html`. Como o app é uma SPA (Single Page Application) com React Router, todas as rotas precisam ser redirecionadas para `index.html`.

### Solução
Criar um arquivo `vercel.json` na raiz do projeto com uma regra de rewrite que redireciona todas as rotas para `index.html`.

### Alteração

**Criar `vercel.json`** na raiz do projeto:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Arquivo alterado
- `vercel.json` (novo)

