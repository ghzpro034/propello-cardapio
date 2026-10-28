"use client"

import { ArrowLeft, Check } from "lucide-react"
import { useState } from "react"
import { ResponsiveModal } from "@/components/responsive-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CartLines, CartTotals } from "@/components/menu/cart-lines"
import { clearCart, orderMessage, paymentLabels, whatsappLink, type Checkout, type ResolvedLine } from "@/lib/cart"
import { money } from "@/lib/format"
import type { MenuState, PaymentMethod } from "@/lib/types"
import { cn } from "@/lib/utils"

type Step = "sacola" | "dados" | "enviado"

const empty: Checkout = {
  name: "",
  mode: "entrega",
  street: "",
  number: "",
  neighborhood: "",
  reference: "",
  payment: "pix",
  changeFor: "",
  note: "",
}

export function CheckoutModal({
  open,
  onOpenChange,
  menu,
  lines,
  subtotal,
  canOrder,
  startAt = "sacola",
  style,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  menu: MenuState
  lines: ResolvedLine[]
  subtotal: number
  canOrder: boolean
  startAt?: Step
  style?: React.CSSProperties
}) {
  const r = menu.restaurant
  const [step, setStep] = useState<Step>(startAt)
  const [form, setForm] = useState<Checkout>(() => ({
    ...empty,
    mode: r.acceptsDelivery ? "entrega" : "retirada",
    payment: r.payments[0] ?? "pix",
  }))
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [tried, setTried] = useState(false)

  const delivery = form.mode === "entrega"
  const belowMinimum = subtotal < r.minimumOrder
  const errors: Partial<Record<keyof Checkout, string>> = {}
  if (!form.name.trim()) errors.name = "Diga seu nome para o restaurante saber de quem é o pedido."
  if (delivery && !form.street.trim()) errors.street = "Falta a rua."
  if (delivery && !form.number.trim()) errors.number = "Falta o número."
  if (delivery && !form.neighborhood.trim()) errors.neighborhood = "Falta o bairro."
  const show = (k: keyof Checkout) => (tried || touched[k] ? errors[k] : undefined)

  function set<K extends keyof Checkout>(k: K, v: Checkout[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  function handleOpenChange(o: boolean) {
    onOpenChange(o)
    if (!o) setTimeout(() => setStep(startAt), 250)
  }

  function send() {
    setTried(true)
    if (Object.keys(errors).length > 0) return
    const text = orderMessage(menu, lines, subtotal, form)
    window.open(whatsappLink(r.whatsapp, text), "_blank", "noopener,noreferrer")
    setStep("enviado")
  }

  const titles: Record<Step, string> = {
    sacola: "Sua sacola",
    dados: "Entrega e pagamento",
    enviado: "Pedido aberto no WhatsApp",
  }

  const footer =
    step === "sacola" ? (
      <div className="flex flex-col gap-3">
        <CartTotals subtotal={subtotal} restaurant={r} delivery={delivery} />
        <Button
          variant="marca"
          size="lg"
          disabled={!canOrder || belowMinimum || lines.length === 0}
          onClick={() => setStep("dados")}
        >
          {canOrder ? "Continuar" : "Fechado agora"}
        </Button>
      </div>
    ) : step === "dados" ? (
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <span className="font-bold">Total</span>
          <span className="num text-xl font-extrabold">{money(subtotal + (delivery ? r.deliveryFee : 0))}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="lg" onClick={() => setStep("sacola")} aria-label="Voltar para a sacola">
            <ArrowLeft />
          </Button>
          <Button variant="marca" size="lg" className="flex-1" onClick={send} disabled={!canOrder}>
            Enviar pedido pelo WhatsApp
          </Button>
        </div>
      </div>
    ) : (
      <div className="flex flex-col gap-2">
        <Button
          variant="marca"
          size="lg"
          onClick={() => {
            clearCart()
            handleOpenChange(false)
          }}
        >
          Já enviei, esvaziar a sacola
        </Button>
        <Button variant="ghost" onClick={() => setStep("dados")}>
          Voltar e corrigir
        </Button>
      </div>
    )

  return (
    <ResponsiveModal open={open} onOpenChange={handleOpenChange} title={titles[step]} style={style} footer={footer}>
      {step === "sacola" ? (
        lines.length ? (
          <CartLines lines={lines} />
        ) : (
          <p className="py-6 text-[15px] text-suave">Sua sacola está vazia. Escolha um prato no cardápio.</p>
        )
      ) : step === "dados" ? (
        <div className="flex flex-col gap-5">
          {r.acceptsDelivery && r.acceptsPickup ? (
            <div role="radiogroup" aria-label="Como você quer receber" className="grid grid-cols-2 gap-2">
              {(["entrega", "retirada"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={form.mode === m}
                  onClick={() => set("mode", m)}
                  className={cn(
                    "flex min-h-14 flex-col items-start justify-center rounded-md border-[1.5px] px-3 py-2 text-left transition-colors",
                    form.mode === m ? "border-carvao bg-ativo" : "border-controle hover:bg-ativo/60",
                  )}
                >
                  <span className="text-[15px] font-bold">{m === "entrega" ? "Entrega" : "Retirar no local"}</span>
                  <span className="num text-[13px] text-suave">
                    {m === "entrega" ? `${money(r.deliveryFee)} · ${r.deliveryTime}` : `${r.address}`}
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          <Field id="nome" label="Seu nome" error={show("name")}>
            <Input
              id="nome"
              autoComplete="name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              aria-invalid={!!show("name")}
              aria-describedby={show("name") ? "nome-erro" : undefined}
            />
          </Field>

          {delivery ? (
            <>
              <div className="grid grid-cols-[1fr_96px] gap-3">
                <Field id="rua" label="Rua" error={show("street")}>
                  <Input
                    id="rua"
                    autoComplete="address-line1"
                    value={form.street}
                    onChange={(e) => set("street", e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, street: true }))}
                    aria-invalid={!!show("street")}
                    aria-describedby={show("street") ? "rua-erro" : undefined}
                  />
                </Field>
                <Field id="numero" label="Número" error={show("number")}>
                  <Input
                    id="numero"
                    inputMode="numeric"
                    value={form.number}
                    onChange={(e) => set("number", e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, number: true }))}
                    aria-invalid={!!show("number")}
                    aria-describedby={show("number") ? "numero-erro" : undefined}
                  />
                </Field>
              </div>
              <Field id="bairro" label="Bairro" error={show("neighborhood")}>
                <Input
                  id="bairro"
                  value={form.neighborhood}
                  onChange={(e) => set("neighborhood", e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, neighborhood: true }))}
                  aria-invalid={!!show("neighborhood")}
                  aria-describedby={show("neighborhood") ? "bairro-erro" : undefined}
                />
              </Field>
              <Field id="referencia" label="Complemento ou ponto de referência" optional>
                <Input id="referencia" value={form.reference} onChange={(e) => set("reference", e.target.value)} />
              </Field>
            </>
          ) : null}

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-[15px] font-bold">Pagamento</legend>
            <div role="radiogroup" aria-label="Forma de pagamento" className="flex flex-wrap gap-2">
              {r.payments.map((p: PaymentMethod) => (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={form.payment === p}
                  onClick={() => set("payment", p)}
                  className={cn(
                    "min-h-11 rounded-md border-[1.5px] px-3.5 text-[15px] font-semibold transition-colors",
                    form.payment === p ? "border-carvao bg-ativo" : "border-controle hover:bg-ativo/60",
                  )}
                >
                  {paymentLabels[p]}
                </button>
              ))}
            </div>
            {form.payment === "dinheiro" ? (
              <div className="mt-2">
                <Field id="troco" label="Troco para quanto?" optional>
                  <Input
                    id="troco"
                    inputMode="decimal"
                    value={form.changeFor}
                    onChange={(e) => set("changeFor", e.target.value)}
                    placeholder="R$ 100,00"
                  />
                </Field>
              </div>
            ) : null}
          </fieldset>

          <Field id="obs-pedido" label="Observação para o restaurante" optional>
            <Textarea
              id="obs-pedido"
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              maxLength={200}
              className="min-h-16 border-[1.5px] bg-background text-base"
            />
          </Field>
        </div>
      ) : (
        <div className="flex flex-col gap-3 py-2 text-[15px]">
          <span className="flex size-10 items-center justify-center rounded-md bg-marca text-sobre-marca">
            <Check className="size-5" aria-hidden />
          </span>
          <p>
            A mensagem do pedido abriu no WhatsApp do <strong>{r.name}</strong>. Toque em enviar por lá para o
            restaurante receber.
          </p>
          <p className="text-suave">Se o WhatsApp não abriu, volte e toque em enviar de novo.</p>
        </div>
      )}
    </ResponsiveModal>
  )
}

function Field({
  id,
  label,
  error,
  optional,
  children,
}: {
  id: string
  label: string
  error?: string
  optional?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-sm font-semibold">
        {label}
        {optional ? <span className="font-normal text-suave">(opcional)</span> : null}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-erro`} className="text-[13px] text-negativo">
          {error}
        </p>
      ) : null}
    </div>
  )
}
