"use client"

import { ExternalLink, LogOut, Menu, QrCode, RotateCcw, Store, UtensilsCrossed } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { useNow } from "@/hooks/use-now"
import { toast } from "sonner"
import { PropelloSymbol } from "@/components/brand/propello"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { openStatus, type OpenStatus } from "@/lib/format"
import { resetDemo, useMenu } from "@/lib/store"
import { supabaseBrowser } from "@/lib/supabase/client"
import { supabaseEnabled } from "@/lib/supabase/config"
import { cn } from "@/lib/utils"

const nav = [
  { href: "/painel", label: "Cardápio", icon: UtensilsCrossed },
  { href: "/painel/restaurante", label: "Restaurante", icon: Store },
  { href: "/painel/qr", label: "Link e QR code", icon: QrCode },
]

export function useOpenStatus() {
  const { restaurant } = useMenu()
  const now = useNow()
  return now ? openStatus(restaurant, now) : null
}

function StatusDot({ status }: { status: OpenStatus | null }) {
  const label = !status ? "…" : status.open ? "Aberto" : status.reason === "paused" ? "Pausado" : "Fechado"
  return (
    <span className="flex items-center gap-1.5 text-[13px] text-suave">
      <span
        aria-hidden
        className={cn(
          "size-2 rounded-[2px]",
          !status ? "bg-ativo" : status.open ? "bg-positivo" : status.reason === "paused" ? "bg-laranja" : "bg-controle",
        )}
      />
      {label}
    </span>
  )
}

function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { restaurant } = useMenu()
  const status = useOpenStatus()

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-4 pt-5 pb-4">
        <PropelloSymbol size={28} />
        <span className="text-[17px] font-extrabold tracking-[-0.01em]">Cardápio</span>
      </div>

      <div className="mx-3 mb-4 rounded-md border border-linha bg-elevada px-3 py-2.5">
        <p className="truncate text-[15px] leading-tight font-bold">{restaurant.name}</p>
        <StatusDot status={status} />
      </div>

      <nav aria-label="Painel" className="flex flex-col gap-0.5 px-3">
        {nav.map(({ href, label, icon: Icon }) => {
          const current = href === "/painel" ? pathname === "/painel" : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={current ? "page" : undefined}
              className={cn(
                "flex h-10 items-center gap-2.5 rounded-md px-2.5 text-[15px] transition-colors",
                current ? "bg-ativo font-semibold text-foreground" : "text-suave hover:bg-ativo/60 hover:text-foreground",
              )}
            >
              <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-0.5 px-3 pb-4">
        <a
          href={`/r/${restaurant.slug}`}
          target="_blank"
          rel="noreferrer"
          className="flex h-10 items-center gap-2.5 rounded-md px-2.5 text-[15px] text-suave transition-colors hover:bg-ativo/60 hover:text-foreground"
        >
          <ExternalLink className="size-[18px]" strokeWidth={1.75} aria-hidden />
          Ver cardápio
        </a>
        {supabaseEnabled ? (
          <button
            type="button"
            onClick={async () => {
              await supabaseBrowser().auth.signOut()
              router.replace("/entrar")
            }}
            className="flex h-10 items-center gap-2.5 rounded-md px-2.5 text-left text-[15px] text-suave transition-colors hover:bg-ativo/60 hover:text-foreground"
          >
            <LogOut className="size-[18px]" strokeWidth={1.75} aria-hidden />
            Sair
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              resetDemo()
              toast("Dados de exemplo restaurados")
            }}
            className="flex h-10 items-center gap-2.5 rounded-md px-2.5 text-left text-[15px] text-suave transition-colors hover:bg-ativo/60 hover:text-foreground"
          >
            <RotateCcw className="size-[18px]" strokeWidth={1.75} aria-hidden />
            Restaurar exemplo
          </button>
        )}
      </div>
    </div>
  )
}

export function PanelShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const current = nav.find((n) => (n.href === "/painel" ? pathname === "/painel" : pathname.startsWith(n.href)))

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh border-r border-linha lg:block">
        <SideNav />
      </aside>

      {/* topo no celular e tablet */}
      <div className="nao-imprimir sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-linha bg-background px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          className="-ml-2 flex size-11 items-center justify-center rounded-md hover:bg-ativo"
        >
          <Menu className="size-5" />
        </button>
        <PropelloSymbol size={24} />
        <span className="text-[15px] font-bold">{current?.label ?? "Painel"}</span>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[280px] bg-background p-0">
          <SheetTitle className="sr-only">Menu do painel</SheetTitle>
          <SideNav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="min-w-0">{children}</div>
    </div>
  )
}

export function PageHeader({
  title,
  subline,
  actions,
}: {
  title: string
  subline?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[28px] leading-tight font-extrabold tracking-[-0.015em]">{title}</h1>
        {subline ? <p className="mt-1 text-[15px] text-suave">{subline}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}

export function Canvas({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[1160px] px-4 pt-6 pb-16 sm:px-6 lg:px-10 lg:pt-10", className)}>{children}</div>
}
