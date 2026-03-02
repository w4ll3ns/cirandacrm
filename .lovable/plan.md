

# Transferência manual de conversa para outro atendente

## Alterações

### `src/pages/ConversationDetail.tsx`
1. Adicionar estado `showTransfer` e botão "Transferir" no menu de ações (ícone `UserRoundCog` ou `ArrowRightLeft`)
2. Criar modal de transferência com:
   - Select dos usuários internos (excluindo o atendente atual), usando `usuarios` do mock
   - Campo textarea para motivo/comentário (opcional)
   - Botão "Transferir"
3. Ao confirmar: fechar período do atendente atual (`fim_em`), criar nova entrada no `historico_atendentes`, atualizar `responsavel_interno_id`, e exibir toast de sucesso
4. Guardar o motivo como campo opcional no `HistoricoAtendente`

### `src/types/index.ts`
- Adicionar campo opcional `motivo?: string` na interface `HistoricoAtendente` para registrar o motivo da transferência

### Exibição do motivo
- No histórico colapsável já existente, exibir o `motivo` (quando presente) abaixo de cada entrada como texto em itálico

