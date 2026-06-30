import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { customerId, cardToken } = await req.json();
    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    if (!token) {
      return NextResponse.json({
        success: true,
        simulation: true,
        cardId: `SIMULATED-CARD-${Math.random().toString(36).substring(2, 10)}`,
      });
    }

    const mpRes = await fetch(`https://api.mercadopago.com/v1/customers/${customerId}/cards`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: cardToken }),
    });

    const data = await mpRes.json();

    if (mpRes.ok) {
      return NextResponse.json({
        success: true,
        simulation: false,
        cardId: data.id,
        lastFour: data.last_four_digits,
        paymentMethodId: data.payment_method?.id,
      });
    }

    return NextResponse.json({ success: false, error: data.message || 'Erro ao salvar cartão no Mercado Pago' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Erro de conexão com o Mercado Pago' });
  }
}
