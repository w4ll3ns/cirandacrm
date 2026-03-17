

# Enriquecer itens da lista de conversas com tags, oportunidade, atendente e status

## O que muda
Cada item da lista de conversas passará a exibir, além do nome e preview da mensagem:
1. **Tags do contato** — badges coloridos com as tags do `responsavel`
2. **Etapa da oportunidade** — badge indicando em qual etapa do pipeline o contato está (ex: "Qualificado", "Visita Agendada")
3. **Atendente responsável** — nome do usuário interno atribuído à conversa
4. **Status concluído** — indicador visual quando a conversa está resolvida/arquivada

## Arquivo modificado
`src/pages/Conversations.tsx`

## Detalhes técnicos

1. **Importar dados necessários**: adicionar `oportunidades` e `alunos` do `useData()`, importar `useProfiles` para mapear `assigned_user_id` a nomes, importar `ETAPA_LABELS` e o componente `Badge`.

2. **Para cada conversa no `.map()`**, buscar:
   - `resp.tags` — array de strings já disponível no responsável
   - `oportunidades.find(o => o.responsavel_id === c.responsavel_id && o.status === 'aberta')` — oportunidade ativa vinculada
   - `profiles.find(p => p.id === c.assigned_user_id)` — perfil do atendente
   - `c.status === 'resolvida' || c.status === 'arquivada'` — flag de concluído

3. **Layout**: Abaixo da linha de preview da mensagem, adicionar uma linha de badges compactos (`flex flex-wrap gap-1 mt-1`):
   - Tags: `Badge variant="outline"` com texto pequeno
   - Etapa: `Badge` com cor contextual (ex: verde para matrícula_fechada, amarelo para visita_agendada)
   - Atendente: texto discreto com ícone de usuário
   - Concluído: `Badge` verde com check quando status é resolvida/arquivada

4. **Manter compacto**: usar `text-[10px]` e `py-0 px-1.5` nos badges para não inflar o tamanho dos itens da lista.

