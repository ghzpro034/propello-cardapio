"use client"

import { Check } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Canvas, PageHeader } from "@/components/painel/shell"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { accents } from "@/lib/accent"
import { paymentLabels } from "@/lib/cart"
import { centsToInput, formatPhone, money, parseMoney, slugify, weekdayNames, weekdayOrder } from "@/lib/format"
import { updateRestaurant } from "@/lib/menu-actions"
import { useMenu } from "@/lib/store"
import type { AccentName, PaymentMethod, Restaurant } from "@/lib/types"
import { cn } from "@/lib/utils"

function useSavedStamp(r: Restaurant) {
  const [stamp, setStamp] = useState<string | null>(null)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const t = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })
    setStamp(t)
  }, [r])
  return stamp
}

export function RestauranteScreen() {
  const { restaurant: r } = useMenu()
  const stamp = useSavedStamp(r)

  return (
    <Canvas>
      <PageHeader
        title="Restaurante"
        subline="O que aparece no topo do cardápio e as regras do pedido. Cada mudança salva sozinha."
        actions={
          <p className="flex h-10 items-center gap-1.5 text-[13px] text-suave" aria-live="polite">
            {stamp ? (
              <>
                <Check className="size-4 text-positivo" aria-hidden /> Salvo às {stamp}
              </>
            ) : null}
          </p>
        }
      />

      <div className="mt-8 flex flex-col">
        <SettingsSection title="Dados do restaurante" description="Nome, endereço e o WhatsApp que recebe os pedidos.">
          <Field id="nome" label="Nome do restaurante">
            <Input id="nome" value={r.name} onChange={(e) => updateRestaurant({ name: e.target.value })} />
          </Field>
          <Field id="frase" label="Frase de apresentação" hint="Aparece embaixo do nome. Diga o que vocês servem.">
            <Input
              id="frase"
              value={r.tagline}
              maxLength={80}
              onChange={(e) => updateRestaurant({ tagline: e.target.value })}
              aria-describedby="frase-dica"
            />
          </Field>
          <SlugField key={r.slug} slug={r.slug} />
          <PhoneField key={r.whatsapp} phone={r.whatsapp} />
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
            <Field id="endereco" label="Endereço">
              <Input id="endereco" value={r.address} onChange={(e) => updateRestaurant({ address: e.target.value })} />
            </Field>
            <Field id="bairro" label="Bairro">
              <Input id="bairro" value={r.neighborhood} onChange={(e) => updateRestaurant({ neighborhood: e.target.value })} />
            </Field>
          </div>
        </SettingsSection>

        <SettingsSection
          title="Entrega e retirada"
          description="Taxa única para toda a cidade por enquanto. O pedido mínimo vale para entrega e retirada."
        >
          <SwitchRow
            id="faz-entrega"
            label="Faz entrega"
            checked={r.acceptsDelivery}
            onChange={(v) => updateRestaurant({ acceptsDelivery: v })}
            disabled={r.acceptsDelivery && !r.acceptsPickup}
            hint={r.acceptsDelivery && !r.acceptsPickup ? "Ligue a retirada antes de desligar a entrega." : undefined}
          />
          {r.acceptsDelivery ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <MoneyField key={`taxa-${r.deliveryFee}`} id="taxa" label="Taxa de entrega" cents={r.deliveryFee} onCommit={(c) => updateRestaurant({ deliveryFee: c })} />
              <Field id="tempo" label="Tempo de entrega">
                <Input id="tempo" value={r.deliveryTime} onChange={(e) => updateRestaurant({ deliveryTime: e.target.value })} />
              </Field>
              <MoneyField key={`minimo-${r.minimumOrder}`} id="minimo" label="Pedido mínimo" cents={r.minimumOrder} onCommit={(c) => updateRestaurant({ minimumOrder: c })} />
            </div>
          ) : (
            <MoneyField key={`minimo-${r.minimumOrder}`} id="minimo" label="Pedido mínimo" cents={r.minimumOrder} onCommit={(c) => updateRestaurant({ minimumOrder: c })} />
          )}
          <SwitchRow
            id="retirada"
            label="Cliente pode retirar no local"
            checked={r.acceptsPickup}
            onChange={(v) => updateRestaurant({ acceptsPickup: v })}
            disabled={r.acceptsPickup && !r.acceptsDelivery}
            hint={r.acceptsPickup && !r.acceptsDelivery ? "Ligue a entrega antes de desligar a retirada." : undefined}
          />
        </SettingsSection>

        <SettingsSection
          id="horarios"
          title="Horários"
          description="Fora do horário o cardápio continua no ar para consulta, mas o botão de pedir fica desligado. Horário de Brasília."
        >
          <ul className="flex flex-col">
            {weekdayOrder.map((day) => {
              const h = r.hours[day]
              const setDay = (patch: Partial<typeof h>) =>
                updateRestaurant({ hours: { ...r.hours, [day]: { ...h, ...patch } } })
              return (
                <li
                  key={day}
                  className="grid grid-cols-1 items-center gap-2 border-b border-linha-fraca py-2.5 first:pt-0 last:border-b-0 last:pb-0 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-3"
                >
                  <label className="flex items-center gap-3">
                    <Switch checked={h.enabled} onCheckedChange={(v) => setDay({ enabled: v })} aria-label={`Abre ${weekdayNames[day]}`} />
                    <span className={cn("text-[15px] font-semibold", !h.enabled && "text-suave")}>{weekdayNames[day]}</span>
                  </label>
                  {h.enabled ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={h.open}
                        onChange={(e) => setDay({ open: e.target.value })}
                        aria-label={`${weekdayNames[day]}, abre às`}
                        className="num h-10 w-[108px]"
                      />
                      <span className="text-suave">às</span>
                      <Input
                        type="time"
                        value={h.close}
                        onChange={(e) => setDay({ close: e.target.value })}
                        aria-label={`${weekdayNames[day]}, fecha às`}
                        className="num h-10 w-[108px]"
                      />
                    </div>
                  ) : (
                    <span className="text-[15px] text-suave">Fechado</span>
                  )}
                </li>
              )
            })}
          </ul>
        </SettingsSection>

        <SettingsSection title="Pagamento" description="Formas que o cliente pode escolher ao fechar o pedido. O pagamento acontece na entrega ou no Pix, combinado pelo WhatsApp.">
          <div className="flex flex-col gap-1">
            {(Object.keys(paymentLabels) as PaymentMethod[]).map((p) => {
              const checked = r.payments.includes(p)
              const last = checked && r.payments.length === 1
              return (
                <label key={p} className="flex min-h-11 items-center gap-3 text-[15px]">
                  <Checkbox
                    checked={checked}
                    disabled={last}
                    onCheckedChange={(c) =>
                      updateRestaurant({
                        payments: c ? [...r.payments, p] : r.payments.filter((x) => x !== p),
                      })
                    }
                    className="size-5 border-[1.5px] border-controle data-[state=checked]:border-carvao data-[state=checked]:bg-carvao data-[state=checked]:text-creme"
                  />
                  {paymentLabels[p]}
                  {last ? <span className="text-[13px] text-suave">— precisa ter pelo menos uma</span> : null}
                </label>
              )
            })}
          </div>
        </SettingsSection>

        <SettingsSection title="Cor do cardápio" description="Vai no botão de pedir e na sacola. O resto do cardápio fica no creme da página.">
          <div role="radiogroup" aria-label="Cor do cardápio" className="flex flex-wrap gap-2">
            {(Object.keys(accents) as AccentName[]).map((name) => {
              const a = accents[name]
              const on = r.accent === name
              return (
                <button
                  key={name}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => updateRestaurant({ accent: name })}
                  className={cn(
                    "flex h-11 items-center gap-2 rounded-md border-[1.5px] pr-3.5 pl-2 text-[15px] font-semibold transition-colors",
                    on ? "border-carvao bg-ativo" : "border-linha hover:border-controle",
                  )}
                >
                  <span aria-hidden className="size-6 rounded-sm" style={{ background: a.bg }} />
                  {a.label}
                </button>
              )
            })}
          </div>
          <div className="rounded-md border border-linha bg-background p-4">
            <p className="mb-3 text-[13px] text-suave">Como fica o botão da sacola</p>
            <div
              className="flex h-12 items-center justify-between rounded-md px-5 text-base font-bold"
              style={{ background: accents[r.accent].bg, color: accents[r.accent].ink }}
            >
              <span>Ver sacola · 2 itens</span>
              <span className="num">{money(4100)}</span>
            </div>
          </div>
        </SettingsSection>
      </div>
    </Canvas>
  )
}

function SettingsSection({
  id,
  title,
  description,
  children,
}: {
  id?: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id ?? slugify(title)}-titulo`}
      className="grid scroll-mt-20 gap-4 border-b border-linha py-8 first:pt-0 last:border-b-0 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10"
    >
      <div>
        <h2 id={`${id ?? slugify(title)}-titulo`} className="text-[18px] font-extrabold">
          {title}
        </h2>
        <p className="mt-1 text-[14px] leading-relaxed text-suave">{description}</p>
      </div>
      <div className="flex max-w-[680px] flex-col gap-4 rounded-lg border border-linha bg-elevada p-5">{children}</div>
    </section>
  )
}

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-sm font-semibold">
        {label}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-erro`} className="text-[13px] text-negativo">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-dica`} className="text-[13px] text-suave">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

function SwitchRow({
  id,
  label,
  checked,
  onChange,
  disabled,
  hint,
}: {
  id: string
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  hint?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <Label htmlFor={id} className="text-[15px] font-semibold">
          {label}
        </Label>
        {hint ? <p className="text-[13px] text-suave">{hint}</p> : null}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  )
}

function MoneyField({ id, label, cents, onCommit }: { id: string; label: string; cents: number; onCommit: (c: number) => void }) {
  const [text, setText] = useState(centsToInput(cents))
  const [error, setError] = useState<string>()
  return (
    <Field id={id} label={label} error={error}>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[15px] text-suave">R$</span>
        <Input
          id={id}
          inputMode="decimal"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            if (error && parseMoney(e.target.value) !== null) setError(undefined)
          }}
          onBlur={() => {
            const c = parseMoney(text)
            if (c === null) return setError("Valor em reais, como 6,00.")
            setError(undefined)
            onCommit(c)
            setText(centsToInput(c))
          }}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-erro` : undefined}
          className="num pl-10 text-right"
        />
      </div>
    </Field>
  )
}

function SlugField({ slug }: { slug: string }) {
  const [text, setText] = useState(slug)
  const changed = text !== slug
  return (
    <Field
      id="slug"
      label="Endereço do cardápio"
      hint={changed ? "Ao trocar, QR codes já impressos param de funcionar." : "É o final do link que vai no QR code e na bio."}
    >
      <div className="flex">
        <span className="flex h-11 items-center rounded-l-md border-[1.5px] border-r-0 border-input bg-ativo px-3 text-[15px] text-suave">
          /r/
        </span>
        <Input
          id="slug"
          value={text}
          onChange={(e) => setText(slugify(e.target.value) || e.target.value.toLowerCase())}
          onBlur={() => {
            const s = slugify(text)
            if (s) updateRestaurant({ slug: s })
            else setText(slug)
          }}
          aria-describedby="slug-dica"
          className="rounded-l-none"
        />
      </div>
    </Field>
  )
}

function PhoneField({ phone }: { phone: string }) {
  const [text, setText] = useState(formatPhone(phone))
  const [error, setError] = useState<string>()
  return (
    <Field id="whatsapp" label="WhatsApp que recebe os pedidos" hint="Com DDD. É para esse número que a mensagem do pedido vai." error={error}>
      <Input
        id="whatsapp"
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          const d = text.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "")
          if (d.length < 10 || d.length > 11) return setError("Número com DDD, como (34) 99999-0000.")
          setError(undefined)
          updateRestaurant({ whatsapp: d })
          setText(formatPhone(d))
        }}
        aria-invalid={!!error}
        aria-describedby={error ? "whatsapp-erro" : "whatsapp-dica"}
      />
    </Field>
  )
}
