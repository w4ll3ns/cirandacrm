

## Auto-fetch de preview de link ao criar campanha

### Problema
Hoje o usuário precisa preencher manualmente o nome, descrição e URL da imagem ao criar uma campanha. O ideal é colar um link e o sistema extrair automaticamente o preview (OG tags: título, descrição, imagem).

### Solução

#### 1. Nova Edge Function `fetch-link-preview`
- Recebe uma URL no body
- Faz fetch do HTML da página
- Extrai as meta tags Open Graph: `og:title`, `og:description`, `og:image`
- Retorna `{ title, description, image }` para o frontend

#### 2. Alterações no formulário de campanha (`src/pages/Campaigns.tsx`)
- Adicionar um novo campo "URL de referência" no topo do formulário
- Ao colar/digitar uma URL e clicar em um botão "Buscar preview" (ou com debounce ao colar):
  - Chamar `supabase.functions.invoke('fetch-link-preview', { body: { url } })`
  - Preencher automaticamente `formName` com `og:title`, `formDesc` com `og:description`, `formImage` com `og:image`
  - Mostrar loading enquanto busca
- Os campos continuam editáveis após o auto-preenchimento (o usuário pode ajustar)
- Se o fetch falhar, exibir um toast de aviso e deixar os campos manuais

#### 3. Fluxo do usuário
```text
[Cola URL] → [Clica "Buscar"] → [Loading...] → [Campos preenchidos automaticamente]
                                                  Nome: "Título da página"
                                                  Descrição: "Descrição OG"
                                                  Imagem: preview carregada
```

### Detalhes técnicos

**Edge Function `fetch-link-preview/index.ts`:**
- Usa `fetch()` para baixar o HTML
- Regex simples para extrair `<meta property="og:..." content="...">` 
- Fallback para `<title>` e `<meta name="description">` se OG tags ausentes
- CORS headers padrão, sem JWT

**Campos do formulário:**
- O campo de URL fica acima dos campos nome/descrição/imagem
- Botão "Buscar preview" ao lado do input de URL
- Os campos preenchidos automaticamente ficam com um indicador visual sutil

