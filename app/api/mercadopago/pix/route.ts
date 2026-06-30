import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { amount, email, name, orderNumber } = await req.json();
    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    if (!token) {
      return NextResponse.json({
        success: true,
        simulation: true,
        qrCode: '00020101021226870014br.gov.bcb.pix2565pix-sandbox.mercadopago.com5204000053039865802BR5925BatataTopSimulation6009IacangaSP62070503***6304E5A8',
        qrCodeBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
        paymentId: '1234567890',
      });
    }

    const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': Math.random().toString(36).substring(7),
      },
      body: JSON.stringify({
        transaction_amount: Number(amount),
        description: `Pedido Batata Top #${orderNumber}`,
        payment_method_id: 'pix',
        external_reference: orderNumber,
        payer: {
          email: email || 'usuario_teste@testuser.com',
          first_name: name.split(' ')[0] || 'Cliente',
          last_name: name.split(' ').slice(1).join(' ') || 'Batatatop',
        },
      }),
    });

    const data = await mpRes.json();

    if (mpRes.ok) {
      return NextResponse.json({
        success: true,
        simulation: false,
        qrCode: data.point_of_interaction.transaction_data.qr_code,
        qrCodeBase64: data.point_of_interaction.transaction_data.qr_code_base64,
        paymentId: data.id,
      });
    }

    return NextResponse.json({
      success: false,
      error: data.message || 'Erro ao gerar pagamento PIX no Mercado Pago',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Erro de conexão com o Mercado Pago' });
  }
}
