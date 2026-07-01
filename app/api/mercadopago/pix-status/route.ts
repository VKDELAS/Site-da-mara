import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const orderId = req.nextUrl.searchParams.get('orderId');
    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'orderId é obrigatório' }, { status: 400 });
    }

    if (!token) {
      // Sem token configurado: modo simulação local.
      return NextResponse.json({ success: true, simulation: true, status: 'processed', statusDetail: 'accredited' });
    }

    const mpRes = await fetch(`https://api.mercadopago.com/v1/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await mpRes.json();

    if (!mpRes.ok) {
      return NextResponse.json({ success: false, error: data.message || 'Erro ao consultar status do pedido' });
    }

    const payment = data.transactions?.payments?.[0];

    return NextResponse.json({
      success: true,
      status: data.status,
      statusDetail: data.status_detail,
      paymentStatus: payment?.status,
      paymentStatusDetail: payment?.status_detail,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Erro de conexão com o Mercado Pago' });
  }
}
