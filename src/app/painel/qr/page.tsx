import type { Metadata } from "next"
import { QrScreen } from "@/components/painel/qr-screen"

export const metadata: Metadata = { title: "Link e QR code" }

export default function Page() {
  return <QrScreen />
}
