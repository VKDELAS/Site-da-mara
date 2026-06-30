import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(req: NextRequest) {
  try {
    const { customerId, cardId } = await req.json();
    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    if (!token) {
      return NextResponse.json({ success: true, simulation: true });
    }

    const mpRes = await fetch(`https://api.mercadopago.com/v1/customers/${customerId}/cards/${cardId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (mpRes.ok) {
      return NextResponse.json({ success: true, simulation: false });
    }

    const data = await mpRes.json();
    return NextResponse.json({ success: false, error: data.message || 'Erro ao remover cartão' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
