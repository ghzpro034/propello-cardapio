"use client"

import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import { supabaseKey, supabaseUrl } from "./config"

let client: SupabaseClient | null = null

/** Cliente do navegador: usa a sessão do dono, e o RLS limita o que ele pode gravar. */
export function supabaseBrowser() {
  client ??= createBrowserClient(supabaseUrl, supabaseKey)
  return client
}
