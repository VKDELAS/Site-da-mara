import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") || "/cardapio"
  const returnUrl = requestUrl.searchParams.get("returnUrl")

  if (code) {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Se houver um parâmetro 'next', redireciona para ele (usado no reset de senha)
      // Caso contrário, usa o returnUrl ou o padrão /cardapio
      const redirectPath = next || returnUrl || "/cardapio"
      return NextResponse.redirect(new URL(redirectPath, request.url))
    }
  }

  // Fallback em caso de erro ou falta de código
  return NextResponse.redirect(new URL("/login?error=auth-callback-failed", request.url))
}
