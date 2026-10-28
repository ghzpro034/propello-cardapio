import { menuStore, uid } from "./store"
import type { Category, Item, Restaurant } from "./types"

export function updateRestaurant(patch: Partial<Restaurant>) {
  menuStore.set((s) => ({ ...s, restaurant: { ...s.restaurant, ...patch } }))
}

export function setAvailable(itemId: string, available: boolean) {
  menuStore.set((s) => ({ ...s, items: s.items.map((i) => (i.id === itemId ? { ...i, available } : i)) }))
}

export function saveItem(item: Item) {
  menuStore.set((s) => {
    const exists = s.items.some((i) => i.id === item.id)
    // com tamanhos, o preço base vira o menor tamanho
    const price = item.variants.length ? Math.min(...item.variants.map((v) => v.price)) : item.price
    const next = { ...item, price }
    return { ...s, items: exists ? s.items.map((i) => (i.id === item.id ? next : i)) : [...s.items, next] }
  })
}

export function deleteItem(itemId: string) {
  menuStore.set((s) => ({ ...s, items: s.items.filter((i) => i.id !== itemId) }))
}

export function duplicateItem(itemId: string) {
  menuStore.set((s) => {
    const idx = s.items.findIndex((i) => i.id === itemId)
    if (idx < 0) return s
    const copy = { ...s.items[idx], id: uid("item"), name: `${s.items[idx].name} (cópia)` }
    const items = [...s.items]
    items.splice(idx + 1, 0, copy)
    return { ...s, items }
  })
}

/** Move o item uma posição dentro da própria categoria. */
export function moveItem(itemId: string, dir: -1 | 1) {
  menuStore.set((s) => {
    const item = s.items.find((i) => i.id === itemId)
    if (!item) return s
    const same = s.items.filter((i) => i.categoryId === item.categoryId)
    const pos = same.findIndex((i) => i.id === itemId)
    const target = same[pos + dir]
    if (!target) return s
    const items = [...s.items]
    const a = items.findIndex((i) => i.id === itemId)
    const b = items.findIndex((i) => i.id === target.id)
    ;[items[a], items[b]] = [items[b], items[a]]
    return { ...s, items }
  })
}

export function addCategory(name: string): Category {
  const cat = { id: uid("cat"), name: name.trim() }
  menuStore.set((s) => ({ ...s, categories: [...s.categories, cat] }))
  return cat
}

export function renameCategory(id: string, name: string) {
  menuStore.set((s) => ({ ...s, categories: s.categories.map((c) => (c.id === id ? { ...c, name: name.trim() } : c)) }))
}

export function deleteCategory(id: string) {
  menuStore.set((s) => ({
    ...s,
    categories: s.categories.filter((c) => c.id !== id),
    items: s.items.filter((i) => i.categoryId !== id),
  }))
}

export function moveCategory(id: string, dir: -1 | 1) {
  menuStore.set((s) => {
    const cats = [...s.categories]
    const a = cats.findIndex((c) => c.id === id)
    const b = a + dir
    if (a < 0 || b < 0 || b >= cats.length) return s
    ;[cats[a], cats[b]] = [cats[b], cats[a]]
    return { ...s, categories: cats }
  })
}
