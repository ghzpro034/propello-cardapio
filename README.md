# Propello Cardápio

Cardápio digital com pedido pelo WhatsApp, para restaurantes e deliveries de Uberlândia.
Next.js 16 + Tailwind 4 + shadcn/ui, com dois componentes do 21st.dev (QR Code e Quantity Stepper).

## Rodar

```bash
npm install
npm run dev
```

Abra:

- **Painel do dono:** http://localhost:3000/painel
- **Cardápio público (o que o cliente vê pelo QR):** http://localhost:3000/r/quintal-mineiro

## O que tem

**Cardápio público** (`/r/[slug]`)
- Aberto/fechado calculado pelos horários (horário de Brasília) e pelo botão de pausa
- Busca, abas de categoria que acompanham a rolagem, itens esgotados marcados
- Prato com tamanhos, adicionais, observação e quantidade
- Sacola (gaveta no celular, coluna fixa no computador), pedido mínimo, entrega ou retirada
- Fechamento com nome, endereço e pagamento (Pix, dinheiro com troco, cartão) que abre o
  WhatsApp do restaurante com a mensagem do pedido pronta

**Painel** (`/painel`)
- Cardápio: itens por categoria, liga/desliga "à venda" numa tecla, editar, duplicar,
  mudar ordem, criar/renomear/excluir categoria, pausar pedidos
- Restaurante: dados, WhatsApp, taxa e tempo de entrega, pedido mínimo, horários por dia,
  formas de pagamento e cor do cardápio (salva sozinho)
- Link e QR code: copiar link, baixar QR em PNG/SVG e imprimir o display de mesa A6

## Importante: ainda sem back-end

Os dados ficam no `localStorage` do navegador (`src/lib/store.ts`). Painel e cardápio
conversam entre abas do mesmo navegador, mas **não** entre aparelhos. Para virar SaaS de
verdade falta: banco + API, login do dono, várias lojas por conta, upload de fotos e
domínio próprio. A interface de `menuStore` foi feita para trocar só o `load`/`persist`.

## Dados de exemplo para trocar

Tudo em `src/lib/seed.ts` é fictício: o restaurante "Quintal Mineiro", endereço
"Rua Exemplo, 123", WhatsApp (34) 99999-0000, pratos, preços e horários.
O botão "Restaurar exemplo" no painel volta para esses dados.

## Componentes

- shadcn/ui (código oficial em `src/components/ui`), ajustado à marca: Archivo, cantos
  4/8px, sem sombra em nada parado, laranja `#FF5B1F` com texto carvão
- 21st.dev: `qr-code.tsx` (@kevingirelli) e `quantity-stepper.tsx` (@arihantcodes),
  adaptados para português e para a marca
