

# Pipeline Personalizável pelo Admin

## Visão Geral
Criar uma tabela `pipeline_stages` no banco de dados para armazenar as etapas do pipeline de forma dinâmica, substituindo as constantes hardcoded. O admin poderá adicionar, editar, reordenar e desativar etapas pela tela de Configurações.

## Mudanças no Banco de Dados

### 1. Criar tabela `pipeline_stages`
```sql
CREATE TABLE public.pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,        -- slug identificador (ex: "novo_lead")
  label text NOT NULL,             -- nome exibido (ex: "Novo Lead")
  color text DEFAULT NULL,         -- cor opcional (hex)
  icon text DEFAULT NULL,          -- ícone opcional
  is_final_win boolean DEFAULT false,  -- marca como "ganho" (ex: matrícula_fechada)
  is_final_loss boolean DEFAULT false, -- marca como "perdido"
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```
- RLS: admin pode tudo, authenticated pode SELECT
- Seed com as 8 etapas atuais

### 2. Alterar coluna `oportunidades.etapa`
Converter de enum `etapa_funil` para `text`, para aceitar valores dinâmicos:
```sql
ALTER TABLE oportunidades ALTER COLUMN etapa TYPE text USING etapa::text;
ALTER TABLE oportunidades ALTER COLUMN etapa SET DEFAULT 'novo_lead';
```

## Novos Arquivos

### 3. Hook `usePipelineStages`
**Arquivo**: `src/hooks/usePipelineStages.ts`
- Busca `pipeline_stages` ordenado por `sort_order`, filtra `active = true`
- Retorna `{ stages, stageLabels, stageOrder, loading }`
- `stageLabels`: `Record<string, string>` substitui `ETAPA_LABELS`
- `stageOrder`: `string[]` substitui `ETAPAS_ORDER`
- Inclui helpers: `isFinalWin(key)`, `isFinalLoss(key)`

### 4. Componente `PipelineConfig`
**Arquivo**: `src/components/PipelineConfig.tsx`
- Lista todas as etapas com drag-and-drop para reordenar (ou botoes de seta)
- Cada item mostra: label editável, toggle ativo/inativo, flags final_win/final_loss
- Botão "Adicionar Etapa" com formulário inline (key + label)
- Só visível para admin (via `canManageSettings`)

## Arquivos Modificados

### 5. Settings.tsx
- Importar e renderizar `PipelineConfig` como nova seção (visível apenas para admin)

### 6. Pipeline.tsx
- Substituir `ETAPAS_ORDER` e `ETAPA_LABELS` por dados do hook `usePipelineStages`
- Usar `isFinalWin`/`isFinalLoss` em vez de comparação hardcoded com `'perdido'`/`'matricula_fechada'`
- Tipo `EtapaPipeline` vira `string`

### 7. OpportunityDetail.tsx
- Substituir `ETAPA_LABELS`, `ETAPAS_ORDER` pelo hook
- Usar `isFinalWin`/`isFinalLoss` para lógica de mover etapa

### 8. Conversations.tsx
- Substituir `ETAPA_LABELS` pelo hook para exibir badges de etapa

### 9. GlobalSearch.tsx
- Substituir `ETAPA_LABELS` pelo hook

### 10. types/index.ts
- Manter `ETAPA_LABELS` e `ETAPAS_ORDER` como fallback, mas marcar como deprecated
- `EtapaPipeline` passa a ser `string` em vez de union type

## Fluxo do Admin
1. Vai em **Configurações → Pipeline**
2. Vê a lista de etapas na ordem atual
3. Pode renomear, reordenar (setas cima/baixo), ativar/desativar
4. Pode adicionar novas etapas
5. Pode marcar qual etapa é "ganho" e qual é "perdido"

