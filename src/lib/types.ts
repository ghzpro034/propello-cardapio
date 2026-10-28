export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6 // 0 = domingo

export type DayHours = {
  enabled: boolean
  open: string // "HH:MM"
  close: string // "HH:MM"
}

export type PaymentMethod = "pix" | "dinheiro" | "cartao"

export type AccentName = "laranja" | "folha" | "vinho" | "petroleo" | "carvao"

export type Restaurant = {
  name: string
  slug: string
  tagline: string
  whatsapp: string // só dígitos, com DDD (sem 55)
  address: string
  neighborhood: string
  city: string
  deliveryFee: number // centavos
  minimumOrder: number // centavos
  deliveryTime: string // "40–60 min"
  acceptsDelivery: boolean
  acceptsPickup: boolean
  payments: PaymentMethod[]
  hours: Record<Weekday, DayHours>
  paused: boolean
  accent: AccentName
}

export type Variant = { id: string; name: string; price: number }
export type Extra = { id: string; name: string; price: number }

export type Item = {
  id: string
  categoryId: string
  name: string
  description: string
  price: number // centavos (preço base; com variações, o menor)
  variants: Variant[]
  extras: Extra[]
  available: boolean
  photo?: string
  serves?: string
}

export type Category = { id: string; name: string }

export type MenuState = {
  restaurant: Restaurant
  categories: Category[]
  items: Item[]
}

export type CartLine = {
  key: string
  itemId: string
  variantId?: string
  extraIds: string[]
  note: string
  qty: number
}
