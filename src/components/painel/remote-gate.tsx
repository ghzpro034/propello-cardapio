"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { CreateRestaurantForm, type NewRestaurant } from "@/components/painel/auth-screens"
import { Button } from "@/components/ui/button"
import { supabaseEnabled } from "@/lib/supabase/config"
import { createRestaurant, loadOwnerMenu, startSync } from "@/lib/sync"
import type { MenuState } from "@/lib/types"

type Phase =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "new" }
  | { kind: "ready"; id: string; menu: MenuState }

/**
 * Com Supabase, o painel só aparece depois de saber quem é o dono e carregar o
 * restaurante dele. Sem Supabase (modo demonstração), passa direto.
 */
export function RemoteGate({ children }: { children: React.ReactNode }) {
  if (!supabaseEnabled) return children
  return <Gate>{children}</Gate>
}

function Gate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>({ kind: "loading" })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let alive = true
    loadOwnerMenu()
      .then((found) => {
        if (!alive) return
        if (found === "sem-sessao") router.replace("/entrar")
        else if (found) setPhase({ kind: "ready", ...found })
        else setPhase({ kind: "new" })
      })
      .catch((e: { message?: string }) => alive && setPhase({ kind: "error", message: e?.message ?? "Erro desconhecido" }))
    return () => {
      alive = false
    }
  }, [router, attempt])

  const readyId = phase.kind === "ready" ? phase.id : null
  const readyMenu = phase.kind === "ready" ? phase.menu : null
  useEffect(() => {
    if (!readyId || !readyMenu) return
    return startSync(readyId, readyMenu)
    // o menu inicial só importa na primeira carga; depois quem manda é o store
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyId])

  if (phase.kind === "ready") return children

  if (phase.kind === "new") {
    return (
      <CreateRestaurantForm
        onCreate={async (info: NewRestaurant) => {
          try {
            const created = await createRestaurant(info)
            setPhase({ kind: "ready", ...created })
          } catch (e) {
            const err = e as { code?: string; message?: string }
            if (err?.code === "23505") return "Esse endereço do link já está em uso. Escolha outro."
            return err?.message ?? "Não deu para criar. Tente de novo."
          }
        }}
      />
    )
  }

  if (phase.kind === "error") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 px-4">
        <h1 className="text-3xl font-extrabold tracking-[-0.015em]">Não deu para abrir o painel</h1>
        <p className="text-suave">{phase.message}</p>
        <Button
          variant="escuro"
          className="self-start"
          onClick={() => {
            setPhase({ kind: "loading" })
            setAttempt((n) => n + 1)
          }}
        >
          Tentar de novo
        </Button>
      </main>
    )
  }

  return (
    <main className="flex min-h-dvh items-center justify-center" aria-busy>
      <p className="text-suave">Carregando o painel…</p>
    </main>
  )
}
