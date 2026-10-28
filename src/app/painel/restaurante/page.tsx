import type { Metadata } from "next"
import { RestauranteScreen } from "@/components/painel/restaurante-screen"

export const metadata: Metadata = { title: "Restaurante" }

export default function Page() {
  return <RestauranteScreen />
}
