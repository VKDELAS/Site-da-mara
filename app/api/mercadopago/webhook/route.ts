import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────────────────────
// Webhook do Mercado Pago.
// O Mercado Pago chama essa rota automaticamente sempre que o status de um
// pedido/pagamento muda — inclusive quando um PIX é pago. Isso funciona
// mesmo que o app do cliente ou o painel admin estejam fechados, porque
// quem está "avisando" é o próprio Mercado Pago, não o seu app.
//
// Fluxo: MP chama aqui -> confirmamos que foi pago -> atualizamos o pedido
// pra "pending" no Supabase -> o pg_cron (já configurado) assume a partir
// daí e avança sozinho (preparing -> ready -> delivered).
// ─────────────────────────────────────────────────────────────────────────

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Valida a assinatura do Mercado Pago (X-Signature), se o secret estiver
// configurado. Isso garante que a notificação realmente veio do MP, e não
// de alguém tentando forjar uma chamada pra essa rota.
function isValidSignature(req: NextRequest, dataId: string): boolean {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) return true; // sem secret configurado, não valida (ver nota no final)

  const signatureHeader = req.headers.get('x-signature') || '';
  const requestId = req.headers.get('x-request-id') || '';

  const parts: Record<string, string> = {};
  signatureHeader.split(',').forEach((p) => {
    const [k, v] = p.split('=');
    if (k && v) parts[k.trim()] = v.trim();
  });

  const ts = parts['ts'];
  const v1 = parts['v1'];
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const hmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  return hmac === v1;
}

async function processNotification(dataId: string, type: string) {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token || !dataId) return;

  let mpOrderId: string | null = null;
  let isPaid = false;

  if (type === 'order') {
    const mpRes = await fetch(`https://api.mercadopago.com/v1/orders/${dataId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!mpRes.ok) return;
    const data = await mpRes.json();
    const payment = data.transactions?.payments?.[0];
    isPaid = payment?.status === 'approved' || data.status === 'processed';
    mpOrderId = data.id;
  } else if (type === 'payment') {
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!mpRes.ok) return;
    const data = await mpRes.json();
    isPaid = data.status === 'approved';
    mpOrderId = data.order?.id || dataId;
  }

  if (!isPaid || !mpOrderId) return;

  const supabase = getSupabaseAdmin();

  // Encontra o pedido no seu banco pelo order_id do Mercado Pago (salvo em
  // metadata.pix.order_id quando o PIX foi gerado) e só atualiza se ainda
  // estiver "awaiting_payment" — evita reabrir pedidos já cancelados/prontos.
  const { error } = await supabase
    .from('orders')
    .update({ status: 'pending', updated_at: new Date().toISOString() })
    .eq('metadata->pix->>order_id', mpOrderId)
    .eq('status', 'awaiting_payment');

  if (error) {
    console.error('[webhook] Erro ao atualizar pedido:', error.message);
  }
}

export async function POST(req: NextRequest) {
  try {
    const url = req.nextUrl;
    const dataId = url.searchParams.get('data.id') || url.searchParams.get('id') || '';
    const type = url.searchParams.get('type') || url.searchParams.get('topic') || '';

    // Mercado Pago espera uma resposta 200 rápida. Se não respondermos rápido,
    // ele considera falha e reenvia a notificação repetidamente.
    // Por isso: validamos o mínimo necessário e devolvemos 200 sempre,
    // processando o resto de forma resiliente (erros ficam só no log).

    if (!dataId || (type !== 'order' && type !== 'payment')) {
      return NextResponse.json({ received: true });
    }

    if (!isValidSignature(req, dataId)) {
      console.error('[webhook] Assinatura inválida — notificação ignorada.');
      return NextResponse.json({ received: true });
    }

    await processNotification(dataId, type);

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('[webhook] Erro inesperado:', err.message);
    // Mesmo em erro, respondemos 200 — o erro já foi logado, e devolver
    // erro faria o Mercado Pago reenviar a mesma notificação sem parar.
    return NextResponse.json({ received: true });
  }
}

// Alguns testes do painel do Mercado Pago fazem GET pra validar a URL.
export async function GET() {
  return NextResponse.json({ ok: true });
}
