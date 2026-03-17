

# Gravação de Áudio Inline no Chat

## Resumo
Adicionar botão de microfone ao lado do botão de envio que permite gravar áudio diretamente no chat. Quando não há texto digitado, o botão de envio se transforma em microfone. Ao segurar/clicar, inicia gravação; ao soltar/clicar novamente, para e envia o áudio.

## Implementação

### `src/pages/ConversationDetail.tsx`

1. **Estado de gravação**: Adicionar states `isRecording`, `mediaRecorder` (ref), `recordingTime` (contador de segundos).

2. **Lógica de gravação** usando `navigator.mediaDevices.getUserMedia({ audio: true })` + `MediaRecorder`:
   - `startRecording()`: solicita permissão do mic, cria `MediaRecorder`, coleta chunks em array, inicia timer.
   - `stopRecording()`: para o `MediaRecorder`, monta `Blob` (tipo `audio/webm`), faz upload para bucket `chat-media`, envia via `zapi-send` com `type: 'audio'`.
   - `cancelRecording()`: para sem enviar.

3. **UI do input area**:
   - Quando **não está gravando** e **texto vazio** e **sem arquivo pendente**: trocar o botão Send por botão Mic (ícone `Mic` do lucide).
   - Quando **está gravando**: substituir toda a barra de input por uma UI de gravação: indicador vermelho pulsante + tempo decorrido + botão cancelar (Trash) + botão enviar (Send).
   - Quando **tem texto ou arquivo**: manter botão Send normal.

4. **Conversão de formato**: O `MediaRecorder` grava em `audio/webm`. O Z-API aceita URLs de áudio diretamente, então basta fazer upload do `.webm` e enviar a URL pública.

### Arquivos afetados

| Arquivo | Mudança |
|---|---|
| `src/pages/ConversationDetail.tsx` | Adicionar lógica de gravação de áudio + UI de gravação inline |

Nenhuma mudança no backend ou banco necessária — reutiliza o bucket `chat-media` e o endpoint `zapi-send` com `type: 'audio'`.

