

# Corrigir exibição de opções no chat — uma abaixo da outra

## Problema
As mensagens do bloco "Pergunta com Opções" usam `\n` para separar cada opção, mas o componente de renderização de mensagens em `ConversationDetail.tsx` usa `<p className="text-sm">` sem `whitespace-pre-wrap`, fazendo com que as quebras de linha sejam ignoradas e as opções apareçam lado a lado.

## Solução
Adicionar `whitespace-pre-wrap` em todos os pontos que renderizam `msg.content_text` no componente `MessageContent` em `src/pages/ConversationDetail.tsx`:

1. **Linha 49** — legenda de imagem: `<p className="text-sm mt-1">` → `<p className="text-sm mt-1 whitespace-pre-wrap">`
2. **Linha 75** — legenda de vídeo: idem
3. **Linha 89** — legenda de documento: idem
4. **Linha 96** — texto puro (caso principal): `<p className="text-sm">` → `<p className="text-sm whitespace-pre-wrap">`

Isso fará com que `\n` seja renderizado como quebra de linha, exibindo cada opção em sua própria linha.

