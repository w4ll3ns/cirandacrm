

# Criar Oportunidades Retroativas para Contatos sem Oportunidade

## Problema
Contatos criados antes da lógica de criação automática de oportunidades no webhook não possuem oportunidade vinculada, ficando invisíveis no pipeline e dashboard.

## Solução
Executar um SQL via insert tool para criar oportunidades para todos os `responsaveis` que não possuem nenhuma oportunidade, e vincular às conversas existentes.

### SQL a executar (via insert tool, não migration)

1. **Inserir oportunidades** para responsáveis sem oportunidade:
```sql
INSERT INTO oportunidades (responsavel_id, etapa, temperatura, status, origem)
SELECT r.id, 'novo_lead', 'morno', 'aberta', COALESCE(r.origem, 'outro')
FROM responsaveis r
WHERE NOT EXISTS (
  SELECT 1 FROM oportunidades o WHERE o.responsavel_id = r.id
);
```

2. **Vincular oportunidades às conversas** que não têm `oportunidade_id`:
```sql
UPDATE conversations c
SET oportunidade_id = (
  SELECT o.id FROM oportunidades o
  WHERE o.responsavel_id = c.responsavel_id
  AND o.status = 'aberta'
  ORDER BY o.created_at DESC
  LIMIT 1
)
WHERE c.oportunidade_id IS NULL;
```

### Resultado
- Todos os contatos existentes aparecerão na coluna "Novo Lead" do pipeline
- Conversas existentes serão vinculadas às suas oportunidades
- Nenhuma alteração de código necessária

