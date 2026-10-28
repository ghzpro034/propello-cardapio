import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { PublicMenu } from "@/components/menu/public-menu"
import { seed } from "@/lib/seed"
import { supabaseEnabled } from "@/lib/supabase/config"
import { getPublicMenu, getPublicSlugs } from "@/lib/supabase/public"

export const metadata: Metadata = {
  title: "Cardápio",
}

export async function generateStaticParams() {
  if (!supabaseEnabled) return [{ slug: seed.restaurant.slug }]
  const slugs = await getPublicSlugs()
  // o build exige pelo menos um; com o banco vazio o exemplo cai no 404
  return (slugs.length ? slugs : [seed.restaurant.slug]).map((slug) => ({ slug }))
}

async function Menu({ slug }: { slug: string }) {
  if (!supabaseEnabled) return <PublicMenu slug={slug} />
  const menu = await getPublicMenu(slug)
  if (!menu) notFound()
  return <PublicMenu slug={slug} initial={menu} />
}

export default function Page({ params }: PageProps<"/r/[slug]">) {
  return (
    <Suspense>
      {params.then(({ slug }) => (
        <Menu slug={slug} />
      ))}
    </Suspense>
  )
}
