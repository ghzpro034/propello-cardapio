import { createClient } from "@supabase/supabase-js"
import { cacheLife, cacheTag } from "next/cache"
import { rowsToMenu, type CategoryRow, type ItemRow, type RestaurantRow } from "@/lib/db"
import type { MenuState } from "@/lib/types"
import { supabaseKey, supabaseUrl } from "./config"

/** Cliente sem sessão, só para ler o que é público (cardápio). */
function anon() {
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
}

export const menuTag = (slug: string) => `menu:${slug}`

/** Cardápio público em cache; o painel expira a tag quando o dono salva. */
export async function getPublicMenu(slug: string): Promise<MenuState | null> {
  "use cache"
  cacheTag(menuTag(slug))
  cacheLife("days")

  const db = anon()
  const { data: r, error } = await db.from("restaurants").select("*").eq("slug", slug).maybeSingle<RestaurantRow>()
  if (error) throw error
  if (!r) return null

  const [cats, items] = await Promise.all([
    db.from("categories").select("*").eq("restaurant_id", r.id).order("position").returns<CategoryRow[]>(),
    db.from("items").select("*").eq("restaurant_id", r.id).order("position").returns<ItemRow[]>(),
  ])
  if (cats.error) throw cats.error
  if (items.error) throw items.error
  return rowsToMenu(r, cats.data, items.data)
}

export async function getPublicSlugs(): Promise<string[]> {
  "use cache"
  cacheLife("hours")
  const { data, error } = await anon().from("restaurants").select("slug").limit(500)
  if (error) throw error
  return data.map((r) => r.slug as string)
}
