

## Conexão e Desconexão de WhatsApp via QR Code no Sistema

### Resumo
Adicionar funcionalidade de conectar/desconectar instâncias WhatsApp diretamente no sistema, exibindo QR code para escaneamento — sem precisar acessar o painel Z-API.

### Endpoints Z-API utilizados

```text
GET /instances/{id}/token/{token}/qr-code/image   → QR code em base64
GET /instances/{id}/token/{token}/status           → Status da conexão  
GET /instances/{id}/token/{token}/disconnect        → Desconectar
GET /instances/{id}/token/{token}/restart           → Reiniciar sessão
```
Todos exigem header `Client-Token`.

### Alterações

**1. Nova Edge Function: `supabase/functions/zapi-instance-manager/index.ts`**
- Proxy seguro para os endpoints da Z-API (tokens nunca expostos no frontend)
- Ações suportadas via query param `action`:
  - `qrcode` — busca QR code base64 da instância
  - `status` — retorna status atual (connected/disconnected)
  - `disconnect` — desconecta a instância
  - `restart` — reinicia a sessão
- Recebe `instanceId` no body, busca credenciais na tabela `zapi_instances`
- Autenticação JWT obrigatória

**2. Editar: `src/components/ZapiConfig.tsx`**
- Substituir o botão "Conectar/Desconectar" simples por um fluxo real:
  - **Conectar**: abre modal/drawer com QR code da Z-API, polling de status a cada 3s até conectar
  - **Desconectar**: chama endpoint de disconnect, atualiza status local
- Exibir status real da instância (consultando Z-API) em vez de apenas o campo local `connected`
- Adicionar indicador visual durante escaneamento (loading + QR code + "Aguardando leitura...")
- Ao detectar conexão: atualiza `connected=true` e `phone_number` na tabela

**3. Editar: `supabase/config.toml`**
- Adicionar `[functions.zapi-instance-manager]` com `verify_jwt = false`

### Fluxo do usuário

```text
1. Usuário clica "Conectar" na instância
2. Sistema chama edge function → Z-API retorna QR code base64
3. QR code é exibido em modal/dialog
4. Usuário escaneia com celular
5. Polling a cada 3s verifica status
6. Quando conectado → fecha modal, atualiza status, exibe ✅
7. Para desconectar → clica "Desconectar" → chama disconnect → atualiza status
```

### Arquivos

| Arquivo | Ação |
|---------|------|
| `supabase/functions/zapi-instance-manager/index.ts` | Criar |
| `src/components/ZapiConfig.tsx` | Editar (QR code modal + status real) |
| `supabase/config.toml` | Editar (adicionar função) |

