

## Exibir quantidade atual de participantes nos subgrupos ao cadastrar campanha

### Problema
No dialog de "Nova Campanha", os subgrupos são listados sem informação de quantos participantes já existem em cada grupo. O usuário precisa dessa informação para configurar os limites corretamente.

### Solução

**Arquivo: `src/pages/Campaigns.tsx`**

1. Adicionar state `groupParticipantCounts: Record<string, number>` para armazenar contagens por phone.

2. Após o `fetchCommunities` carregar e enriquecer as comunidades, buscar `group-metadata` em paralelo para cada subgrupo de todas as comunidades. Popular o state com `phone -> participants.length`.

3. Na listagem de subgrupos no dialog (linha ~414), exibir a contagem atual ao lado do nome do grupo:

```
[x] @DEZENINHAS - #99    (1.245 atuais)    Máx: 2000
```

Formato: badge discreto com `text-muted-foreground` mostrando `{count} atuais` entre o nome e o campo "Máx".

4. Mostrar um indicador de loading (spinner pequeno) enquanto as contagens estão sendo carregadas.

