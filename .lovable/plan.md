

# Avaliacao Completa do CRM Ciranda ABC — Gaps e Melhorias

## Funcionalidades Ausentes (Criticas)

### 1. Formulario de Cadastro de Novo Lead
Nao existe formulario para criar responsavel + aluno + oportunidade. O botao "Novo Lead" apenas redireciona ao pipeline. Precisa de um modal/pagina com campos: nome do responsavel, WhatsApp, origem, nome do aluno, serie de interesse. Ao salvar, cria os 3 registros e posiciona na etapa "novo_lead".

### 2. Criacao de Tarefa
Nao ha como criar tarefas manualmente. A tela de tarefas so lista e conclui. Adicionar botao "Nova Tarefa" com formulario: titulo, tipo, prioridade, data/hora, responsavel interno, vincular a oportunidade/responsavel.

### 3. Edicao de Contatos
As telas de detalhe de Responsavel e Aluno sao somente leitura. Nao ha como editar telefone, nome, serie, tags, observacoes. Adicionar botao "Editar" com formulario inline ou modal.

### 4. Timeline/Historico na Oportunidade
O detalhe da oportunidade nao mostra historico de movimentacoes (quando mudou de etapa, quem moveu). Criar uma timeline simples mostrando eventos ordenados cronologicamente.

### 5. Filtros no Pipeline
Nao ha filtros por temperatura, responsavel interno, ou busca por nome no pipeline. Adicionar barra de filtros acima das colunas no desktop.

### 6. Relatorios/Dashboard do Admin
O dashboard mostra apenas KPIs basicos. Faltam graficos: funil de conversao por etapa, leads por origem, motivos de perda, desempenho por responsavel. Usar recharts (ja instalado).

## Melhorias de UX

### 7. Busca Global
Nao existe busca global. Adicionar campo de busca no header do desktop que pesquisa em responsaveis, alunos e oportunidades simultaneamente.

### 8. Acoes Rapidas na Conversa
Os botoes "Vincular Oportunidade" e "Criar Tarefa" na conversa mostram apenas toast. Implementar a funcionalidade real.

### 9. Indicador de Temperatura no Pipeline
Permitir alterar temperatura (quente/morno/frio) diretamente do card no kanban sem precisar entrar no detalhe.

### 10. Valor Estimado na Oportunidade
O campo `valor_estimado` existe nos dados mas nao e exibido em nenhuma tela. Mostrar no detalhe da oportunidade e no card do pipeline.

## Prioridade de Implementacao Sugerida

1. **Formulario Novo Lead** — sem ele o CRM nao funciona na pratica
2. **Criacao de Tarefa** — essencial para o dia a dia
3. **Edicao de Contatos** — basico de qualquer CRM
4. **Dashboard com graficos** — valor para admin/gestao
5. **Filtros no Pipeline** — produtividade
6. **Busca Global** — agilidade
7. **Timeline da Oportunidade** — visibilidade do processo
8. **Acoes reais na Conversa** — integrar fluxos

## Arquivos Afetados

- Novo: `src/components/NewLeadForm.tsx`, `src/components/NewTaskForm.tsx`, `src/components/GlobalSearch.tsx`, `src/components/ReportsPanel.tsx`
- Editar: `src/pages/Home.tsx` (graficos), `src/pages/Pipeline.tsx` (filtros + form), `src/pages/Tasks.tsx` (botao criar), `src/pages/ContactDetail.tsx` (edicao), `src/pages/OpportunityDetail.tsx` (timeline + valor), `src/pages/ConversationDetail.tsx` (acoes reais), `src/components/Layout.tsx` (busca global)
- Editar: `src/contexts/DataContext.tsx` — adicionar funcoes `addResponsavel`, `addAluno`, `addOportunidade`, `addTarefa`, `updateResponsavel`, `updateAluno`

