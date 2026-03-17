

# Redesign da Página de Configurações para Desktop

## Problema

A página de Configurações usa um layout mobile-first com `space-y-4` empilhando todos os cards verticalmente. No desktop, o `md:grid md:grid-cols-2` é aplicado sobre o container `space-y-4`, mas como todos os cards estão dentro de um único div filho, o grid não distribui os cards — tudo fica numa coluna estreita centralizada com `max-w-3xl`.

## Solução

Reestruturar o layout desktop em seções claras com grid de 2 colunas, separando os blocos logicamente:

```
┌─────────────────────────────────────────────────┐
│  Configurações (título)                         │
├──────────────────────┬──────────────────────────┤
│  Perfil do Usuário   │  Sobre o Sistema         │
│  (avatar, nome,      │  (logo, versão,          │
│   email, perfil)     │   desenvolvedor)          │
├──────────────────────┴──────────────────────────┤
│  Equipe (full width - tabela precisa espaço)    │
├─────────────────────────────────────────────────┤
│  WhatsApp / Z-API (full width)                  │
├──────────────────────┬──────────────────────────┤
│  Notificações        │  Botão Sair              │
└──────────────────────┴──────────────────────────┘
```

## Mudanças — `src/pages/Settings.tsx`

1. **Desktop**: Substituir o layout atual por um grid de 2 colunas com `gap-6`:
   - Linha 1: Perfil (col 1) + Sobre (col 2) lado a lado
   - Linha 2: Equipe (`col-span-2`, largura total)
   - Linha 3: WhatsApp (`col-span-2`, largura total)
   - Linha 4: Notificações (col 1) + Sair (col 2)
2. Aumentar `max-w` para `5xl` para aproveitar melhor o espaço desktop
3. Adicionar título de seção mais proeminente com descrição
4. Manter o layout mobile inalterado (stack vertical com `space-y-4`)

Nenhum outro arquivo precisa ser alterado.

