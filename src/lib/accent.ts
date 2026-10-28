import type { AccentName } from "./types"

/**
 * Cores que o restaurante pode escolher para o próprio cardápio.
 * `bg` é o fundo do botão principal, `ink` o texto em cima dele e `text` a
 * cor usada como texto sobre o creme (sempre com contraste ≥ 4,5:1).
 */
export const accents: Record<AccentName, { label: string; bg: string; ink: string; text: string }> = {
  laranja: { label: "Laranja", bg: "#FF5B1F", ink: "#17181A", text: "#B8400F" },
  folha: { label: "Verde-folha", bg: "#2F6B3A", ink: "#F6EFE6", text: "#2F6B3A" },
  vinho: { label: "Vinho", bg: "#7A1F2B", ink: "#F6EFE6", text: "#7A1F2B" },
  petroleo: { label: "Petróleo", bg: "#0E4446", ink: "#F6EFE6", text: "#0E4446" },
  carvao: { label: "Carvão", bg: "#17181A", ink: "#F6EFE6", text: "#17181A" },
}

export function accentVars(name: AccentName) {
  const a = accents[name] ?? accents.laranja
  return {
    "--marca": a.bg,
    "--sobre-marca": a.ink,
    "--marca-texto": a.text,
  } as React.CSSProperties
}
