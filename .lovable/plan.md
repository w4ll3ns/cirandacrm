

# Ajuste: Manter apenas WhatsApp como canal de comunicação

## Mudança
Remover todos os canais de comunicação exceto **WhatsApp**. Isso simplifica o sistema e reflete o uso real da escola.

## Impacto nas telas e dados

### Conversas (Inbox)
- Remover filtro por canal (já que só existe WhatsApp)
- Todas as conversas serão WhatsApp — exibir ícone do WhatsApp como padrão
- Remover referências a Instagram, E-mail e Telefone/Anotações

### Pipeline / Detalhe da Oportunidade
- Ação rápida: manter apenas "Abrir WhatsApp" (remover "Ligar")
- Campo "canal preferido" deixa de existir (sempre WhatsApp)

### Contatos
- Remover campo de e-mail dos responsáveis (ou tornar opcional sem destaque)
- Manter telefone/WhatsApp como campo principal de contato

### Tarefas
- Tipo "Enviar mensagem" passa a ser implicitamente via WhatsApp
- Remover tipo "Ligar" se existia separado

### Configurações > Integrações
- Manter apenas placeholder de WhatsApp API
- Remover placeholders de SMTP/E-mail

### Dataset fictício
- Todas as ~80 conversas serão canal WhatsApp
- Mensagens simuladas no estilo WhatsApp
- Origens de lead mantidas (Instagram, Google, etc.) — são origens de captação, não canais de conversa

## Arquivos afetados
- `src/data/` — modelo de Conversa sem campo canal (ou fixo "whatsapp"), mensagens ajustadas
- Tela de Conversas — remover filtro de canal
- Tela de Detalhe da Oportunidade — simplificar ações rápidas
- Tela de Configurações — remover integrações de e-mail
- Modelos de dados — simplificar entidade Conversa

