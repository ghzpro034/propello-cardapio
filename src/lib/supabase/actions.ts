"use server"

import { updateTag } from "next/cache"
import { menuTag } from "./public"

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

/** Chamado pelo painel depois de gravar, para o cardápio público mostrar a mudança na hora. */
export async function refreshPublicMenu(slugs: string[]) {
  for (const slug of new Set(slugs)) {
    if (SLUG.test(slug)) updateTag(menuTag(slug))
  }
}
