

# Fix: Centralizar título na tela de Login (desktop)

## Problema
O `<h1>` na linha 57 não tem `text-center`, então o texto longo "Centro Educacional Hora de Aprender" fica alinhado à esquerda dentro do painel, ficando visualmente estranho.

## Solução
Adicionar `text-center` ao `<h1>` do painel esquerdo (desktop), linha 57:

```html
<h1 className="text-3xl font-bold text-primary-foreground mb-2 text-center">
  Centro Educacional Hora de Aprender
</h1>
```

Alteração em um único arquivo: `src/pages/Login.tsx`, linha 57.

