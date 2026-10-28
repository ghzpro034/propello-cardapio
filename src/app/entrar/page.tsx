import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { LoginForm } from "@/components/painel/auth-screens"
import { supabaseEnabled } from "@/lib/supabase/config"

export const metadata: Metadata = { title: "Entrar" }

export default function Page() {
  // modo demonstração não tem login
  if (!supabaseEnabled) redirect("/painel")
  return <LoginForm />
}
