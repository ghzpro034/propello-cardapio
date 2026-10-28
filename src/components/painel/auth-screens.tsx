"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { PropelloSymbol } from "@/components/brand/propello"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { slugify } from "@/lib/format"
import { supabaseBrowser } from "@/lib/supabase/client"

export function AuthCard({ title, subline, children }: { title: string; subline: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col justify-center px-4 py-10">
      <div className="mb-6 flex items-center gap-2.5">
        <PropelloSymbol size={28} />
        <span className="text-[17px] font-extrabold tracking-[-0.01em]">Cardápio</span>
      </div>
      <h1 className="text-[28px] leading-tight font-extrabold tracking-[-0.015em]">{title}</h1>
      <p className="mt-1 text-[15px] text-suave">{subline}</p>
      <div className="mt-6 rounded-lg border border-linha bg-elevada p-5">{children}</div>
    </main>
  )
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-sm font-semibold">
        {label}
      </Label>
      {children}
      {hint ? (
        <p id={`${id}-dica`} className="text-[13px] text-suave">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

function FormError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="text-[14px] text-negativo">
      {message}
    </p>
  )
}

const authErrors: Record<string, string> = {
  invalid_credentials: "E-mail ou senha não conferem.",
  email_not_confirmed: "Confirme o e-mail pelo link que enviamos antes de entrar.",
  user_already_exists: "Já existe uma conta com esse e-mail. Use Entrar.",
  weak_password: "A senha precisa ter pelo menos 6 caracteres.",
  over_email_send_rate_limit: "Muitas tentativas. Espere um minuto e tente de novo.",
}

export function LoginForm() {
  const router = useRouter()
  const [mode, setMode] = useState<"entrar" | "criar">("entrar")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [notice, setNotice] = useState<string>()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(undefined)
    setNotice(undefined)
    const auth = supabaseBrowser().auth
    const res =
      mode === "entrar"
        ? await auth.signInWithPassword({ email, password })
        : await auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/painel` } })
    setBusy(false)
    if (res.error) {
      const offline = res.error.message === "Failed to fetch"
      return setError(offline ? "Sem conexão com o servidor. Confira a internet e tente de novo." : (authErrors[res.error.code ?? ""] ?? res.error.message))
    }
    if (!res.data.session) return setNotice("Conta criada. Abra o link que enviamos para o seu e-mail e depois entre aqui.")
    router.replace("/painel")
  }

  return (
    <AuthCard
      title={mode === "entrar" ? "Entrar no painel" : "Criar conta"}
      subline={mode === "entrar" ? "Edite o cardápio, pause pedidos e gere o QR code." : "Leva um minuto. O cardápio de exemplo já vem pronto para editar."}
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field id="email" label="E-mail">
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field id="senha" label="Senha" hint={mode === "criar" ? "Pelo menos 6 caracteres." : undefined}>
          <Input
            id="senha"
            type="password"
            autoComplete={mode === "entrar" ? "current-password" : "new-password"}
            minLength={6}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <FormError message={error} />
        {notice ? (
          <p role="status" className="text-[14px] text-positivo">
            {notice}
          </p>
        ) : null}
        <Button type="submit" disabled={busy}>
          {busy ? "Aguarde…" : mode === "entrar" ? "Entrar" : "Criar conta"}
        </Button>
        <button
          type="button"
          onClick={() => {
            setMode(mode === "entrar" ? "criar" : "entrar")
            setError(undefined)
            setNotice(undefined)
          }}
          className="text-[14px] text-suave underline-offset-4 hover:text-foreground hover:underline"
        >
          {mode === "entrar" ? "Ainda não tem conta? Criar conta" : "Já tem conta? Entrar"}
        </button>
      </form>
    </AuthCard>
  )
}

export type NewRestaurant = { name: string; slug: string; whatsapp: string }

export function CreateRestaurantForm({ onCreate }: { onCreate: (r: NewRestaurant) => Promise<string | void> }) {
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [slugTouched, setSlugTouched] = useState(false)
  const [phone, setPhone] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const s = slugify(slug || name)
    const d = phone.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "")
    if (!s) return setError("Escolha o endereço do link.")
    if (d.length < 10 || d.length > 11) return setError("WhatsApp com DDD, como (34) 99999-0000.")
    setBusy(true)
    setError(undefined)
    const problem = await onCreate({ name: name.trim(), slug: s, whatsapp: d })
    setBusy(false)
    if (problem) setError(problem)
  }

  return (
    <AuthCard title="Seu restaurante" subline="Começamos com um cardápio de exemplo. Depois é só trocar pratos e preços.">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field id="nome" label="Nome do restaurante">
          <Input
            id="nome"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (!slugTouched) setSlug(slugify(e.target.value))
            }}
          />
        </Field>
        <Field id="slug" label="Endereço do link" hint={`O cliente abre em /r/${slug || "seu-restaurante"}`}>
          <Input
            id="slug"
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true)
              setSlug(slugify(e.target.value) || e.target.value.toLowerCase())
            }}
            aria-describedby="slug-dica"
          />
        </Field>
        <Field id="whatsapp" label="WhatsApp que recebe os pedidos" hint="Com DDD.">
          <Input
            id="whatsapp"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            aria-describedby="whatsapp-dica"
          />
        </Field>
        <FormError message={error} />
        <Button type="submit" disabled={busy}>
          {busy ? "Criando…" : "Criar cardápio"}
        </Button>
      </form>
    </AuthCard>
  )
}
