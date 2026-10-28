"use client"

import { toast } from "sonner"
import { categoryToRow, itemToRow, restaurantToRow, rowsToMenu, type CategoryRow, type ItemRow, type RestaurantRow } from "./db"
import { seed } from "./seed"
import { menuStore, uid } from "./store"
import { refreshPublicMenu } from "./supabase/actions"
import { supabaseBrowser } from "./supabase/client"
import type { MenuState, Restaurant } from "./types"

/**
 * Ponte entre o menuStore e o Supabase. As telas continuam chamando
 * menu-actions, que mudam o estado local na hora; aqui a gente compara com o
 * último estado gravado e manda só o que mudou, agrupando edições seguidas.
 */

const DEBOUNCE_MS = 600

/** O restaurante do dono logado; `null` se ainda não criou, `"sem-sessao"` se não está logado. */
export async function loadOwnerMenu(): Promise<{ id: string; menu: MenuState } | null | "sem-sessao"> {
  const db = supabaseBrowser()
  const { data: auth } = await db.auth.getUser()
  if (!auth.user) return "sem-sessao"
  const { data: r, error } = await db
    .from("restaurants")
    .select("*")
    .eq("owner_id", auth.user.id)
    .order("created_at")
    .limit(1)
    .maybeSingle<RestaurantRow>()
  if (error) throw error
  if (!r) return null
  return { id: r.id, menu: await loadMenu(r) }
}

async function loadMenu(r: RestaurantRow): Promise<MenuState> {
  const db = supabaseBrowser()
  const [cats, items] = await Promise.all([
    db.from("categories").select("*").eq("restaurant_id", r.id).order("position").returns<CategoryRow[]>(),
    db.from("items").select("*").eq("restaurant_id", r.id).order("position").returns<ItemRow[]>(),
  ])
  if (cats.error) throw cats.error
  if (items.error) throw items.error
  return rowsToMenu(r, cats.data, items.data)
}

/** Cria o restaurante do dono a partir do cardápio de exemplo, já com nome, link e WhatsApp dele. */
export async function createRestaurant(info: Pick<Restaurant, "name" | "slug" | "whatsapp">) {
  const db = supabaseBrowser()
  const { data: auth } = await db.auth.getUser()
  if (!auth.user) throw new Error("Sessão expirada. Entre de novo.")

  const restaurant: Restaurant = { ...seed.restaurant, ...info, tagline: "", address: "", neighborhood: "" }
  const { data: r, error } = await db
    .from("restaurants")
    .insert({ ...restaurantToRow(restaurant), owner_id: auth.user.id })
    .select("*")
    .single<RestaurantRow>()
  if (error) throw error

  // ids do exemplo são legíveis ("marmitex"); no banco viram UUID
  const catIds = new Map(seed.categories.map((c) => [c.id, uid()]))
  const cats = seed.categories.map((c, i) => categoryToRow({ ...c, id: catIds.get(c.id)! }, r.id, i))
  const items = seed.items.map((it, i) => itemToRow({ ...it, id: uid(), categoryId: catIds.get(it.categoryId)! }, r.id, i))
  const c = await db.from("categories").insert(cats)
  if (c.error) throw c.error
  const it = await db.from("items").insert(items)
  if (it.error) throw it.error

  return { id: r.id, menu: await loadMenu(r) }
}

/** Liga a gravação automática. Devolve a função que desliga. */
export function startSync(restaurantId: string, initial: MenuState) {
  let saved = initial
  let timer: ReturnType<typeof setTimeout> | undefined
  let running: Promise<void> = Promise.resolve()

  menuStore.hydrate(initial)

  async function flush() {
    const next = menuStore.get()
    const prev = saved
    if (next === prev) return
    try {
      await push(restaurantId, prev, next)
      saved = next
      // já está gravado; se a renovação do cache falhar, o cardápio atualiza quando o cache vencer
      refreshPublicMenu([prev.restaurant.slug, next.restaurant.slug]).catch(() => {})
    } catch (e) {
      const msg = describe(e)
      toast.error("Não deu para salvar", { description: msg })
      // volta para o que está no banco, para a tela não mostrar algo que não foi gravado
      try {
        const fresh = await loadOwnerMenu()
        if (fresh && fresh !== "sem-sessao") {
          saved = fresh.menu
          menuStore.hydrate(fresh.menu)
        }
      } catch {
        /* sem conexão: mantém a tela como está e tenta de novo na próxima mudança */
      }
    }
  }

  const unsubscribe = menuStore.subscribe(() => {
    if (menuStore.get() === saved) return
    clearTimeout(timer)
    timer = setTimeout(() => {
      running = running.then(flush)
    }, DEBOUNCE_MS)
  })

  function beforeUnload(e: BeforeUnloadEvent) {
    if (menuStore.get() !== saved) e.preventDefault()
  }
  window.addEventListener("beforeunload", beforeUnload)

  return () => {
    clearTimeout(timer)
    unsubscribe()
    window.removeEventListener("beforeunload", beforeUnload)
  }
}

async function push(restaurantId: string, prev: MenuState, next: MenuState) {
  const db = supabaseBrowser()

  if (prev.restaurant !== next.restaurant) {
    const { error } = await db.from("restaurants").update(restaurantToRow(next.restaurant)).eq("id", restaurantId)
    if (error) throw error
  }

  // upsert do que é novo, mudou ou trocou de posição; o resto fica como está
  const prevCats = new Map(prev.categories.map((c, i) => [c.id, { c, i }]))
  const cats = next.categories
    .map((c, i) => ({ c, i }))
    .filter(({ c, i }) => prevCats.get(c.id)?.c !== c || prevCats.get(c.id)?.i !== i)
    .map(({ c, i }) => categoryToRow(c, restaurantId, i))
  if (cats.length) {
    const { error } = await db.from("categories").upsert(cats)
    if (error) throw error
  }

  const prevItems = new Map(prev.items.map((it, i) => [it.id, { it, i }]))
  const items = next.items
    .map((it, i) => ({ it, i }))
    .filter(({ it, i }) => prevItems.get(it.id)?.it !== it || prevItems.get(it.id)?.i !== i)
    .map(({ it, i }) => itemToRow(it, restaurantId, i))
  if (items.length) {
    const { error } = await db.from("items").upsert(items)
    if (error) throw error
  }

  const nextItemIds = new Set(next.items.map((i) => i.id))
  const goneItems = prev.items.filter((i) => !nextItemIds.has(i.id)).map((i) => i.id)
  if (goneItems.length) {
    const { error } = await db.from("items").delete().in("id", goneItems)
    if (error) throw error
  }

  const nextCatIds = new Set(next.categories.map((c) => c.id))
  const goneCats = prev.categories.filter((c) => !nextCatIds.has(c.id)).map((c) => c.id)
  if (goneCats.length) {
    const { error } = await db.from("categories").delete().in("id", goneCats)
    if (error) throw error
  }
}

function describe(e: unknown) {
  const err = e as { code?: string; message?: string }
  if (err?.code === "23505") return "Esse endereço do link já está em uso por outro restaurante."
  if (err?.code === "23514") return "Algum campo está num formato que o banco não aceita (confira WhatsApp e link)."
  return err?.message ?? "Confira a conexão e tente de novo."
}
