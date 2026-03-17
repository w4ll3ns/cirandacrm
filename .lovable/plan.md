

# Fase Final: Polimento, Funcionalidades Pendentes e Estabilização

## Situação Atual

Fases 1 (Auth + DB) e 2 (DataContext real) estão completas. O app funciona com dados reais, auth funcional, e RLS no banco. Analisando o código, identifico as seguintes lacunas para uma versão de produção:

## Escopo da Fase Final

### 1. Gestão de Equipe (Settings)
A página de Settings mostra a equipe mas não permite criar/editar usuários. Implementar:
- Formulário para convidar novo membro (signup via Supabase Auth + atribuir role)
- Editar role de membros existentes (admin/gestor/atendente)
- Desativar membro (`profiles.active = false`)

**Requisito de banco:** Habilitar auto-confirm de email para que convites funcionem sem verificação manual, ou implementar fluxo de convite por link.

### 2. Integração WhatsApp (Z-API)
A tabela `zapi_instances` já existe no banco. Implementar:
- Tela de configuração da instância Z-API em Settings (instance_id, token, client_token)
- Edge function `zapi-webhook` para receber mensagens inbound e criar conversations/messages automaticamente
- Edge function `zapi-send` para enviar mensagens outbound via Z-API
- Conectar o botão "Enviar" no ConversationDetail à edge function de envio real

### 3. Realtime para Mensagens
- Habilitar realtime na tabela `messages` e `conversations`
- Atualizar DataContext para escutar mudanças em tempo real (novas mensagens aparecem instantaneamente)

### 4. Correções de UX e Robustez
- Adicionar empty states mais informativos nas páginas vazias
- Validação de formulários (máscara de telefone no NewLeadForm)
- Loading skeletons ao invés de spinner genérico
- Tratamento de erros com retry em falhas de rede

### 5. RLS para Profiles
Atualmente não há policy de INSERT na tabela `profiles` — o trigger `handle_new_user` usa SECURITY DEFINER então funciona, mas a gestão de equipe precisará de policy para admins fazerem UPDATE em qualquer profile.

## Arquivos Impactados

| Arquivo | Ação |
|---|---|
| `src/pages/Settings.tsx` | Adicionar gestão de equipe (CRUD usuários) |
| `supabase/functions/zapi-webhook/index.ts` | Criar edge function para receber webhooks |
| `supabase/functions/zapi-send/index.ts` | Criar edge function para enviar mensagens |
| `src/pages/ConversationDetail.tsx` | Integrar envio real via edge function |
| `src/contexts/DataContext.tsx` | Adicionar subscriptions realtime |
| `src/components/NewLeadForm.tsx` | Máscara de telefone + validações |
| Migration SQL | Habilitar realtime em messages/conversations |

## Ordem de Execução

1. Gestão de equipe (Settings) — funcionalidade core para o admin
2. Edge functions Z-API (webhook + send) — integração WhatsApp
3. Realtime — mensagens em tempo real
4. Polish de UX — validações, empty states, skeletons

