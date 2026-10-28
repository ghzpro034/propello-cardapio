import type { Category, Item, MenuState, Restaurant } from "./types"

/** Linhas como estão no Postgres (snake_case). Ver supabase/migrations. */
export type RestaurantRow = {
  id: string
  owner_id: string
  slug: string
  name: string
  tagline: string
  whatsapp: string
  address: string
  neighborhood: string
  city: string
  delivery_fee: number
  minimum_order: number
  delivery_time: string
  accepts_delivery: boolean
  accepts_pickup: boolean
  payments: Restaurant["payments"]
  hours: Restaurant["hours"]
  paused: boolean
  accent: Restaurant["accent"]
}

export type CategoryRow = { id: string; restaurant_id: string; name: string; position: number }

export type ItemRow = {
  id: string
  restaurant_id: string
  category_id: string
  name: string
  description: string
  price: number
  variants: Item["variants"]
  extras: Item["extras"]
  available: boolean
  photo: string | null
  serves: string | null
  position: number
}

export function restaurantFromRow(r: RestaurantRow): Restaurant {
  return {
    name: r.name,
    slug: r.slug,
    tagline: r.tagline,
    whatsapp: r.whatsapp,
    address: r.address,
    neighborhood: r.neighborhood,
    city: r.city,
    deliveryFee: r.delivery_fee,
    minimumOrder: r.minimum_order,
    deliveryTime: r.delivery_time,
    acceptsDelivery: r.accepts_delivery,
    acceptsPickup: r.accepts_pickup,
    payments: r.payments,
    hours: r.hours,
    paused: r.paused,
    accent: r.accent,
  }
}

export function restaurantToRow(r: Restaurant): Omit<RestaurantRow, "id" | "owner_id"> {
  return {
    name: r.name,
    slug: r.slug,
    tagline: r.tagline,
    whatsapp: r.whatsapp,
    address: r.address,
    neighborhood: r.neighborhood,
    city: r.city,
    delivery_fee: r.deliveryFee,
    minimum_order: r.minimumOrder,
    delivery_time: r.deliveryTime,
    accepts_delivery: r.acceptsDelivery,
    accepts_pickup: r.acceptsPickup,
    payments: r.payments,
    hours: r.hours,
    paused: r.paused,
    accent: r.accent,
  }
}

export function categoryToRow(c: Category, restaurantId: string, position: number): CategoryRow {
  return { id: c.id, restaurant_id: restaurantId, name: c.name, position }
}

export function itemFromRow(i: ItemRow): Item {
  return {
    id: i.id,
    categoryId: i.category_id,
    name: i.name,
    description: i.description,
    price: i.price,
    variants: i.variants,
    extras: i.extras,
    available: i.available,
    photo: i.photo ?? undefined,
    serves: i.serves ?? undefined,
  }
}

export function itemToRow(i: Item, restaurantId: string, position: number): ItemRow {
  return {
    id: i.id,
    restaurant_id: restaurantId,
    category_id: i.categoryId,
    name: i.name,
    description: i.description,
    price: i.price,
    variants: i.variants,
    extras: i.extras,
    available: i.available,
    photo: i.photo || null,
    serves: i.serves || null,
    position,
  }
}

export function rowsToMenu(r: RestaurantRow, cats: CategoryRow[], items: ItemRow[]): MenuState {
  return {
    restaurant: restaurantFromRow(r),
    categories: cats.map((c) => ({ id: c.id, name: c.name })),
    items: items.map(itemFromRow),
  }
}
