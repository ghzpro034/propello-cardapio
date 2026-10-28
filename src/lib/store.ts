"use client"

import { useSyncExternalStore } from "react"
import { seed } from "./seed"
import type { CartLine, MenuState } from "./types"

/**
 * Sem back-end por enquanto: o cardápio fica no localStorage do navegador.
 * O painel e o cardápio público leem o mesmo estado, então uma mudança no
 * painel aparece no cardápio aberto em outra aba. Quando houver API, trocar
 * `load`/`persist` por chamadas ao servidor e manter a mesma interface.
 */
const KEY = "propello-cardapio:v1"
const CART_KEY = "propello-cardapio:sacola:v1"

type Listener = () => void

function createStore<T>(key: string, initial: T) {
  let state: T = initial
  let loaded = false
  const listeners = new Set<Listener>()

  function load() {
    if (loaded || typeof window === "undefined") return
    loaded = true
    try {
      const raw = window.localStorage.getItem(key)
      if (raw) state = JSON.parse(raw) as T
    } catch {
      /* armazenamento indisponível: segue com os dados iniciais */
    }
  }

  function persist() {
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
      if (e.key !== key) return
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

export function uid(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}
