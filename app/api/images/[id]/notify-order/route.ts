// app/api/notify-order/route.ts
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      orderNumber,
      customerName,
      customerPhone,
      address,
      total,
      discountAmount,
      items,
      paymentMethod,
      notes,
      deliveryType,
    } = body

    const phone = process.env.SISTER_WHATSAPP_NUMBER   // ex: 5514999999999
    const apiKey = process.env.CALLMEBOT_API_KEY        // chave recebida pelo WhatsApp

    if (!phone || !apiKey) {
      console.log("[NotifyOrder] Variáveis não configuradas – pulando notificação")
      return NextResponse.json({ success: true, skipped: true })
    }

    // Horário de Brasília
    const now = new Date().toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    })

    // Monta a mensagem
    let msg = `🍟 NOVO PEDIDO #${orderNumber} – ${now}\n`
    msg += `━━━━━━━━━━━━━━\n`
    msg += `👤 ${customerName}\n`
    msg += `📱 ${customerPhone}\n`

    if (deliveryType === "delivery") {
      msg += `📍 ${address}\n`
    } else {
      msg += `🏪 RETIRADA NO LOCAL\n`
    }

    msg += `━━━━━━━━━━━━━━\n`

    items.forEach((item: any) => {
      const name = item.product_name || item.name
      const qty = item.quantity
      const price = Number(item.product_price ?? item.price ?? 0)
      const subtotal = (price * qty).toFixed(2)
      msg += `${qty}x ${name} – R$ ${subtotal}\n`
      if (item.adicionais?.length) {
        item.adicionais.forEach((a: any) => {
          msg += `  + ${a.quantity ?? 1}x ${a.name}\n`
        })
      }
      if (item.pastaType) msg += `  (Massa: ${item.pastaType})\n`
    })

    msg += `━━━━━━━━━━━━━━\n`
    if (discountAmount > 0) {
      msg += `Desconto: -R$ ${Number(discountAmount).toFixed(2)}\n`
    }
    msg += `💰 TOTAL: R$ ${Number(total).toFixed(2)}\n`
    msg += `💳 ${paymentMethod.toUpperCase()}\n`
    if (notes) msg += `📝 ${notes}\n`

    // Chama a CallMeBot
    const encoded = encodeURIComponent(msg)
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encoded}&apikey=${apiKey}`

    const res = await fetch(url, { signal: AbortSignal.timeout(12_000) })

    if (!res.ok) {
      console.error(`[NotifyOrder] CallMeBot retornou ${res.status}`)
    } else {
      console.log("[NotifyOrder] Notificação enviada com sucesso ✓")
    }

    return NextResponse.json({ success: res.ok })
  } catch (error: any) {
    // Nunca retorna erro 5xx para não travar o checkout
    console.error("[NotifyOrder] Erro:", error.message)
    return NextResponse.json({ success: false, error: error.message })
  }
}