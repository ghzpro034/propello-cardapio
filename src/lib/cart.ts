import { money } from "./format"
import { cartStore, uid } from "./store"
import type { CartLine, Item, MenuState, PaymentMethod } from "./types"

export function linePrice(item: Item, line: Pick<CartLine, "variantId" | "extraIds" | "qty">) {
  const base = item.variants.find((v) => v.id === line.variantId)?.price ?? item.price
  const extras = item.extras.filter((e) => line.extraIds.includes(e.id)).reduce((s, e) => s + e.price, 0)
  return (base + extras) * line.qty
}

export type ResolvedLine = CartLine & { item: Item; total: number }

/** Linhas da sacola com o item atual; descarta itens apagados ou esgotados. */
export function resolveCart(cart: CartLine[], menu: MenuState) {
  const lines: ResolvedLine[] = []
  const dropped: string[] = []
  for (const line of cart) {
    const item = menu.items.find((i) => i.id === line.itemId)
    if (!item) continue
    if (!item.available) {
      dropped.push(item.name)
      continue
    }
    lines.push({ ...line, item, total: linePrice(item, line) })
  }
  const subtotal = lines.reduce((s, l) => s + l.total, 0)
  const count = lines.reduce((s, l) => s + l.qty, 0)
  return { lines, subtotal, count, dropped }
}

export function addToCart(line: Omit<CartLine, "key">) {
  cartStore.set((prev) => {
    // mesma combinação (item, variação, adicionais, observação) soma na linha existente
    const same = prev.find(
      (l) =>
        l.itemId === line.itemId &&
        l.variantId === line.variantId &&
        l.note.trim() === line.note.trim() &&
        l.extraIds.slice().sort().join() === line.extraIds.slice().sort().join(),
    )
    if (same) return prev.map((l) => (l === same ? { ...l, qty: l.qty + line.qty } : l))
    return [...prev, { ...line, key: uid() }]
  })
}

export function setLineQty(key: string, qty: number) {
  cartStore.set((prev) => (qty <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, qty } : l))))
}

export function clearCart() {
  cartStore.set([])
}

export type Checkout = {
  name: string
  mode: "entrega" | "retirada"
  street: string
  number: string
  neighborhood: string
  reference: string
  payment: PaymentMethod
  changeFor: string
  note: string
}

export const paymentLabels: Record<PaymentMethod, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  cartao: "Cartão na entrega",
}

/** Mensagem que vai pronta para o WhatsApp do restaurante. */
export function orderMessage(menu: MenuState, lines: ResolvedLine[], subtotal: number, c: Checkout) {
  const r = menu.restaurant
  const fee = c.mode === "entrega" ? r.deliveryFee : 0
  const out: string[] = []
  out.push(`*Pedido — ${r.name}*`, "")
  for (const l of lines) {
    const variant = l.item.variants.find((v) => v.id === l.variantId)
    out.push(`${l.qty}x ${l.item.name}${variant ? ` (${variant.name})` : ""} — ${money(l.total)}`)
    for (const e of l.item.extras.filter((e) => l.extraIds.includes(e.id))) out.push(`   + ${e.name}`)
    if (l.note.trim()) out.push(`   Obs.: ${l.note.trim()}`)
  }
  out.push("", `Subtotal: ${money(subtotal)}`)
  if (c.mode === "entrega") out.push(`Entrega: ${money(fee)}`)
  out.push(`*Total: ${money(subtotal + fee)}*`, "")
  out.push(`*${c.mode === "entrega" ? "Entrega" : "Retirada no local"}*`)
  out.push(`Nome: ${c.name.trim()}`)
  if (c.mode === "entrega") {
    out.push(`Endereço: ${c.street.trim()}, ${c.number.trim()} — ${c.neighborhood.trim()}`)
    if (c.reference.trim()) out.push(`Referência: ${c.reference.trim()}`)
  }
  const pay = c.payment === "dinheiro" && c.changeFor.trim() ? `Dinheiro (troco para ${c.changeFor.trim()})` : paymentLabels[c.payment]
  out.push(`Pagamento: ${pay}`)
  if (c.note.trim()) out.push(`Observação: ${c.note.trim()}`)
  return out.join("\n")
}

export function whatsappLink(phoneDigits: string, text: string) {
  const digits = phoneDigits.replace(/\D/g, "")
  const full = digits.startsWith("55") ? digits : `55${digits}`
  return `https://wa.me/${full}?text=${encodeURIComponent(text)}`
}
