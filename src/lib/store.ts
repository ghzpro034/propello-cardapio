"use client"

import { useSyncExternalStore } from "react"
import { seed } from "./seed"
import type { CartLine, MenuState } from "./types"

/**
 * Modo demonstração (sem Supabase): o cardápio fica no localStorage do navegador
 * e painel e cardápio conversam entre abas. Com Supabase, o painel chama
 * `menuStore.hydrate` com os dados do banco e `src/lib/sync.ts` grava cada
 * mudança; a interface do store continua a mesma para as telas.
 */
const KEY = "propello-cardapio:v1"
const CART_KEY = "propello-cardapio:sacola:v1"

type Listener = () => void

function createStore<T>(key: string, initial: T) {
  let state: T = initial
  let loaded = false
  // com Supabase o painel recebe o estado do banco e não usa o localStorage
  let remote = false
  const listeners = new Set<Listener>()

  function load() {
    if (loaded || remote || typeof window === "undefined") return
    loaded = true
    try {
      const raw = window.localStorage.getItem(key)
      if (raw) state = JSON.parse(raw) as T
    } catch {
      /* armazenamento indisponível: segue com os dados iniciais */
    }
  }

  function persist() {
    if (remote) return
    try {
      window.localStorage.setItem(key, JSON.stringify(state))
    } catch {
      /* sem armazenamento: o estado vale só para esta aba */
    }
  }

  function emit() {
    listeners.forEach((l) => l())
  }

  if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
      if (e.key !== key || remote) return
      try {
        state = e.newValue ? (JSON.parse(e.newValue) as T) : initial
      } catch {
        state = initial
      }
      emit()
    })
  }

  return {
    get() {
      load()
      return state
    },
    getServer() {
      return initial
    },
    set(next: T | ((prev: T) => T)) {
      load()
      state = typeof next === "function" ? (next as (p: T) => T)(state) : next
      persist()
      emit()
    },
    /** Troca o estado pelo que veio do banco, sem passar pelo localStorage. */
    hydrate(next: T) {
      remote = true
      state = next
      emit()
    },
    subscribe(l: Listener) {
      listeners.add(l)
      return () => listeners.delete(l)
    },
  }
}

export const menuStore = createStore<MenuState>(KEY, seed)
export const cartStore = createStore<CartLine[]>(CART_KEY, [])

export function useMenu() {
  return useSyncExternalStore(menuStore.subscribe, menuStore.get, menuStore.getServer)
}

export function useCart() {
  return useSyncExternalStore(cartStore.subscribe, cartStore.get, cartStore.getServer)
}

export function resetDemo() {
  menuStore.set(seed)
  cartStore.set([])
}

/** UUID v4, que é o formato das chaves no banco. */
export function uid() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID()
  // randomUUID só existe em HTTPS/localhost; pelo IP da rede (teste no celular) monta na mão
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("")
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}
