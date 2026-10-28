/**
 * QuantityStepper — 21st.dev (@arihantcodes/quantity-stepper, Spectrum UI),
 * adaptado à marca: cantos 4px em vez de pílula, contorno em vez de sombra,
 * botões de 44px para o polegar e textos em português.
 *
 * Os dígitos rolam na direção da mudança, segurar o botão repete com
 * aceleração e passar do limite dá uma leve tremida. Respeita
 * prefers-reduced-motion e funciona pelo teclado (spinbutton ARIA).
 */
"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from "framer-motion"
import { Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

export interface QuantityStepperProps {
  value?: number
  defaultValue?: number
  onValueChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
  size?: "sm" | "md" | "lg"
  disabled?: boolean
  className?: string
  label?: string
}

const HOLD_DELAY = 400
const HOLD_INTERVAL = 80
const HOLD_FAST_INTERVAL = 40
const HOLD_FAST_AFTER = 10
const FLASH_DURATION = 400

const SPRING_SNAPPY = { type: "spring", stiffness: 500, damping: 30 } as const
const ROLL_SPRING = { type: "spring", stiffness: 400, damping: 30 } as const
const ROLL_REPEAT_TRANSITION = { duration: 0.1, ease: "easeOut" } as const
const SHAKE_KEYFRAMES = [0, -4, 4, -2, 2, 0]
const SHAKE_DURATION = 0.3

const SIZES = {
  sm: { container: "h-9 gap-0.5 p-0.5", button: "h-8 w-8", icon: 14, value: "h-8 min-w-7 text-sm" },
  md: { container: "h-11 gap-0.5 p-0.5", button: "h-10 w-10", icon: 16, value: "h-10 min-w-8 text-base" },
  lg: { container: "h-12 gap-1 p-0.5", button: "h-11 w-11", icon: 18, value: "h-11 min-w-10 text-lg" },
} as const

const valueVariants = {
  enter: (direction: number) => ({ y: direction * 12, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (direction: number) => ({ y: direction * -12, opacity: 0 }),
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function QuantityStepper({
  value: valueProp,
  defaultValue = 1,
  onValueChange,
  min = 0,
  max = 99,
  step = 1,
  size = "md",
  disabled = false,
  className,
  label = "Quantidade",
}: QuantityStepperProps) {
  const shouldReduceMotion = useReducedMotion()
  const [internalValue, setInternalValue] = useState(() => clamp(defaultValue, min, max))
  const [direction, setDirection] = useState(1)
  const [flash, setFlash] = useState(0)
  const [repeating, setRepeating] = useState(false)
  const [announcement, setAnnouncement] = useState("")
  const shakeControls = useAnimationControls()

  const current = clamp(valueProp ?? internalValue, min, max)
  const atMin = current <= min
  const atMax = current >= max
  const { container, button, icon, value: valueClasses } = SIZES[size]

  const valueRef = useRef(current)
  useEffect(() => {
    valueRef.current = current
  }, [current])

  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const repeatRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const repeatCountRef = useRef(0)

  const stopRepeat = useCallback(() => {
    if (delayRef.current !== null) {
      clearTimeout(delayRef.current)
      delayRef.current = null
    }
    if (repeatRef.current !== null) {
      clearInterval(repeatRef.current)
      repeatRef.current = null
    }
    repeatCountRef.current = 0
    setRepeating(false)
  }, [])

  useEffect(() => stopRepeat, [stopRepeat])

  useEffect(() => {
    if (flash === 0) return
    if (!shouldReduceMotion) {
      shakeControls.set({ x: 0 })
      void shakeControls.start({ x: SHAKE_KEYFRAMES, transition: { duration: SHAKE_DURATION, ease: "easeInOut" } })
    }
    const id = setTimeout(() => setFlash(0), FLASH_DURATION)
    return () => clearTimeout(id)
  }, [flash, shouldReduceMotion, shakeControls])

  const stepBy = useCallback(
    (delta: number) => {
      const next = clamp(valueRef.current + delta, min, max)
      if (next === valueRef.current) {
        setFlash((c) => c + 1)
        setAnnouncement(delta < 0 ? `Quantidade mínima é ${min}` : `Quantidade máxima é ${max}`)
        return false
      }
      valueRef.current = next
      setDirection(delta > 0 ? 1 : -1)
      if (valueProp === undefined) setInternalValue(next)
      onValueChange?.(next)
      setAnnouncement(`Quantidade ${next}`)
      return true
    },
    [min, max, valueProp, onValueChange],
  )

  const startHold = useCallback(
    (delta: number) => (event: React.PointerEvent<HTMLButtonElement>) => {
      if (disabled) return
      if (event.pointerType === "mouse" && event.button !== 0) return
      stopRepeat()
      if (!stepBy(delta)) return
      delayRef.current = setTimeout(() => {
        setRepeating(true)
        const tick = () => {
          if (!stepBy(delta)) {
            stopRepeat()
            return
          }
          repeatCountRef.current += 1
          if (repeatCountRef.current === HOLD_FAST_AFTER) {
            if (repeatRef.current !== null) clearInterval(repeatRef.current)
            repeatRef.current = setInterval(tick, HOLD_FAST_INTERVAL)
          }
        }
        repeatRef.current = setInterval(tick, HOLD_INTERVAL)
      }, HOLD_DELAY)
    },
    [disabled, stepBy, stopRepeat],
  )

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLSpanElement>) => {
      if (disabled) return
      let next: number
      switch (event.key) {
        case "ArrowUp":
        case "ArrowRight":
          next = current + step
          break
        case "ArrowDown":
        case "ArrowLeft":
          next = current - step
          break
        case "Home":
          next = min
          break
        case "End":
          next = max
          break
        default:
          return
      }
      event.preventDefault()
      const clamped = clamp(next, min, max)
      if (clamped === current) {
        if (event.key !== "Home" && event.key !== "End") {
          setFlash((c) => c + 1)
          setAnnouncement(next < current ? `Quantidade mínima é ${min}` : `Quantidade máxima é ${max}`)
        }
        return
      }
      valueRef.current = clamped
      setDirection(clamped > current ? 1 : -1)
      if (valueProp === undefined) setInternalValue(clamped)
      onValueChange?.(clamped)
    },
    [disabled, current, step, min, max, valueProp, onValueChange],
  )

  const buttonClasses = cn(
    "flex shrink-0 touch-manipulation items-center justify-center rounded-[3px] text-foreground transition-colors",
    "hover:bg-ativo focus-visible:outline-2 focus-visible:outline-carvao",
    button,
  )

  const pressSquish = shouldReduceMotion || disabled ? undefined : { scale: 0.88 }
  const rollTransition = shouldReduceMotion
    ? { duration: 0 }
    : flash > 0
      ? { duration: 0 }
      : repeating
        ? ROLL_REPEAT_TRANSITION
        : ROLL_SPRING

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex select-none items-center rounded-md border-[1.5px] border-input bg-elevada",
        disabled && "pointer-events-none opacity-50",
        container,
        className,
      )}
    >
      <motion.button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        aria-label="Diminuir quantidade"
        onPointerDown={startHold(-step)}
        onPointerUp={stopRepeat}
        onPointerLeave={stopRepeat}
        onPointerCancel={stopRepeat}
        whileTap={pressSquish}
        transition={shouldReduceMotion ? { duration: 0 } : SPRING_SNAPPY}
        className={cn(buttonClasses, atMin && "opacity-40")}
      >
        <Minus size={icon} aria-hidden="true" />
      </motion.button>

      <motion.span
        role="spinbutton"
        aria-valuenow={current}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-label={label}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
        animate={shakeControls}
        className={cn(
          "num flex items-center justify-center overflow-hidden px-1 font-bold transition-colors",
          "focus-visible:outline-2 focus-visible:outline-carvao",
          flash > 0 ? "text-negativo" : "text-foreground",
          valueClasses,
        )}
      >
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.span
            key={current}
            className="inline-block"
            custom={direction}
            variants={valueVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={rollTransition}
          >
            {current}
          </motion.span>
        </AnimatePresence>
      </motion.span>

      <motion.button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        aria-label="Aumentar quantidade"
        onPointerDown={startHold(step)}
        onPointerUp={stopRepeat}
        onPointerLeave={stopRepeat}
        onPointerCancel={stopRepeat}
        whileTap={pressSquish}
        transition={shouldReduceMotion ? { duration: 0 } : SPRING_SNAPPY}
        className={cn(buttonClasses, atMax && "opacity-40")}
      >
        <Plus size={icon} aria-hidden="true" />
      </motion.button>

      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
    </div>
  )
}

export default QuantityStepper
