import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"

let client: ReturnType<typeof createSupabaseBrowserClient> | null = null

export function getSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      "[v0] Supabase não configurado. Adicione NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY nas variáveis de ambiente.",
    )
    throw new Error("Supabase não configurado. Verifique as variáveis de ambiente.")
  }

  if (supabaseKey.includes("service_role") || supabaseKey.length > 250) {
    console.error(
      "[v0] ERRO: Você está usando a chave SECRETA (service_role) na variável NEXT_PUBLIC_SUPABASE_ANON_KEY!",
      "\nISSO É INSEGURO e causará o erro 'Forbidden use of secret API key in browser'.",
      "\nVocê deve usar a chave ANON/PUBLIC KEY, não a SERVICE_ROLE KEY.",
      "\nVá até: https://supabase.com/dashboard/project/_/settings/api",
      "\nCopie a chave 'anon' ou 'public' (começando com eyJ...) com cerca de 150-200 caracteres.",
    )
    throw new Error(
      "ERRO DE CONFIGURAÇÃO: Você está usando a chave secreta (service_role) ao invés da chave pública (anon). Por favor, corrija as variáveis de ambiente.",
    )
  }

  if (client) {
    return client
  }

  client = createSupabaseBrowserClient(supabaseUrl, supabaseKey, {
    auth: {
      flowType: "pkce",
    },
  })

  return client
}

export function createBrowserClient() {
  return getSupabaseBrowserClient()
}

export function isSupabaseConfigured() {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}