

# Fix: adicionar dependência `@emoji-mart/react`

## Problema
O build falha porque `ConversationDetail.tsx` importa `@emoji-mart/react` e `@emoji-mart/data`, mas apenas `@emoji-mart/data` está no `package.json` — falta `@emoji-mart/react`.

## Solução
Adicionar `@emoji-mart/react` ao `package.json` nas dependencies.

### Arquivo modificado
- `package.json` — adicionar `"@emoji-mart/react": "^1.1.1"` na seção `dependencies`

