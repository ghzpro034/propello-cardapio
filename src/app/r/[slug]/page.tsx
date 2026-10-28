import type { Metadata } from "next"
import { Suspense } from "react"
import { PublicMenu } from "@/components/menu/public-menu"
import { seed } from "@/lib/seed"

export const metadata: Metadata = {
  title: "Cardápio",
}

// Sem back-end ainda: o único restaurante é o de exemplo.
export function generateStaticParams() {
  return [{ slug: seed.restaurant.slug }]
}

export default function Page({ params }: PageProps<"/r/[slug]">) {
  return (
    <Suspense>
      {params.then(({ slug }) => (
        <PublicMenu slug={slug} />
      ))}
    </Suspense>
  )
}
