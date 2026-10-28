import type { Metadata } from "next"
import { RemoteGate } from "@/components/painel/remote-gate"
import { PanelShell } from "@/components/painel/shell"

export const metadata: Metadata = {
  title: { default: "Painel", template: "%s — Painel do cardápio" },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RemoteGate>
      <PanelShell>{children}</PanelShell>
    </RemoteGate>
  )
}
