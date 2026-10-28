import type { Metadata, Viewport } from "next"
import "@fontsource-variable/archivo"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  title: {
    default: "Cardápio — Propello",
    template: "%s — Propello Cardápio",
  },
  description: "Cardápio digital com pedido pelo WhatsApp, feito pela Propello em Uberlândia.",
}

export const viewport: Viewport = {
  themeColor: "#F6EFE6",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
