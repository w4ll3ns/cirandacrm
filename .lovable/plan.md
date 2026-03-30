

## Paginação e Exportação de Contatos de Comunidades

### 1. Paginação (200 por página)

Na aba "Contatos" de `Communities.tsx`:
- Adicionar estado `contactsPage` (default 1)
- Substituir o `filteredContacts.slice(0, 200)` por paginação real: `filteredContacts.slice((page-1)*200, page*200)`
- Resetar página ao mudar filtro/busca
- Adicionar controles de paginação abaixo da tabela (anterior/próximo + indicador "Página X de Y")

### 2. Exportação XLSX e CSV

Adicionar dois botões de exportação ao lado do badge de contagem:
- **CSV**: gerar string CSV client-side com `Blob` e trigger download
- **XLSX**: usar biblioteca `xlsx` (SheetJS) para gerar arquivo Excel client-side

Ambos exportam os `filteredContacts` (respeitando filtro/busca atual) com colunas: Telefone, Nome, Comunidade, Grupo, Data.

### 3. Dependência

Instalar `xlsx` via npm para a exportação Excel.

### Arquivos alterados
- `src/pages/Communities.tsx` — paginação + botões de export
- `package.json` — adicionar `xlsx`

