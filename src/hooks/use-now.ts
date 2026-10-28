"use client"

import { useSyncExternalStore } from "react"

const STEP = 30_000

/** Hora atual, arredondada a cada 30 s. No servidor é `null` (o status depende do relógio do cliente). */
export function useNow(): Date | null {
  const ts = useSyncExternalStore(
    (onChange) => {
      const t = setInterval(onChange, STEP)
      return () => clearInterval(t)
    },
    () => Math.floor(Date.now() / STEP) * STEP,
    () => null,
  )
  return ts === null ? null : new Date(ts)
}
