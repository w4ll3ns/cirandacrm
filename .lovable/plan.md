

## Fallback amigável para instância Z-API não conectada

### Problema
Quando não há instância Z-API conectada, a página de Comunidades exibe um erro genérico via toast ("No active Z-API instance"). O usuário não entende o que precisa fazer.

### Solução
Detectar o erro específico "No active Z-API instance" no `fetchCommunities`, salvar em um estado, e renderizar um card informativo com orientação clara e botão para ir às Configurações.

### Alterações em `src/components/Communities.tsx`

1. **Novo estado**: `noInstance` (boolean, default false)
2. **No `fetchCommunities` catch**: detectar se `err.message` contém "No active Z-API instance" → setar `noInstance = true` e NÃO mostrar toast de erro genérico. No try (sucesso), resetar `noInstance = false`.
3. **No render (dentro do TabsContent "communities")**: antes do card "Nenhuma comunidade carregada", adicionar condicional:
   - Se `noInstance && !loading`: exibir Card com ícone (Power ou WifiOff), título "Nenhuma instância Z-API conectada", descrição explicativa, e botão "Ir para Configurações" que navega para `/app/configuracoes`.
4. **Desabilitar botões** "Nova Comunidade" e "Disparar Mensagem" quando `noInstance` é true.

### Resultado visual
Card centralizado com:
- Ícone de conexão desativada
- "Nenhuma instância Z-API conectada"
- "Para gerenciar comunidades, conecte uma instância Z-API nas configurações."
- Botão: "Ir para Configurações"

| Arquivo | Ação |
|---------|------|
| `src/pages/Communities.tsx` | Editar (estado + fallback UI + desabilitar botões) |

