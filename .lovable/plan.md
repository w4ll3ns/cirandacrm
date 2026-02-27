

# Adicionar setas de navegação lateral no Pipeline

## Alterações

### `src/pages/Pipeline.tsx`
1. Adicionar `useRef`, `useCallback`, `useEffect` e estado para controlar visibilidade das setas (`canScrollLeft`, `canScrollRight`)
2. Importar `ChevronLeft` de lucide-react (já tem `ChevronRight`)
3. Criar ref para o container scrollável e função `checkScroll` que atualiza os estados baseado em `scrollLeft`, `scrollWidth` e `clientWidth`
4. Adicionar `useEffect` + listener de scroll no container para atualizar visibilidade das setas
5. Funções `scrollLeft`/`scrollRight` que fazem `scrollBy({ left: ±300, behavior: 'smooth' })`
6. Envolver o container scrollável em um `div relative` e adicionar dois botões de seta (esquerda/direita) posicionados absolutamente nas laterais, com gradiente de fundo para indicar conteúdo oculto
7. As setas só aparecem quando há conteúdo para rolar naquela direção

