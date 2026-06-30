import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { amount, token: cardToken, paymentMethodId, email, name, docNumber, orderNumber } = await req.json();
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    if (!accessToken) {
      return NextResponse.json({
        success: true,
        simulation: true,
        paymentId: 'card-simulated-123456',
        status: 'approved',
        statusDetail: 'accredited',
      });
    }

    const cleanDocNumber = (docNumber || '').replace(/\D/g, '');

    const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': Math.random().toString(36).substring(7),
      },
      body: JSON.stringify({
        transaction_amount: Number(amount),
        token: cardToken,
        description: `Pedido Batata Top #${orderNumber}`,
        installments: 1,
        payment_method_id: paymentMethodId,
        external_reference: orderNumber,
        payer: {
          email: email || 'usuario_teste@testuser.com',
          first_name: name.split(' ')[0] || 'Cliente',
          last_name: name.split(' ').slice(1).join(' ') || 'Batatatop',
          identification: { type: 'CPF', number: cleanDocNumber },
        },
      }),
    });

    const data = await mpRes.json();

    if (mpRes.ok) {
      return NextResponse.json({
        success: true,
        simulation: false,
        paymentId: data.id,
        status: data.status,
        statusDetail: data.status_detail,
      });
    }

    return NextResponse.json({
      success: false,
      error: data.message || 'Erro ao processar pagamento via cartão no Mercado Pago',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Erro de conexão com o Mercado Pago' });
  }
}
