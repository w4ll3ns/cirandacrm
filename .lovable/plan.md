

## Menção não funciona para imagem, vídeo e link

### Problema
A correção anterior contra mensagens duplicadas desabilitou completamente a menção para `image`, `video` e `link`. Resultado: a flag `mention_all` é ignorada silenciosamente nesses tipos. Seus últimos disparos agendados eram todos do tipo `image` com `mention_all: true` — por isso ninguém foi mencionado.

### Causa raiz
A matriz de capacidades marca `nativeMention: false` para image/video/link porque a API Z-API não aceita o campo `mentioned` nesses endpoints. A correção anterior removeu o follow-up de texto para evitar duplicação, mas junto removeu qualquer forma de mencionar.

### Solução
Para tipos que não suportam menção nativa, enviar um **follow-up curto de menção** após a mídia — mas com uma mensagem mínima (ex: "☝️") em vez de repetir o texto/caption inteiro. Isso resolve a duplicação E mantém a menção.

### Alterações

**1. `supabase/functions/zapi-community-broadcast/index.ts`**
- Após enviar image/video/link com sucesso, se `mention_all` estiver ativo, enviar um `send-text` follow-up com mensagem curta "☝️" + array `mentioned` com todos os participantes
- Manter o comportamento atual para `text` e `gif` (menção nativa inline)
- `audio` continua sem menção

**2. `supabase/functions/broadcast-scheduler/index.ts`**
- Mesma lógica de follow-up curto para agendamentos de image/video/link com `mention_all: true`

**3. `src/pages/Communities.tsx`**
- Reabilitar o toggle "Mencionar todos" para image, video e link
- Adicionar tooltip explicando que nesses tipos a menção será enviada como mensagem separada curta

### Comportamento final por tipo

```text
Tipo     | Menção                              | Mensagens
---------|-------------------------------------|----------
text     | Nativa (inline)                     | 1
gif      | Nativa (inline)                     | 1
image    | Follow-up "☝️" com mentioned        | 2
video    | Follow-up "☝️" com mentioned        | 2
link     | Follow-up "☝️" com mentioned        | 2
audio    | Não suportada                       | 1
```

