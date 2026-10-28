"use client"

import { Clock, MapPin, Search, ShoppingBag, X } from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { PropelloLogo } from "@/components/brand/propello"
import { useNow } from "@/hooks/use-now"
import { CartLines, CartTotals } from "@/components/menu/cart-lines"
import { CheckoutModal } from "@/components/menu/checkout-modal"
import { ItemModal } from "@/components/menu/item-modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { accentVars } from "@/lib/accent"
import { resolveCart } from "@/lib/cart"
import { itemFromPrice, money, openStatus, plural, statusLine } from "@/lib/format"
import { useCart, useMenu } from "@/lib/store"
import type { Item, MenuState, Restaurant } from "@/lib/types"
import { paymentLabels } from "@/lib/cart"
import { weekdayNames, weekdayOrder } from "@/lib/format"
import { cn } from "@/lib/utils"

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
}

/** Com Supabase o servidor passa `initial`; no modo demonstração lê do localStorage. */
export function PublicMenu({ slug, initial }: { slug: string; initial?: MenuState }) {
  const stored = useMenu()
  const menu = initial ?? stored
  const cart = useCart()
  const r = menu.restaurant
  const style = accentVars(r.accent)

  // o status depende do relógio: calcula no cliente e atualiza a cada minuto
  const now = useNow()
  const status = now ? openStatus(r, now) : null
  const canOrder = !!status?.open

  const [query, setQuery] = useState("")
  const [active, setActive] = useState(menu.categories[0]?.id)
  const [selected, setSelected] = useState<Item | null>(null)
  const [itemOpen, setItemOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  const { lines, subtotal, count } = resolveCart(cart, menu)

  const sections = useMemo(() => {
    const q = normalize(query.trim())
    return menu.categories
      .map((c) => ({
        ...c,
        items: menu.items.filter(
          (i) => i.categoryId === c.id && (!q || normalize(`${i.name} ${i.description}`).includes(q)),
        ),
      }))
      .filter((c) => c.items.length > 0)
  }, [menu, query])

  // aba ativa acompanha a rolagem
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id.replace("cat-", ""))
      },
      { rootMargin: "-140px 0px -60% 0px" },
    )
    Object.values(sectionRefs.current).forEach((el) => el && obs.observe(el))
    return () => obs.disconnect()
  }, [sections])

  const tabsRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = tabsRef.current?.querySelector<HTMLElement>(`[data-cat="${active}"]`)
    el?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" })
  }, [active])

  if (slug !== r.slug) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 px-4">
        <h1 className="text-3xl font-extrabold tracking-[-0.015em]">Cardápio não encontrado</h1>
        <p className="text-suave">
          O endereço <span className="font-semibold text-foreground">/r/{slug}</span> não corresponde a nenhum
          restaurante. Confira o link ou o QR code.
        </p>
        <Button asChild variant="escuro" className="self-start">
          <Link href={`/r/${r.slug}`}>Abrir {r.name}</Link>
        </Button>
      </main>
    )
  }

  function openItem(item: Item) {
    setSelected(item)
    setItemOpen(true)
  }

  return (
    <div style={style} className="min-h-dvh bg-background pb-28 lg:pb-0">
      {/* Cabeçalho do restaurante */}
      <header className="mx-auto w-full max-w-[1120px] px-4 pt-8 pb-6 sm:px-6 lg:pt-14 lg:pb-8">
        <h1 className="text-[34px] leading-[0.98] font-extrabold tracking-[-0.02em] sm:text-[48px]">{r.name}</h1>
        <p className="mt-3 max-w-[52ch] text-[17px] leading-snug text-suave">{r.tagline}</p>

        <div className="mt-5 flex flex-col gap-2 text-[15px] sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
          <p className="flex items-center gap-2 font-semibold" aria-live="polite">
            <span
              aria-hidden
              className={cn(
                "size-2.5 rounded-[2px]",
                status === null ? "bg-ativo" : status.open ? "bg-positivo" : "bg-controle",
              )}
            />
            {status ? statusLine(status) : "Conferindo horário…"}
          </p>
          <p className="num flex items-center gap-2 text-suave">
            <Clock className="size-4" aria-hidden />
            {r.acceptsDelivery ? `Entrega ${money(r.deliveryFee)} · ${r.deliveryTime}` : "Só retirada"}
            <span aria-hidden>·</span> mínimo {money(r.minimumOrder)}
          </p>
          <p className="flex items-center gap-2 text-suave">
            <MapPin className="size-4" aria-hidden />
            {r.address}, {r.neighborhood} — {r.city}
          </p>
        </div>
      </header>

      {/* Busca + categorias, presos no topo */}
      <div className="sticky top-0 z-30 border-y border-linha bg-background/95 supports-[backdrop-filter]:bg-background">
        <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-2 px-4 py-2.5 sm:px-6 md:flex-row md:items-center md:gap-4">
          <label className="relative md:w-72 md:shrink-0">
            <span className="sr-only">Buscar no cardápio</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-suave" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar prato ou bebida"
              className="h-11 w-full rounded-md border-[1.5px] border-controle bg-elevada pr-10 pl-9 text-base outline-none placeholder:text-suave focus-visible:border-carvao"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Limpar busca"
                className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-sm hover:bg-ativo"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </label>
          <nav aria-label="Categorias" className="min-w-0 flex-1">
            <div ref={tabsRef} className="sem-barra -mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:px-0">
              {sections.map((c) => (
                <a
                  key={c.id}
                  data-cat={c.id}
                  href={`#cat-${c.id}`}
                  aria-current={active === c.id ? "true" : undefined}
                  className={cn(
                    "flex h-10 shrink-0 items-center rounded-md px-3 text-[15px] font-semibold whitespace-nowrap transition-colors",
                    active === c.id ? "bg-carvao text-creme" : "text-suave hover:bg-ativo hover:text-foreground",
                  )}
                >
                  {c.name}
                </a>
              ))}
            </div>
          </nav>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1120px] gap-10 px-4 pt-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-14 lg:pt-10">
        <main>
          {sections.length === 0 ? (
            <div className="rounded-lg border border-dashed border-controle px-4 py-6">
              <p className="text-[15px]">
                Nada no cardápio com <strong>“{query}”</strong>.
              </p>
              <Button variant="outline" className="mt-3" onClick={() => setQuery("")}>
                Ver o cardápio inteiro
              </Button>
            </div>
          ) : null}

          {sections.map((c) => (
            <section
              key={c.id}
              id={`cat-${c.id}`}
              ref={(el) => {
                sectionRefs.current[c.id] = el
              }}
              className="scroll-mt-36 pb-10 md:scroll-mt-24"
              aria-labelledby={`h-${c.id}`}
            >
              <div className="flex items-baseline justify-between border-b-2 border-carvao pb-2">
                <h2 id={`h-${c.id}`} className="text-[26px] leading-tight font-extrabold tracking-[-0.01em]">
                  {c.name}
                </h2>
                <span className="text-[13px] text-suave">{plural(c.items.length, "item", "itens")}</span>
              </div>
              <ul>
                {c.items.map((item) => (
                  <li key={item.id} className="border-b border-linha last:border-b-0">
                    <MenuRow item={item} onOpen={() => openItem(item)} />
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <section aria-labelledby="info-titulo" className="border-t-2 border-carvao pt-4 pb-4 lg:hidden">
            <h2 id="info-titulo" className="sr-only">
              Horários e pagamento
            </h2>
            <InfoBlock restaurant={r} />
          </section>
        </main>

        {/* Sacola fixa ao lado no computador */}
        <aside className="hidden lg:block" aria-label="Sacola">
          <div className="sticky top-24 flex max-h-[calc(100dvh-7rem)] flex-col rounded-lg border border-linha bg-elevada">
            <div className="flex items-baseline justify-between px-5 pt-5 pb-3">
              <h2 className="text-xl font-extrabold">Sua sacola</h2>
              {count ? <span className="text-[13px] text-suave">{plural(count, "item", "itens")}</span> : null}
            </div>
            {lines.length ? (
              <>
                <div className="min-h-0 flex-1 overflow-y-auto px-5">
                  <CartLines lines={lines} />
                </div>
                <div className="flex flex-col gap-3 border-t border-linha px-5 py-4">
                  <CartTotals subtotal={subtotal} restaurant={r} delivery={r.acceptsDelivery} />
                  <Button
                    variant="marca"
                    size="lg"
                    disabled={!canOrder || subtotal < r.minimumOrder}
                    onClick={() => setCheckoutOpen(true)}
                  >
                    {canOrder ? "Fechar pedido" : "Fechado agora"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="px-5 pb-5 text-[15px] text-suave">
                  Escolha um prato e ele aparece aqui. O pedido vai pronto pro WhatsApp do restaurante.
                </p>
                <div className="border-t border-linha px-5 py-5">
                  <InfoBlock restaurant={r} />
                </div>
              </>
            )}
          </div>
        </aside>
      </div>

      <footer className="mx-auto mt-6 flex w-full max-w-[1120px] flex-col gap-3 border-t border-linha px-4 py-8 text-[13px] text-suave sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          {r.name} · {r.address}, {r.neighborhood} — {r.city}
        </p>
        <p className="flex items-center gap-2">
          Cardápio feito pela
          <span className="inline-flex translate-y-[2px]">
            <PropelloLogo width={72} />
          </span>
        </p>
      </footer>

      {/* Barra da sacola no celular */}
      {count > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-linha bg-background px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] lg:hidden">
          <Button variant="marca" size="lg" className="w-full justify-between" onClick={() => setCheckoutOpen(true)}>
            <span className="flex items-center gap-2">
              <ShoppingBag className="size-5" aria-hidden />
              Ver sacola · {plural(count, "item", "itens")}
            </span>
            <span className="num">{money(subtotal)}</span>
          </Button>
        </div>
      ) : null}

      <ItemModal item={selected} open={itemOpen} onOpenChange={setItemOpen} canOrder={canOrder} style={style} />
      <CheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        menu={menu}
        lines={lines}
        subtotal={subtotal}
        canOrder={canOrder}
        style={style}
      />
    </div>
  )
}

function MenuRow({ item, onOpen }: { item: Item; onOpen: () => void }) {
  const from = item.variants.length > 1
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={!item.available}
      className="group grid w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 py-4 text-left transition-colors enabled:hover:bg-ativo/50 disabled:cursor-not-allowed sm:-mx-3 sm:w-[calc(100%+1.5rem)] sm:rounded-md sm:px-3"
    >
      <span className="flex min-w-0 gap-3">
        {item.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.photo} alt="" className="size-[72px] shrink-0 rounded-lg object-cover" />
        ) : null}
        <span className="min-w-0">
          <span className={cn("block text-[17px] leading-snug font-bold", !item.available && "text-suave")}>
            {item.name}
          </span>
          {item.description ? (
            <span className="mt-0.5 line-clamp-2 block text-[14px] leading-snug text-suave">{item.description}</span>
          ) : null}
          {item.serves ? <span className="mt-1 block text-[13px] text-suave">{item.serves}</span> : null}
        </span>
      </span>
      <span className="flex flex-col items-end gap-1 pt-0.5">
        {item.available ? (
          <>
            {from ? <span className="text-[12px] text-suave">a partir de</span> : null}
            <span className="num text-[17px] font-bold whitespace-nowrap">{money(itemFromPrice(item))}</span>
          </>
        ) : (
          <Badge variant="esgotado">Esgotado</Badge>
        )}
      </span>
    </button>
  )
}

/** Horários da semana (dias iguais seguidos viram uma faixa) e formas de pagamento. */
function InfoBlock({ restaurant: r }: { restaurant: Restaurant }) {
  const rows: { days: string; hours: string }[] = []
  let start = weekdayOrder[0]
  let prev = weekdayOrder[0]
  const label = (d: (typeof weekdayOrder)[number]) => {
    const h = r.hours[d]
    return h.enabled ? `${h.open} às ${h.close}` : "Fechado"
  }
  for (let i = 1; i <= weekdayOrder.length; i++) {
    const d = weekdayOrder[i]
    if (d !== undefined && label(d) === label(prev)) {
      prev = d
      continue
    }
    const name = (x: typeof prev) => weekdayNames[x].slice(0, 3).toLowerCase()
    rows.push({ days: start === prev ? weekdayNames[start] : `${name(start)} a ${name(prev)}`, hours: label(prev) })
    if (d !== undefined) {
      start = d
      prev = d
    }
  }
  return (
    <div className="flex flex-col gap-4 text-[14px]">
      <div>
        <p className="mb-1.5 font-bold">Horários</p>
        <dl className="flex flex-col gap-1">
          {rows.map((row) => (
            <div key={row.days} className="flex justify-between gap-4">
              <dt className="text-suave first-letter:uppercase">{row.days}</dt>
              <dd className="num">{row.hours}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div>
        <p className="mb-1.5 font-bold">Pagamento</p>
        <p className="text-suave">{r.payments.map((p) => paymentLabels[p]).join(" · ")}</p>
      </div>
    </div>
  )
}
