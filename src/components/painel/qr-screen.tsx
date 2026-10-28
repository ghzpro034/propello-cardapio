"use client"

import { Check, Copy, Download, ExternalLink, Printer } from "lucide-react"
import { useRef, useState, useSyncExternalStore } from "react"
import { toast } from "sonner"
import { Canvas, PageHeader } from "@/components/painel/shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { QRCode } from "@/components/ui/qr-code"
import { useMenu } from "@/lib/store"

export function QrScreen() {
  const { restaurant: r } = useMenu()
  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  )
  const [copied, setCopied] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)

  const url = `${origin || "https://seu-dominio.com.br"}/r/${r.slug}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast("Link copiado")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast("Não deu para copiar. Selecione o link e copie à mão.")
    }
  }

  function svgString() {
    const svg = qrRef.current?.querySelector("svg")
    if (!svg) return null
    const clone = svg.cloneNode(true) as SVGSVGElement
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg")
    return new XMLSerializer().serializeToString(clone)
  }

  function download(kind: "svg" | "png") {
    const s = svgString()
    if (!s) return
    const name = `qr-cardapio-${r.slug}`
    if (kind === "svg") {
      const blob = new Blob([s], { type: "image/svg+xml" })
      triggerDownload(URL.createObjectURL(blob), `${name}.svg`)
      return
    }
    const img = new Image()
    img.onload = () => {
      const size = 1200
      const canvas = document.createElement("canvas")
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext("2d")!
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(img, 0, 0, size, size)
      triggerDownload(canvas.toDataURL("image/png"), `${name}.png`)
    }
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}`
  }

  return (
    <Canvas>
      <div className="nao-imprimir">
        <PageHeader
          title="Link e QR code"
          subline="Cole o link na bio do Instagram e no WhatsApp Business. Imprima o display e coloque nas mesas e no balcão."
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
        <section aria-labelledby="link-titulo" className="nao-imprimir flex flex-col gap-6 rounded-lg border border-linha bg-elevada p-5 sm:p-6">
          <div className="flex flex-col gap-2">
            <h2 id="link-titulo" className="text-[18px] font-extrabold">
              Link do cardápio
            </h2>
            <div className="flex">
              <Input readOnly value={url} aria-label="Link do cardápio" className="num rounded-r-none" onFocus={(e) => e.target.select()} />
              <Button onClick={copy} className="h-11 rounded-l-none" variant="escuro">
                {copied ? <Check /> : <Copy />} {copied ? "Copiado" : "Copiar"}
              </Button>
            </div>
            <a
              href={`/r/${r.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 self-start text-[15px] font-semibold underline underline-offset-2"
            >
              Abrir o cardápio <ExternalLink className="size-4" aria-hidden />
            </a>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-[18px] font-extrabold">QR code</h2>
            <div ref={qrRef} className="w-full max-w-[260px] rounded-md border border-linha bg-white p-3">
              <QRCode value={url} size={234} margin={2} errorCorrection="Q" aria-label={`QR code do cardápio: ${url}`} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => download("png")}>
                <Download /> Baixar PNG
              </Button>
              <Button variant="outline" onClick={() => download("svg")}>
                <Download /> Baixar SVG para gráfica
              </Button>
            </div>
            {!origin.startsWith("https://") ? (
              <p className="rounded-md border border-[#e9cf8f] bg-[#fbf3dc] px-3 py-2 text-[13px] text-[#6b4a0b]">
                Este link aponta para o seu computador ({origin || "local"}). Publique o sistema num domínio antes de imprimir o QR
                code de verdade.
              </p>
            ) : null}
          </div>
        </section>

        <section aria-labelledby="display-titulo" className="flex flex-col gap-3">
          <div className="nao-imprimir flex items-center justify-between gap-3">
            <h2 id="display-titulo" className="text-[18px] font-extrabold">
              Display de mesa
            </h2>
            <Button onClick={() => window.print()}>
              <Printer /> Imprimir
            </Button>
          </div>
          <p className="nao-imprimir text-[14px] text-suave">Tamanho A6 (10,5 × 14,8 cm). Dá para imprimir quatro numa folha A4.</p>

          {/* a peça impressa */}
          <div className="display-mesa mx-auto flex aspect-[105/148] w-full max-w-[360px] flex-col items-center justify-between rounded-lg bg-carvao px-7 pt-8 pb-6 text-creme print:max-w-none print:rounded-none">
            <div className="flex w-full flex-col items-center text-center">
              <p className="text-[15px] font-semibold text-[#b9b2a8]">Cardápio e pedido pelo celular</p>
              <p className="mt-2 text-[30px] leading-[0.98] font-extrabold tracking-[-0.02em]">{r.name}</p>
            </div>
            <div className="rounded-md bg-white p-2.5">
              <QRCode value={url} size={168} margin={1} errorCorrection="Q" aria-hidden="true" />
            </div>
            <div className="flex w-full flex-col items-center gap-3 text-center">
              <p className="text-[17px] leading-snug font-bold">
                Aponte a câmera e peça <span className="sublinhado">pelo WhatsApp</span>
              </p>
              <p className="num text-[13px] text-[#b9b2a8]">/r/{r.slug}</p>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        @media print {
          @page { size: A6; margin: 0; }
          body * { visibility: hidden; }
          .display-mesa, .display-mesa * { visibility: visible; }
          .display-mesa { position: fixed; inset: 0; width: 105mm; height: 148mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </Canvas>
  )
}

function triggerDownload(href: string, filename: string) {
  const a = document.createElement("a")
  a.href = href
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}
