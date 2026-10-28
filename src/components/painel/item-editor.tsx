"use client"

import { Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { centsToInput, money, parseMoney } from "@/lib/format"
import { deleteItem, saveItem } from "@/lib/menu-actions"
import { uid, useMenu } from "@/lib/store"
import type { Item } from "@/lib/types"
import { cn } from "@/lib/utils"

type Row = { id: string; name: string; price: string }

type Draft = {
  id: string
  isNew: boolean
  name: string
  description: string
  categoryId: string
  price: string
  sized: boolean
  variants: Row[]
  extras: Row[]
  serves: string
  photo: string
  available: boolean
}

function toDraft(item: Item | null, categoryId: string): Draft {
  if (!item) {
    return {
      id: uid("item"),
      isNew: true,
      name: "",
      description: "",
      categoryId,
      price: "",
      sized: false,
      variants: [
        { id: uid("v"), name: "Pequena", price: "" },
        { id: uid("v"), name: "Grande", price: "" },
      ],
      extras: [],
      serves: "",
      photo: "",
      available: true,
    }
  }
  return {
    id: item.id,
    isNew: false,
    name: item.name,
    description: item.description,
    categoryId: item.categoryId,
    price: centsToInput(item.price),
    sized: item.variants.length > 0,
    variants: item.variants.length
      ? item.variants.map((v) => ({ id: v.id, name: v.name, price: centsToInput(v.price) }))
      : [
          { id: uid("v"), name: "Pequena", price: "" },
          { id: uid("v"), name: "Grande", price: "" },
        ],
    extras: item.extras.map((e) => ({ id: e.id, name: e.name, price: centsToInput(e.price) })),
    serves: item.serves ?? "",
    photo: item.photo ?? "",
    available: item.available,
  }
}

export function ItemEditor({
  open,
  onOpenChange,
  item,
  defaultCategoryId,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  item: Item | null
  defaultCategoryId: string
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 bg-background p-0 sm:max-w-[520px]">
        {open ? (
          <EditorForm
            key={item?.id ?? "novo"}
            item={item}
            defaultCategoryId={defaultCategoryId}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function EditorForm({
  item,
  defaultCategoryId,
  onDone,
}: {
  item: Item | null
  defaultCategoryId: string
  onDone: () => void
}) {
  const menu = useMenu()
  const [d, setD] = useState<Draft>(() => toDraft(item, defaultCategoryId))
  const [tried, setTried] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }))

  const errors: Record<string, string> = {}
  if (!d.name.trim()) errors.name = "Dê um nome ao prato."
  if (!d.sized && parseMoney(d.price) === null) errors.price = "Preço em reais, como 18,00."
  if (d.sized) {
    if (d.variants.length < 2) errors.variants = "Com tamanhos, cadastre pelo menos dois."
    d.variants.forEach((v) => {
      if (!v.name.trim() || parseMoney(v.price) === null) errors.variants = "Cada tamanho precisa de nome e preço."
    })
  }
  d.extras.forEach((e) => {
    if (!e.name.trim() || parseMoney(e.price) === null) errors.extras = "Cada adicional precisa de nome e preço."
  })
  const err = (k: string) => (tried ? errors[k] : undefined)

  const previewPrice = d.sized
    ? Math.min(...d.variants.map((v) => parseMoney(v.price) ?? Infinity))
    : (parseMoney(d.price) ?? 0)

  function save() {
    setTried(true)
    if (Object.keys(errors).length) return
    saveItem({
      id: d.id,
      categoryId: d.categoryId,
      name: d.name.trim(),
      description: d.description.trim(),
      price: d.sized ? 0 : (parseMoney(d.price) ?? 0),
      variants: d.sized ? d.variants.map((v) => ({ id: v.id, name: v.name.trim(), price: parseMoney(v.price) ?? 0 })) : [],
      extras: d.extras.map((e) => ({ id: e.id, name: e.name.trim(), price: parseMoney(e.price) ?? 0 })),
      available: d.available,
      serves: d.serves.trim() || undefined,
      photo: d.photo.trim() || undefined,
    })
    toast(d.isNew ? `${d.name.trim()} adicionado ao cardápio` : "Alterações salvas")
    onDone()
  }

  return (
    <>
      <SheetHeader className="border-b border-linha px-6 pt-6 pb-4">
        <SheetTitle className="text-[22px] font-extrabold tracking-[-0.01em]">
          {d.isNew ? "Novo item" : "Editar item"}
        </SheetTitle>
        <SheetDescription className="text-sm text-suave">
          {d.isNew ? "Ele entra no cardápio assim que você salvar." : "As mudanças aparecem no cardápio na hora."}
        </SheetDescription>
      </SheetHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-6">
        <Field id="nome" label="Nome" error={err("name")}>
          <Input id="nome" value={d.name} onChange={(e) => set("name", e.target.value)} aria-invalid={!!err("name")} />
        </Field>

        <Field id="descricao" label="Descrição" hint="Ingredientes e acompanhamentos. Até 140 letras.">
          <Textarea
            id="descricao"
            value={d.description}
            maxLength={140}
            onChange={(e) => set("description", e.target.value)}
            className="min-h-20 border-[1.5px]"
            aria-describedby="descricao-dica"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field id="categoria" label="Categoria">
            <Select value={d.categoryId} onValueChange={(v) => set("categoryId", v)}>
              <SelectTrigger id="categoria" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {menu.categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field id="serve" label="Serve" optional hint="Ex.: Serve 2">
            <Input id="serve" value={d.serves} onChange={(e) => set("serves", e.target.value)} aria-describedby="serve-dica" />
          </Field>
        </div>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="tamanhos" className="text-[15px] font-bold">
              Tem tamanhos com preços diferentes?
            </Label>
            <Switch id="tamanhos" checked={d.sized} onCheckedChange={(c) => set("sized", c)} />
          </div>
          {d.sized ? (
            <RowsEditor
              rows={d.variants}
              onChange={(rows) => set("variants", rows)}
              namePlaceholder="Grande (750 g)"
              addLabel="Adicionar tamanho"
              error={err("variants")}
              minRows={2}
            />
          ) : (
            <Field id="preco" label="Preço" error={err("price")}>
              <MoneyInput id="preco" value={d.price} onChange={(v) => set("price", v)} invalid={!!err("price")} />
            </Field>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <p className="text-[15px] font-bold">Adicionais</p>
          {d.extras.length === 0 ? (
            <p className="text-sm text-suave">Coisas que o cliente pode somar ao prato, como ovo ou carne extra.</p>
          ) : null}
          <RowsEditor
            rows={d.extras}
            onChange={(rows) => set("extras", rows)}
            namePlaceholder="Ovo frito"
            addLabel="Adicionar adicional"
            error={err("extras")}
            minRows={0}
          />
        </section>

        <Field id="foto" label="Link da foto" optional hint="Cole o link de uma foto real do prato. Sem foto, o cardápio mostra só o texto.">
          <Input
            id="foto"
            type="url"
            inputMode="url"
            value={d.photo}
            onChange={(e) => set("photo", e.target.value)}
            aria-describedby="foto-dica"
            placeholder="https://"
          />
        </Field>

        <div className="flex items-center justify-between gap-3 rounded-md border border-linha bg-elevada px-4 py-3">
          <div>
            <Label htmlFor="avenda" className="text-[15px] font-bold">
              À venda
            </Label>
            <p className="text-[13px] text-suave">Desligado, aparece como esgotado.</p>
          </div>
          <Switch id="avenda" checked={d.available} onCheckedChange={(c) => set("available", c)} />
        </div>

        <section aria-label="Como aparece no cardápio" className="flex flex-col gap-2">
          <p className="text-[13px] font-semibold text-suave">Como aparece no cardápio</p>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 rounded-md border border-linha bg-background px-4 py-3">
            <div className="min-w-0">
              <p className={cn("text-[17px] leading-snug font-bold", !d.available && "text-suave")}>
                {d.name.trim() || "Nome do prato"}
              </p>
              {d.description.trim() ? (
                <p className="line-clamp-2 text-[14px] leading-snug text-suave">{d.description}</p>
              ) : null}
              {d.serves.trim() ? <p className="mt-1 text-[13px] text-suave">{d.serves}</p> : null}
            </div>
            <div className="flex flex-col items-end gap-1">
              {d.available ? (
                <>
                  {d.sized ? <span className="text-[12px] text-suave">a partir de</span> : null}
                  <span className="num text-[17px] font-bold">
                    {Number.isFinite(previewPrice) ? money(previewPrice) : "—"}
                  </span>
                </>
              ) : (
                <Badge variant="esgotado">Esgotado</Badge>
              )}
            </div>
          </div>
        </section>
      </div>

      <SheetFooter className="flex-row items-center justify-between gap-2 border-t border-linha bg-elevada px-6 py-4">
        {!d.isNew ? (
          <Button variant="ghost" className="text-negativo hover:text-negativo" onClick={() => setConfirmDelete(true)}>
            <Trash2 /> Excluir
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onDone}>
            Cancelar
          </Button>
          <Button onClick={save}>{d.isNew ? "Adicionar ao cardápio" : "Salvar"}</Button>
        </div>
      </SheetFooter>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="bg-elevada sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold">Excluir {item?.name}?</DialogTitle>
            <DialogDescription className="text-suave">
              O item sai do cardápio e não dá para desfazer. Se ele só acabou hoje, marque como esgotado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Manter</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                if (item) deleteItem(item.id)
                toast(`${item?.name} excluído`)
                setConfirmDelete(false)
                onDone()
              }}
            >
              Excluir {item?.name}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function Field({
  id,
  label,
  error,
  hint,
  optional,
  children,
}: {
  id: string
  label: string
  error?: string
  hint?: string
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
      {hint && !error ? (
        <p id={`${id}-dica`} className="text-[13px] text-suave">
          {hint}
        </p>
      ) : null}
      {error ? <p className="text-[13px] text-negativo">{error}</p> : null}
    </div>
  )
}

function MoneyInput({
  id,
  value,
  onChange,
  invalid,
  label,
}: {
  id?: string
  value: string
  onChange: (v: string) => void
  invalid?: boolean
  label?: string
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[15px] text-suave">R$</span>
      <Input
        id={id}
        aria-label={label}
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => {
          const c = parseMoney(value)
          if (c !== null) onChange(centsToInput(c))
        }}
        aria-invalid={invalid}
        placeholder="0,00"
        className="num pl-10 text-right"
      />
    </div>
  )
}

function RowsEditor({
  rows,
  onChange,
  namePlaceholder,
  addLabel,
  error,
  minRows,
}: {
  rows: Row[]
  onChange: (rows: Row[]) => void
  namePlaceholder: string
  addLabel: string
  error?: string
  minRows: number
}) {
  return (
    <div className="flex flex-col gap-2">
      {rows.map((r, i) => (
        <div key={r.id} className="grid grid-cols-[minmax(0,1fr)_120px_44px] gap-2">
          <Input
            aria-label={`Nome ${i + 1}`}
            value={r.name}
            placeholder={namePlaceholder}
            onChange={(e) => onChange(rows.map((x) => (x.id === r.id ? { ...x, name: e.target.value } : x)))}
          />
          <MoneyInput
            label={`Preço ${i + 1}`}
            value={r.price}
            onChange={(v) => onChange(rows.map((x) => (x.id === r.id ? { ...x, price: v } : x)))}
          />
          <Button
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label={`Remover ${r.name || `linha ${i + 1}`}`}
            disabled={rows.length <= minRows}
            onClick={() => onChange(rows.filter((x) => x.id !== r.id))}
          >
            <Trash2 />
          </Button>
        </div>
      ))}
      {error ? <p className="text-[13px] text-negativo">{error}</p> : null}
      <Button
        variant="outline"
        className="self-start"
        onClick={() => onChange([...rows, { id: uid("r"), name: "", price: "" }])}
      >
        <Plus /> {addLabel}
      </Button>
    </div>
  )
}
