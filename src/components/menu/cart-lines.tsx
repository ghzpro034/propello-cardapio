"use client"

import { QuantityStepper } from "@/components/ui/quantity-stepper"
import { setLineQty, type ResolvedLine } from "@/lib/cart"
import { money } from "@/lib/format"
import type { Restaurant } from "@/lib/types"

export function CartLines({ lines }: { lines: ResolvedLine[] }) {
  return (
    <ul className="flex flex-col">
      {lines.map((l) => {
        const variant = l.item.variants.find((v) => v.id === l.variantId)
        const extras = l.item.extras.filter((e) => l.extraIds.includes(e.id))
        const sub = [variant?.name, ...extras.map((e) => `+ ${e.name}`)].filter(Boolean).join(" · ")
        return (
          <li key={l.key} className="flex flex-col gap-2 border-b border-linha-fraca py-3 first:pt-0 last:border-b-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[15px] leading-snug font-bold">{l.item.name}</p>
                {sub ? <p className="text-[13px] leading-snug text-suave">{sub}</p> : null}
                {l.note.trim() ? <p className="text-[13px] leading-snug text-suave">Obs.: {l.note}</p> : null}
              </div>
              <p className="num shrink-0 text-[15px] font-semibold">{money(l.total)}</p>
            </div>
            <QuantityStepper
              size="sm"
              min={0}
              max={30}
              value={l.qty}
              onValueChange={(q) => setLineQty(l.key, q)}
              label={`Quantidade de ${l.item.name}`}
              className="self-start"
            />
          </li>
        )
      })}
    </ul>
  )
}

export function CartTotals({
  subtotal,
  restaurant,
  delivery,
}: {
  subtotal: number
  restaurant: Restaurant
  delivery: boolean
}) {
  const fee = delivery ? restaurant.deliveryFee : 0
  const missing = Math.max(0, restaurant.minimumOrder - subtotal)
  return (
    <div className="flex flex-col gap-1.5 text-[15px]">
      <Row label="Subtotal" value={money(subtotal)} />
      <Row label={delivery ? "Entrega" : "Retirada no local"} value={delivery ? money(fee) : "Grátis"} />
      <div className="mt-1 flex items-baseline justify-between border-t border-linha pt-2.5">
        <span className="font-bold">Total</span>
        <span className="num text-xl font-extrabold">{money(subtotal + fee)}</span>
      </div>
      {missing > 0 ? (
        <p className="mt-1 text-[13px] text-negativo">
          Faltam <span className="num font-semibold">{money(missing)}</span> para o pedido mínimo de{" "}
          <span className="num">{money(restaurant.minimumOrder)}</span>.
        </p>
      ) : null}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-suave">{label}</span>
      <span className="num">{value}</span>
    </div>
  )
}
