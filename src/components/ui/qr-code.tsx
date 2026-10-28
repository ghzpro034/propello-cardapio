// QR Code — 21st.dev (@kevingirelli/qr-code), adaptado: sem a animação de
// entrada (`reveal`), que o cardápio não usa. Renderiza no servidor ou no
// cliente como um único SVG nítido, a partir do encoder `qrcode`.
import { create } from "qrcode"
import type { ComponentProps, ReactNode } from "react"

import { cn } from "@/lib/utils"

/** Os três quadrados 7×7 dos cantos, que o leitor usa para se orientar. */
function inFinder(row: number, column: number, size: number) {
  return (
    (row < 7 && column < 7) ||
    (row < 7 && column >= size - 7) ||
    (row >= size - 7 && column < 7)
  )
}

function roundedRect(x: number, y: number, size: number, radius: number) {
  const r = Math.min(radius, size / 2)
  return `M${x + r} ${y}h${size - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${size - 2 * r}a${r} ${r} 0 0 1 -${r} ${r}h-${size - 2 * r}a${r} ${r} 0 0 1 -${r} -${r}v-${size - 2 * r}a${r} ${r} 0 0 1 ${r} -${r}z`
}

interface QRCodeProps extends Omit<ComponentProps<"svg">, "children"> {
  value: string
  size?: number
  variant?: "dots" | "rounded" | "squares"
  errorCorrection?: "L" | "M" | "Q" | "H"
  /** Zona de silêncio em módulos. Leitores pedem pelo menos 2; o padrão pede 4. */
  margin?: number
  color?: string
  background?: string
}

function QRCode({
  value,
  size = 200,
  variant = "squares",
  errorCorrection = "M",
  margin = 2,
  color = "#17181A",
  background = "#ffffff",
  className,
  "aria-label": label,
  ...props
}: QRCodeProps) {
  let modules: ReturnType<typeof create>["modules"]
  try {
    modules = create(value, { errorCorrectionLevel: errorCorrection }).modules
  } catch {
    return null
  }

  const count = modules.size
  const quiet = Math.max(0, margin)
  const total = count + quiet * 2
  const shapes: ReactNode[] = []

  for (let row = 0; row < count; row++) {
    for (let column = 0; column < count; column++) {
      if (!modules.get(row, column) || inFinder(row, column, count)) continue
      const x = column + quiet
      const y = row + quiet
      shapes.push(
        variant === "dots" ? (
          <circle key={`${row}-${column}`} cx={x + 0.5} cy={y + 0.5} r={0.4} />
        ) : (
          <rect
            key={`${row}-${column}`}
            x={x + (variant === "rounded" ? 0.05 : 0)}
            y={y + (variant === "rounded" ? 0.05 : 0)}
            width={variant === "rounded" ? 0.9 : 1}
            height={variant === "rounded" ? 0.9 : 1}
            rx={variant === "rounded" ? 0.3 : 0}
          />
        ),
      )
    }
  }

  const corners = [
    [quiet, quiet],
    [quiet + count - 7, quiet],
    [quiet, quiet + count - 7],
  ] as const
  const square = variant === "squares"

  return (
    <svg
      role="img"
      aria-label={label ?? `QR code: ${value}`}
      data-slot="qr-code"
      width={size}
      height={size}
      viewBox={`0 0 ${total} ${total}`}
      shapeRendering={square ? "crispEdges" : undefined}
      className={cn("block h-auto max-w-full", className)}
      {...props}
    >
      <rect width={total} height={total} fill={background} />
      <g fill={color}>
        {corners.map(([x, y]) => (
          <g key={`${x}-${y}`}>
            <path
              fillRule="evenodd"
              d={`${roundedRect(x, y, 7, square ? 0 : 2.2)}${roundedRect(x + 1, y + 1, 5, square ? 0 : 1.4)}`}
            />
            <path d={roundedRect(x + 2, y + 2, 3, square ? 0 : 1)} />
          </g>
        ))}
        {shapes}
      </g>
    </svg>
  )
}

export { QRCode, type QRCodeProps }
export default QRCode
