

## Assistente IA de Copy — com sua API OpenAI

### Resumo
Criar módulo de geração/melhoria de textos com IA no disparador de mensagens, usando sua chave da OpenAI diretamente.

### Passo 1: Configurar a chave OpenAI
- Vou solicitar que você insira sua `OPENAI_API_KEY` como secret do projeto (armazenada de forma segura no backend, nunca exposta no frontend)

### Passo 2: Edge Function `ai-copy-generator`
Nova função em `supabase/functions/ai-copy-generator/index.ts`:
- Recebe: `action` (generate, improve, variation, shorten, stronger, urgent, quick_suggestion), `currentText`, `tone`, `size`, `linkContext`, `suggestionType`
- Chama `https://api.openai.com/v1/chat/completions` com `OPENAI_API_KEY` usando modelo `gpt-4o-mini` (rápido e barato para copy curta)
- Prompt interno completo com todas as regras de copy (urgência, escassez, prova social, emojis, asteriscos para negrito WhatsApp, diferenciação prêmio instantâneo vs principal)
- Inclui os 3 exemplos de referência no prompt
- Tratamento de erros (rate limit, quota, etc.)
- Autenticação do usuário via JWT

### Passo 3: Componente `BroadcastAIAssistant.tsx`
Novo componente renderizado abaixo de cada textarea no disparador:
- **Collapsible** — abre com botão "✨ Assistente IA"
- Campo "Link da ação atual" — busca preview via `fetch-link-preview` existente
- 6 botões principais: Gerar com IA, Melhorar texto, Gerar variação, Encurtar, Mais forte, Mais urgente
- 20+ chips de sugestões rápidas (Bom dia, Última oportunidade, Reta final, etc.)
- Seletor de tom (Direto, Popular, Urgente, Emocional, Agressivo, Comunidade, Premium)
- Seletor de tamanho (Curto, Médio, Longo)
- Ações: Gerar novamente, Copiar, Inserir sem substituir
- Loading state durante geração
- Histórico local da última sugestão (botão Desfazer)

### Passo 4: Integração em `Communities.tsx`
- Importar e renderizar `<BroadcastAIAssistant>` abaixo de cada textarea (tabs text, image, video, gif, link)
- Passar `broadcastMessage`, `setBroadcastMessage` e `broadcastType`
- Zero alteração no fluxo de disparo existente

### Arquivos
| Arquivo | Ação |
|---------|------|
| `supabase/functions/ai-copy-generator/index.ts` | Criar |
| `src/components/BroadcastAIAssistant.tsx` | Criar |
| `src/pages/Communities.tsx` | Editar (adicionar componente) |

### Modelo OpenAI
- `gpt-4o-mini` como padrão (custo ~$0.15/1M tokens input) — ideal para copy curta
- Pode trocar para `gpt-4o` se quiser mais qualidade

