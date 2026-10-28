"use client"

import { useState } from "react"
import { toast } from "sonner"
import { ResponsiveModal } from "@/components/responsive-modal"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { QuantityStepper } from "@/components/ui/quantity-stepper"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { addToCart, linePrice } from "@/lib/cart"
import { money } from "@/lib/format"
import type { Item } from "@/lib/types"

export function ItemModal({
  item,
  open,
  onOpenChange,
  canOrder,
  style,
}: {
  item: Item | null
  open: boolean
  onOpenChange: (open: boolean) => void
  canOrder: boolean
  style?: React.CSSProperties
}) {
  if (!item) return null
  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={item.name}
      description={item.description || undefined}
      style={style}
      footer={null}
    >
      {/* key: zera as escolhas ao trocar de prato */}
      <ItemForm key={item.id} item={item} canOrder={canOrder} onDone={() => onOpenChange(false)} />
    </ResponsiveModal>
  )
}

function ItemForm({ item, canOrder, onDone }: { item: Item; canOrder: boolean; onDone: () => void }) {
  const [variantId, setVariantId] = useState<string | undefined>(item.variants[0]?.id)
  const [extraIds, setExtraIds] = useState<string[]>([])
  const [note, setNote] = useState("")
  const [qty, setQty] = useState(1)
  const total = linePrice(item, { variantId, extraIds, qty })

  function add() {
    addToCart({ itemId: item.id, variantId, extraIds, note, qty })
    toast(`${qty}x ${item.name} na sacola`)
    onDone()
  }

  return (
    <div className="flex flex-col gap-6">
      {item.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.photo} alt={item.name} className="aspect-[4/3] w-full rounded-lg object-cover" />
      ) : null}

      {item.variants.length > 0 ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 flex w-full items-baseline justify-between text-[15px] font-bold">
            Tamanho <span className="text-xs font-semibold text-suave">Obrigatório</span>
          </legend>
          <RadioGroup value={variantId} onValueChange={setVariantId} className="gap-0">
            {item.variants.map((v) => (
              <Label
                key={v.id}
                htmlFor={`v-${v.id}`}
                className="flex min-h-12 cursor-pointer items-center gap-3 border-b border-linha-fraca py-2 text-[15px] font-normal last:border-b-0"
              >
                <RadioGroupItem
                  id={`v-${v.id}`}
                  value={v.id}
                  className="size-5 border-[1.5px] border-controle data-[state=checked]:border-marca [&_svg]:fill-marca"
                />
                <span className="flex-1">{v.name}</span>
                <span className="num font-semibold">{money(v.price)}</span>
              </Label>
            ))}
          </RadioGroup>
        </fieldset>
      ) : null}

      {item.extras.length > 0 ? (
        <fieldset className="flex flex-col">
          <legend className="mb-2 flex w-full items-baseline justify-between text-[15px] font-bold">
            Adicionais <span className="text-xs font-semibold text-suave">Opcional</span>
          </legend>
          {item.extras.map((e) => {
            const checked = extraIds.includes(e.id)
            return (
              <Label
                key={e.id}
                htmlFor={`e-${e.id}`}
                className="flex min-h-12 cursor-pointer items-center gap-3 border-b border-linha-fraca py-2 text-[15px] font-normal last:border-b-0"
              >
                <Checkbox
                  id={`e-${e.id}`}
                  checked={checked}
                  onCheckedChange={(c) =>
                    setExtraIds((prev) => (c ? [...prev, e.id] : prev.filter((x) => x !== e.id)))
                  }
                  className="size-5 border-[1.5px] border-controle data-[state=checked]:border-marca data-[state=checked]:bg-marca data-[state=checked]:text-sobre-marca"
                />
                <span className="flex-1">{e.name}</span>
                <span className="num text-suave">+ {money(e.price)}</span>
              </Label>
            )
          })}
        </fieldset>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="obs" className="text-[15px] font-bold">
          Alguma observação?
        </Label>
        <Textarea
          id="obs"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={140}
          placeholder="Ex.: sem cebola, carne bem passada"
          className="min-h-20 border-[1.5px] bg-background text-base"
        />
      </div>

      <div className="flex items-center gap-3 pt-1">
        <QuantityStepper value={qty} onValueChange={setQty} min={1} max={30} />
        <Button variant="marca" size="lg" className="flex-1 justify-between" disabled={!canOrder} onClick={add}>
          <span>{canOrder ? "Adicionar" : "Fechado agora"}</span>
          <span className="num">{money(total)}</span>
        </Button>
      </div>
    </div>
  )
}
