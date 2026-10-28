import type { DayHours, Item, MenuState, Restaurant, Weekday } from "./types"

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

/** Centavos para "R$ 18,00". */
export function money(cents: number) {
  return brl.format(cents / 100).replace(/ /g, " ")
}

/** "18,00" -> 1800. Aceita "18", "18,5", "18.50", "R$ 18,00". */
export function parseMoney(input: string): number | null {
  const clean = input.replace(/[^\d,.-]/g, "").trim()
  if (!clean) return null
  const normalized = clean.includes(",")
    ? clean.replace(/\./g, "").replace(",", ".")
    : clean
  const value = Number(normalized)
  if (!Number.isFinite(value) || value < 0) return null
  return Math.round(value * 100)
}

export function centsToInput(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",")
}

export const weekdayNames: Record<Weekday, string> = {
  0: "Domingo",
  1: "Segunda",
  2: "Terça",
  3: "Quarta",
  4: "Quinta",
  5: "Sexta",
  6: "Sábado",
}

export const weekdayOrder: Weekday[] = [1, 2, 3, 4, 5, 6, 0]

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + (m || 0)
}

/** Hora local de Uberlândia (America/Sao_Paulo), independente do aparelho. */
export function nowInBrazil(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ""
  const map: Record<string, Weekday> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return { weekday: map[get("weekday")], minutes: Number(get("hour")) * 60 + Number(get("minute")) }
}

export type OpenStatus =
  | { open: true; closesAt: string }
  | { open: false; reason: "paused" | "closed"; next?: { day: Weekday; time: string; today: boolean; tomorrow: boolean } }

export function openStatus(r: Restaurant, date = new Date()): OpenStatus {
  const { weekday, minutes } = nowInBrazil(date)
  const today: DayHours = r.hours[weekday]
  if (r.paused) return { open: false, reason: "paused" }
  if (today.enabled && minutes >= toMinutes(today.open) && minutes < toMinutes(today.close)) {
    return { open: true, closesAt: today.close }
  }
  // próximo horário de abertura
  for (let offset = 0; offset < 8; offset++) {
    const day = ((weekday + offset) % 7) as Weekday
    const h = r.hours[day]
    if (!h.enabled) continue
    if (offset === 0 && minutes >= toMinutes(h.open)) continue
    return { open: false, reason: "closed", next: { day, time: h.open, today: offset === 0, tomorrow: offset === 1 } }
  }
  return { open: false, reason: "closed" }
}

export function statusLine(s: OpenStatus) {
  if (s.open) return `Aberto agora · fecha às ${s.closesAt}`
  if (s.reason === "paused") return "Pedidos pausados no momento"
  if (!s.next) return "Fechado"
  const when = s.next.today ? "hoje" : s.next.tomorrow ? "amanhã" : weekdayNames[s.next.day].toLowerCase()
  return `Fechado · abre ${when} às ${s.next.time}`
}

export function itemFromPrice(item: Item) {
  if (item.variants.length === 0) return item.price
  return Math.min(...item.variants.map((v) => v.price))
}

export function counts(state: MenuState) {
  const total = state.items.length
  const soldOut = state.items.filter((i) => !i.available).length
  return { total, soldOut, available: total - soldOut, categories: state.categories.length }
}

export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export function formatPhone(digits: string) {
  const d = digits.replace(/\D/g, "")
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return digits
}

export function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`
}
