

# Remover Conversa Duplicada do Contato Wallen Santiago

## Situação Atual

| Conversa | Criada em | Mensagens | Status |
|---|---|---|---|
| `0dd6bede` (primeira) | 17/03 01:53 | 12 | resolvida |
| `562e64cf` (segunda) | 17/03 03:38 | 1 | em_atendimento |

A segunda conversa foi criada antes da correção do webhook que agora reabre conversas resolvidas.

## Plano

1. **Mover a mensagem** da segunda conversa para a primeira (preservar histórico)
2. **Reabrir a primeira conversa** (status → `nao_lida`, atualizar `ultima_mensagem_em`)
3. **Deletar a segunda conversa** (sem mensagens restantes)

Isso garante que nenhuma mensagem seja perdida e o contato fique com apenas uma conversa contendo todo o histórico.

