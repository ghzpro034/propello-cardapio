/**
 * Sem as variáveis do Supabase o app roda no modo demonstração (localStorage),
 * como na v0.1. Com elas, cardápio e painel leem e gravam no banco.
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ""

export const supabaseEnabled = Boolean(supabaseUrl && supabaseKey)
