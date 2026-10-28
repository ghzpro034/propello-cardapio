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

## Dois modos

- **Demonstração (sem configurar nada):** os dados ficam no `localStorage` do navegador, como na v0.1.
  Painel e cardápio conversam entre abas do mesmo navegador. Bom para mostrar e para mexer no visual.
- **Com Supabase:** basta criar o `.env.local` (veja `.env.example`). Aí o painel pede login
  (`/entrar`), cada dono tem o próprio restaurante, e o cardápio público `/r/[slug]` lê do banco.

## Supabase

1. Crie um projeto em supabase.com.
2. No **SQL Editor**, rode `supabase/migrations/20261028000000_init.sql` (tabelas, RLS e bucket de fotos).
3. Em **Project Settings → API**, copie a URL e a chave publishable (ou a anon) para o `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
   ```
4. Em **Authentication → URL Configuration**, coloque o endereço do site em *Site URL*
   (no começo, `http://localhost:3000`).

Como funciona:

- As telas continuam chamando `menu-actions`, que mudam o estado na hora. `src/lib/sync.ts`
  compara com o último estado gravado e manda só o que mudou (agrupando edições em 0,6 s).
  Se o banco recusar, mostra o erro e volta para o que está gravado.
- Quem pode gravar é decidido no banco (RLS): leitura do cardápio é pública, escrita só do dono.
- O cardápio público fica em cache (`"use cache"` + `cacheTag`); o painel chama uma Server Action
  com `updateTag` depois de gravar, então a mudança aparece na hora para o cliente.

## Cloudflare

O deploy é em Cloudflare Workers com o adaptador [OpenNext](https://opennext.js.org/cloudflare)
(o antigo `next-on-pages` para Pages foi descontinuado).

Uma vez só:

```bash
npx wrangler login
npx wrangler r2 bucket create propello-cardapio-cache
npx wrangler d1 create propello-cardapio-tags   # cole o database_id em wrangler.jsonc
```

Depois, a cada deploy (com as variáveis do Supabase no ambiente, porque o build já lê o banco):

```bash
npm run deploy
```

`npm run preview` roda a versão Cloudflare localmente. Para deploy automático a cada push,
conecte o repositório em **Workers & Pages → Create → Import a repository**, com build
`npx opennextjs-cloudflare build`, deploy `npx opennextjs-cloudflare deploy` e as duas variáveis
`NEXT_PUBLIC_SUPABASE_*` em *Build variables*.

## Dados de exemplo para trocar

Tudo em `src/lib/seed.ts` é fictício: o restaurante "Quintal Mineiro", endereço
"Rua Exemplo, 123", WhatsApp (34) 99999-0000, pratos, preços e horários.
No modo demonstração, o botão "Restaurar exemplo" volta para esses dados. Com Supabase, um dono novo
começa com uma cópia deles no próprio restaurante.

## Componentes

- shadcn/ui (código oficial em `src/components/ui`), ajustado à marca: Archivo, cantos
  4/8px, sem sombra em nada parado, laranja `#FF5B1F` com texto carvão
- 21st.dev: `qr-code.tsx` (@kevingirelli) e `quantity-stepper.tsx` (@arihantcodes),
  adaptados para português e para a marca
