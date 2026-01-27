import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export default async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase is not configured, allow all requests except admin routes
  if (!supabaseUrl || !supabaseKey) {
    if (request.nextUrl.pathname.startsWith("/admin")) {
      const redirectUrl = new URL("/setup-required", request.url)
      return NextResponse.redirect(redirectUrl)
    }
    return NextResponse.next()
  }

  const supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value)
          supabaseResponse.cookies.set(name, value, options)
        })
      },
    },
  })

  // Refresh session and get user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()

  // 1. Proteção de Rotas Administrativas
  if (url.pathname.startsWith("/admin")) {
    if (!user) {
      const redirectUrl = new URL("/login", request.url)
      redirectUrl.searchParams.set("returnUrl", url.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Verifica se o usuário é admin
    const adminEmails = ["enzzobaraldo2008@gmail.com", "maraysis9010@gmail.com"]
    const isAdmin = (user.email && adminEmails.includes(user.email)) || user.user_metadata?.role === "admin"
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  // 2. Proteção de Rotas de Usuário (Pedidos, Perfil, Meus Dados, Checkout)
  const protectedUserRoutes = ["/pedidos", "/perfil", "/meus-dados", "/checkout"]
  if (protectedUserRoutes.some((route) => url.pathname.startsWith(route))) {
    if (!user) {
      const redirectUrl = new URL("/login", request.url)
      redirectUrl.searchParams.set("returnUrl", url.pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // 3. Redirecionar usuários logados para longe da página de login/cadastro
  if ((url.pathname === "/login" || url.pathname === "/cadastro") && user) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
