

# Fix: Prevenir zoom automático no iOS ao focar inputs

## Problema
No iPhone/Safari, quando o usuário toca em um campo de texto com `font-size` menor que 16px, o navegador faz zoom automático. Isso atrapalha a usabilidade.

## Causa
O iOS Safari aplica zoom em qualquer `<input>`, `<textarea>` ou `<select>` com `font-size` inferior a 16px.

## Solução

### 1. `index.html` — Desabilitar zoom via meta viewport
Alterar a meta tag viewport adicionando `maximum-scale=1`:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
```

### 2. `src/index.css` — Garantir font-size mínimo de 16px nos inputs no mobile
Adicionar regra global para inputs em telas touch:
```css
@media screen and (-webkit-min-device-pixel-ratio: 0) {
  input, textarea, select {
    font-size: 16px !important;
  }
}
```

Isso resolve o zoom em todas as telas do app, não só no chat.

