// app/api/test-notify/route.ts
// ROTA DE DIAGNÓSTICO – pode apagar depois que confirmar que funciona

import { NextResponse } from "next/server"

export async function GET() {
  const phone  = process.env.SISTER_WHATSAPP_NUMBER
  const apiKey = process.env.CALLMEBOT_API_KEY

  // 1. Verifica se as variáveis existem
  if (!phone || !apiKey) {
    return NextResponse.json({
      ok: false,
      step: "env-vars",
      error: "Variáveis de ambiente não encontradas no Vercel",
      SISTER_WHATSAPP_NUMBER: phone  ? "✅ existe" : "❌ FALTANDO",
      CALLMEBOT_API_KEY:      apiKey ? "✅ existe" : "❌ FALTANDO",
    })
  }

  // 2. Tenta enviar mensagem de teste
  const msg     = `🧪 TESTE batata top – ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} – se chegou aqui, está funcionando!`
  const encoded = encodeURIComponent(msg)
  const url     = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encoded}&apikey=${apiKey}`

  try {
    const res  = await fetch(url, { signal: AbortSignal.timeout(15_000) })
    const body = await res.text()

    return NextResponse.json({
      ok:          res.ok,
      step:        "callmebot-call",
      httpStatus:  res.status,
      callmebotResponse: body,        // aqui verá o erro exato se houver
      phoneUsed:   phone,
      apiKeyUsed:  apiKey.slice(0, 3) + "****", // mostra só primeiros dígitos
    })
  } catch (err: any) {
    return NextResponse.json({
      ok:    false,
      step:  "fetch-error",
      error: err.message,
    })
  }
}