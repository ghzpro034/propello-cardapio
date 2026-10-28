"use client"

import { ArrowDown, ArrowUp, Copy, ExternalLink, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Canvas, PageHeader, useOpenStatus } from "@/components/painel/shell"
import { ItemEditor } from "@/components/painel/item-editor"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { counts, itemFromPrice, money, plural, statusLine } from "@/lib/format"
import {
  addCategory,
  deleteCategory,
  duplicateItem,
  moveCategory,
  moveItem,
  renameCategory,
  setAvailable,
  updateRestaurant,
} from "@/lib/menu-actions"
import { useMenu } from "@/lib/store"
import type { Category, Item } from "@/lib/types"
import { cn } from "@/lib/utils"

function normalize(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
}

export function CardapioScreen() {
  const menu = useMenu()
  const r = menu.restaurant
  const status = useOpenStatus()
  const c = counts(menu)
  const soldOut = menu.items.filter((i) => !i.available)

  const [filter, setFilter] = useState<string>("todos")
  const [query, setQuery] = useState("")
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<Item | null>(null)
  const [catDialog, setCatDialog] = useState<{ mode: "nova" | "renomear" | "excluir"; cat?: Category } | null>(null)

  const groups = useMemo(() => {
    const q = normalize(query.trim())
    const cats =
      filter === "todos"
        ? menu.categories
        : filter === "esgotados"
          ? menu.categories
          : menu.categories.filter((cat) => cat.id === filter)
    return cats
      .map((cat) => ({
        cat,
        items: menu.items.filter(
          (i) =>
            i.categoryId === cat.id &&
            (filter !== "esgotados" || !i.available) &&
            (!q || normalize(`${i.name} ${i.description}`).includes(q)),
        ),
      }))
      .filter((g) => filter !== "esgotados" || g.items.length > 0)
  }, [menu, filter, query])

  const shown = groups.reduce((s, g) => s + g.items.length, 0)
  const defaultCat = filter !== "todos" && filter !== "esgotados" ? filter : (menu.categories[0]?.id ?? "")

  function newItem() {
    setEditing(null)
    setEditorOpen(true)
  }
  function edit(item: Item) {
    setEditing(item)
    setEditorOpen(true)
  }

  return (
    <Canvas>
      <PageHeader
        title="Cardápio"
        subline={
          <>
            {plural(c.total, "item", "itens")} em {plural(c.categories, "categoria", "categorias")}
            {c.soldOut ? (
              <>
                {" · "}
                <span className="font-semibold text-negativo">
                  {plural(c.soldOut, "esgotado", "esgotados")}: {soldOut.map((i) => i.name).join(", ")}
                </span>
              </>
            ) : (
              " · tudo à venda"
            )}
          </>
        }
        actions={
          <>
            <Button variant="outline" asChild>
              <a href={`/r/${r.slug}`} target="_blank" rel="noreferrer">
                <ExternalLink /> Ver cardápio
              </a>
            </Button>
            <Button onClick={newItem}>
              <Plus /> Adicionar item
            </Button>
          </>
        }
      />

      {/* Recebendo pedidos agora? */}
      <section
        aria-label="Pedidos"
        className="mt-6 flex flex-col gap-3 rounded-lg border border-linha bg-elevada px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5"
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className={cn(
              "size-2.5 shrink-0 rounded-[2px]",
              !status ? "bg-ativo" : status.open ? "bg-positivo" : r.paused ? "bg-laranja" : "bg-controle",
            )}
          />
          <div>
            <p className="text-[15px] font-bold">{status ? statusLine(status) : "Conferindo horário…"}</p>
            <p className="text-[13px] text-suave">
              {r.paused
                ? "O cardápio continua aberto para consulta, mas ninguém consegue fechar pedido."
                : "Pausar segura os pedidos sem tirar o cardápio do ar, para quando a cozinha apertar."}{" "}
              <Link href="/painel/restaurante#horarios" className="font-semibold text-foreground underline underline-offset-2">
                Horários
              </Link>
            </p>
          </div>
        </div>
        <label className="flex items-center gap-3 self-start sm:self-auto">
          <span className="text-[15px] font-semibold">Receber pedidos</span>
          <Switch
            checked={!r.paused}
            onCheckedChange={(on) => {
              updateRestaurant({ paused: !on })
              toast(on ? "Pedidos liberados" : "Pedidos pausados")
            }}
          />
        </label>
      </section>

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
        {/* Categorias */}
        <nav aria-label="Filtrar por categoria" className="flex min-w-0 flex-col">
          <div className="sem-barra -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:px-0">
            <FilterButton active={filter === "todos"} onClick={() => setFilter("todos")} label="Todos os itens" count={c.total} className="lg:pr-10" />
            <FilterButton
              active={filter === "esgotados"}
              onClick={() => setFilter("esgotados")}
              label="Esgotados"
              count={c.soldOut}
              alert={c.soldOut > 0}
              className="lg:pr-10"
            />
            <p className="hidden px-2.5 pt-4 pb-1 text-[13px] text-suave lg:block">Categorias</p>
            {menu.categories.map((cat, idx) => (
              <div key={cat.id} className="group relative flex shrink-0 items-center">
                <FilterButton
                  active={filter === cat.id}
                  onClick={() => setFilter(cat.id)}
                  label={cat.name}
                  count={menu.items.filter((i) => i.categoryId === cat.id).length}
                  className="lg:pr-10"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label={`Opções de ${cat.name}`}
                      className="flex size-8 shrink-0 items-center justify-center rounded-sm text-suave hover:bg-background hover:text-foreground lg:absolute lg:right-1 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100 lg:data-[state=open]:opacity-100"
                    >
                      <MoreHorizontal className="size-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-elevada">
                    <DropdownMenuItem onSelect={() => setCatDialog({ mode: "renomear", cat })}>
                      <Pencil /> Renomear
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={idx === 0} onSelect={() => moveCategory(cat.id, -1)}>
                      <ArrowUp /> Subir
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={idx === menu.categories.length - 1}
                      onSelect={() => moveCategory(cat.id, 1)}
                    >
                      <ArrowDown /> Descer
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onSelect={() => setCatDialog({ mode: "excluir", cat })}>
                      <Trash2 /> Excluir categoria
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setCatDialog({ mode: "nova" })}
              className="flex h-10 shrink-0 items-center gap-2 rounded-md px-2.5 text-[15px] font-semibold whitespace-nowrap text-foreground hover:bg-ativo/60"
            >
              <Plus className="size-4" aria-hidden /> Nova categoria
            </button>
          </div>
        </nav>

        {/* Itens */}
        <div className="min-w-0">
          <div className="mb-4 flex items-center gap-3">
            <label className="relative w-full sm:max-w-xs">
              <span className="sr-only">Buscar item</span>
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-suave" aria-hidden />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar item" className="pl-9" />
            </label>
            <p className="hidden text-[13px] text-suave sm:block">{plural(shown, "item", "itens")}</p>
          </div>

          <div className="overflow-hidden rounded-lg border border-linha bg-elevada">
            <div className="hidden grid-cols-[minmax(0,1fr)_120px_92px_88px] gap-4 border-b border-linha px-5 py-2.5 text-[13px] text-suave md:grid">
              <span>Item</span>
              <span className="text-right">Preço</span>
              <span className="text-center">À venda</span>
              <span className="sr-only">Ações</span>
            </div>

            {shown === 0 ? (
              <EmptyState filter={filter} query={query} onClear={() => setQuery("")} onNew={newItem} />
            ) : (
              groups.map((g) =>
                g.items.length === 0 && filter === "todos" && query ? null : (
                  <div key={g.cat.id}>
                    {filter === "todos" || filter === "esgotados" ? (
                      <div className="flex items-baseline justify-between border-b border-linha bg-background px-5 pt-4 pb-2">
                        <h2 className="text-[15px] font-extrabold">{g.cat.name}</h2>
                        <span className="text-[13px] text-suave">{plural(g.items.length, "item", "itens")}</span>
                      </div>
                    ) : null}
                    {g.items.length === 0 ? (
                      <div className="flex items-center justify-between gap-3 border-b border-linha-fraca px-5 py-4 last:border-b-0">
                        <p className="text-[15px] text-suave">Nenhum item em {g.cat.name} ainda.</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFilter(g.cat.id)
                            newItem()
                          }}
                        >
                          <Plus /> Adicionar
                        </Button>
                      </div>
                    ) : (
                      <ul>
                        {g.items.map((item, idx) => (
                          <ItemRow
                            key={item.id}
                            item={item}
                            first={idx === 0}
                            last={idx === g.items.length - 1}
                            onEdit={() => edit(item)}
                          />
                        ))}
                      </ul>
                    )}
                  </div>
                ),
              )
            )}
          </div>
        </div>
      </div>

      <ItemEditor open={editorOpen} onOpenChange={setEditorOpen} item={editing} defaultCategoryId={defaultCat} />
      <CategoryDialog
        state={catDialog}
        onClose={() => setCatDialog(null)}
        itemsIn={(id) => menu.items.filter((i) => i.categoryId === id).length}
        onCreated={(id) => setFilter(id)}
        onDeleted={() => setFilter("todos")}
      />
    </Canvas>
  )
}

function FilterButton({
  active,
  onClick,
  label,
  count,
  alert,
  className,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
  alert?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex h-10 shrink-0 items-center justify-between gap-3 rounded-md px-2.5 lg:w-full text-[15px] whitespace-nowrap transition-colors",
        active ? "bg-ativo font-semibold text-foreground" : "text-suave hover:bg-ativo/60 hover:text-foreground",
        className,
      )}
    >
      <span className="truncate">{label}</span>
      <span className={cn("num text-[13px]", alert ? "font-semibold text-negativo" : "text-suave")}>{count}</span>
    </button>
  )
}

function ItemRow({ item, first, last, onEdit }: { item: Item; first: boolean; last: boolean; onEdit: () => void }) {
  const from = item.variants.length > 1
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-b border-linha-fraca px-5 py-3.5 last:border-b-0 md:grid-cols-[minmax(0,1fr)_120px_92px_88px]">
      <button type="button" onClick={onEdit} className="min-w-0 text-left">
        <span className={cn("flex items-center gap-2 text-[15px] leading-snug font-bold", !item.available && "text-suave")}>
          <span className="truncate">{item.name}</span>
          {!item.available ? <Badge variant="esgotado">Esgotado</Badge> : null}
        </span>
        <span className="mt-0.5 block truncate text-[13px] text-suave">
          {[
            item.description,
            item.variants.length ? plural(item.variants.length, "tamanho", "tamanhos") : null,
            item.extras.length ? plural(item.extras.length, "adicional", "adicionais") : null,
          ]
            .filter(Boolean)
            .join(" · ") || "Sem descrição"}
        </span>
      </button>

      <p className="num flex flex-col items-end text-right text-[15px] leading-tight font-semibold whitespace-nowrap">
        {from ? <span className="text-[12px] font-normal text-suave">a partir de</span> : null}
        {money(itemFromPrice(item))}
      </p>

      <div className="col-span-2 flex items-center justify-between md:col-span-1 md:justify-center">
        <label className="flex items-center gap-2 md:gap-0">
          <span className="text-[13px] text-suave md:sr-only">À venda</span>
          <Switch
            checked={item.available}
            aria-label={`${item.name} à venda`}
            onCheckedChange={(on) => {
              setAvailable(item.id, on)
              toast(on ? `${item.name} voltou ao cardápio` : `${item.name} marcado como esgotado`)
            }}
          />
        </label>
        <RowActions item={item} first={first} last={last} onEdit={onEdit} className="md:hidden" />
      </div>

      <RowActions item={item} first={first} last={last} onEdit={onEdit} className="hidden md:flex" />
    </li>
  )
}

function RowActions({
  item,
  first,
  last,
  onEdit,
  className,
}: {
  item: Item
  first: boolean
  last: boolean
  onEdit: () => void
  className?: string
}) {
  return (
    <div className={cn("items-center justify-end gap-1", className)}>
      <Button variant="ghost" size="icon" className="size-9" onClick={onEdit} aria-label={`Editar ${item.name}`}>
        <Pencil />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-9" aria-label={`Mais opções de ${item.name}`}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-elevada">
          <DropdownMenuItem disabled={first} onSelect={() => moveItem(item.id, -1)}>
            <ArrowUp /> Subir na lista
          </DropdownMenuItem>
          <DropdownMenuItem disabled={last} onSelect={() => moveItem(item.id, 1)}>
            <ArrowDown /> Descer na lista
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              duplicateItem(item.id)
              toast(`Cópia de ${item.name} criada`)
            }}
          >
            <Copy /> Duplicar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function EmptyState({
  filter,
  query,
  onClear,
  onNew,
}: {
  filter: string
  query: string
  onClear: () => void
  onNew: () => void
}) {
  if (query) {
    return (
      <div className="flex flex-col items-start gap-3 px-5 py-6">
        <p className="text-[15px]">
          Nenhum item com <strong>“{query}”</strong>.
        </p>
        <Button variant="outline" onClick={onClear}>
          Limpar busca
        </Button>
      </div>
    )
  }
  if (filter === "esgotados") {
    return <p className="px-5 py-6 text-[15px] text-suave">Nada esgotado. Todo o cardápio está à venda.</p>
  }
  return (
    <div className="flex flex-col items-start gap-3 px-5 py-6">
      <p className="text-[15px]">Essa categoria ainda está vazia.</p>
      <Button onClick={onNew}>
        <Plus /> Adicionar o primeiro item
      </Button>
    </div>
  )
}

function CategoryDialog({
  state,
  onClose,
  itemsIn,
  onCreated,
  onDeleted,
}: {
  state: { mode: "nova" | "renomear" | "excluir"; cat?: Category } | null
  onClose: () => void
  itemsIn: (id: string) => number
  onCreated: (id: string) => void
  onDeleted: () => void
}) {
  return (
    <Dialog open={!!state} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-elevada sm:max-w-md">
        {state ? (
          <CategoryDialogBody
            key={`${state.mode}-${state.cat?.id ?? "nova"}`}
            state={state}
            onClose={onClose}
            itemsIn={itemsIn}
            onCreated={onCreated}
            onDeleted={onDeleted}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function CategoryDialogBody({
  state,
  onClose,
  itemsIn,
  onCreated,
  onDeleted,
}: {
  state: { mode: "nova" | "renomear" | "excluir"; cat?: Category }
  onClose: () => void
  itemsIn: (id: string) => number
  onCreated: (id: string) => void
  onDeleted: () => void
}) {
  const [name, setName] = useState(state.cat?.name ?? "")

  if (state.mode === "excluir" && state.cat) {
    const n = itemsIn(state.cat.id)
    return (
      <>
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">Excluir {state.cat.name}?</DialogTitle>
          <DialogDescription className="text-suave">
            {n
              ? `Os ${plural(n, "item", "itens")} dessa categoria saem do cardápio junto. Não dá para desfazer.`
              : "A categoria está vazia. Não dá para desfazer."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Manter</Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={() => {
              deleteCategory(state.cat!.id)
              toast(`${state.cat!.name} excluída`)
              onDeleted()
              onClose()
            }}
          >
            Excluir {state.cat.name}
          </Button>
        </DialogFooter>
      </>
    )
  }

  const isNew = state.mode === "nova"
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!name.trim()) return
        if (isNew) {
          const cat = addCategory(name)
          toast(`${cat.name} criada`)
          onCreated(cat.id)
        } else if (state.cat) {
          renameCategory(state.cat.id, name)
        }
        onClose()
      }}
      className="flex flex-col gap-4"
    >
      <DialogHeader>
        <DialogTitle className="text-xl font-extrabold">{isNew ? "Nova categoria" : "Renomear categoria"}</DialogTitle>
        <DialogDescription className="text-suave">
          {isNew ? "Ela entra no fim da lista. Dá para mudar a ordem depois." : "O nome muda no cardápio na hora."}
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="cat-nome" className="text-sm font-semibold">
          Nome da categoria
        </label>
        <Input id="cat-nome" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Lanches" />
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={!name.trim()}>
          {isNew ? "Criar categoria" : "Salvar nome"}
        </Button>
      </DialogFooter>
    </form>
  )
}
