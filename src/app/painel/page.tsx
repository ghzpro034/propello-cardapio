import type { Metadata } from "next"
import { CardapioScreen } from "@/components/painel/cardapio-screen"

export const metadata: Metadata = { title: "Cardápio" }

export default function Page() {
  return <CardapioScreen />
}
