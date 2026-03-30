

## Disparador de Mensagens para Comunidades WhatsApp

### Resumo
Criar um sistema de disparo de mensagens em massa para grupos/comunidades WhatsApp, com seleção individual ou em lote, suporte a múltiplos tipos de mídia, e temporizador aleatório entre envios (15-25s) para evitar bloqueios.

### Arquitetura

```text
┌─────────────────────────────┐
│  Frontend: Communities.tsx  │
│  Nova aba "Disparar"        │
│  - Composer (texto/imagem/  │
│    audio/link com preview)  │
│  - Seletor de grupos        │
│  - Progresso em tempo real  │
└─────────┬───────────────────┘
          │ invoke
┌─────────▼───────────────────┐
│  Edge Function:             │
│  zapi-community-broadcast   │
│  - Recebe msg + lista de    │
│    groupIds                 │
│  - Loop com delay random    │
│    15-25s entre cada envio  │
│  - Retorna resultado por    │
│    grupo (ok/erro)          │
└─────────┬───────────────────┘
          │ HTTP
┌─────────▼───────────────────┐
│  Z-API Endpoints            │
│  /send-text                 │
│  /send-image                │
│  /send-audio                │
│  /send-link                 │
└─────────────────────────────┘
```

### 1. Nova Edge Function `zapi-community-broadcast`

- Autenticação + verificação admin (mesmo padrão da `zapi-communities`)
- Busca instância Z-API ativa
- Recebe payload:
  - `type`: `text` | `image` | `audio` | `link`
  - `message`: texto da mensagem
  - `media_url`: URL da imagem/áudio (quando aplicável)
  - `caption`: legenda (imagem)
  - `link_url`, `link_title`, `link_description`, `link_image`: campos do send-link
  - `group_phones`: array de phone/IDs dos grupos destino
- Loop pelos grupos com `await sleep(random(15000, 25000))` entre cada envio
- Chama o endpoint Z-API correto por tipo:
  - `text` → `POST /send-text` com `{ phone, message }`
  - `image` → `POST /send-image` com `{ phone, image, caption }`
  - `audio` → `POST /send-audio` com `{ phone, audio }`
  - `link` → `POST /send-link` com `{ phone, message, linkUrl, title, linkDescription, image }`
- Retorna array de resultados `{ groupPhone, status, error? }` para cada grupo

### 2. Frontend — Nova seção na página Comunidades

Adicionar um botão "Disparar Mensagem" no header da página que abre um Dialog/Sheet com:

**Painel de composição:**
- Seletor de tipo: Texto | Imagem | Áudio | Link com Preview
- Campo de texto/mensagem (sempre visível)
- Campo de URL de mídia (condicional ao tipo)
- Campos extras para link: URL, título, descrição, imagem de preview

**Seletor de destinos:**
- Checkbox "Selecionar todos os grupos"
- Lista de checkboxes individuais por grupo (nome + badge anúncios)
- Grupos carregados das comunidades já listadas (subGroups)

**Execução e progresso:**
- Botão "Iniciar Disparo"
- Barra de progresso: "Enviando 3/12... (próximo em ~18s)"
- Indicador de delay aleatório entre envios
- Resultado final: lista com status por grupo (sucesso/erro)

### 3. Detalhes técnicos

**Delay no backend (edge function):**
```typescript
function randomDelay(min = 15000, max = 25000) {
  return new Promise(resolve => 
    setTimeout(resolve, min + Math.random() * (max - min))
  );
}

for (let i = 0; i < groupPhones.length; i++) {
  // enviar mensagem para groupPhones[i]
  results.push({ groupPhone: groupPhones[i], status: 'sent' });
  if (i < groupPhones.length - 1) await randomDelay();
}
```

**Endpoints Z-API usados:**
- `POST /send-text` — `{ phone, message }`
- `POST /send-image` — `{ phone, image, caption }`
- `POST /send-audio` — `{ phone, audio }`
- `POST /send-link` — `{ phone, message, linkUrl, title, linkDescription, image }`

**Timeout:** A edge function pode demorar (ex: 12 grupos × 20s = ~4min). Será necessário aumentar ou lidar com timeout. Alternativa: processar no backend e retornar resultado ao final, ou dividir em lotes menores.

### Arquivos alterados/criados

| Arquivo | Ação |
|---|---|
| `supabase/functions/zapi-community-broadcast/index.ts` | Criar |
| `src/pages/Communities.tsx` | Adicionar UI de disparo |

