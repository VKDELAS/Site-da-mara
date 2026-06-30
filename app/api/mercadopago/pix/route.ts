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

    // Modo de teste: quando ativo, usa o "gatilho" oficial do Mercado Pago
    // (first_name = "APRO") pra simular aprovação automática do PIX de teste.
    // Documentação: Orders API > Integration test > Pix.
    const isTestMode = process.env.MERCADO_PAGO_TEST_MODE === 'true';
    const TEST_PAYER_EMAIL = process.env.MERCADO_PAGO_TEST_PAYER_EMAIL || 'test@testuser.com';

    const firstName = isTestMode ? 'APRO' : (name.split(' ')[0] || 'Cliente');
    const lastName = isTestMode ? 'Test' : (name.split(' ').slice(1).join(' ') || 'Batatatop');
    const payerEmail = isTestMode ? TEST_PAYER_EMAIL : (email || 'cliente@batatatop.com');

    // ⚠️ Endpoint correto pra essa aplicação: /v1/orders (Orders API),
    // não /v1/payments (API antiga, causava "unauthorized use of live credentials"
    // porque essa aplicação foi criada especificamente para o produto Orders API).
    const mpRes = await fetch('https://api.mercadopago.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': Math.random().toString(36).substring(7),
      },
      body: JSON.stringify({
        type: 'online',
        external_reference: orderNumber,
        total_amount: Number(amount).toFixed(2),
        payer: {
          email: payerEmail,
          first_name: firstName,
          last_name: lastName,
        },
        transactions: {
          payments: [
            {
              amount: Number(amount).toFixed(2),
              payment_method: {
                id: 'pix',
                type: 'bank_transfer',
              },
            },
          ],
        },
      }),
    });

    const data = await mpRes.json();

    if (mpRes.ok) {
      const payment = data.transactions?.payments?.[0];
      return NextResponse.json({
        success: true,
        simulation: false,
        orderId: data.id,
        paymentId: payment?.id,
        status: data.status,
        statusDetail: data.status_detail,
        qrCode: payment?.payment_method?.qr_code,
        qrCodeBase64: payment?.payment_method?.qr_code_base64,
        ticketUrl: payment?.payment_method?.ticket_url,
      });
    }

    return NextResponse.json({
      success: false,
      error: data.message || 'Erro ao gerar pagamento PIX no Mercado Pago',
      details: data,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Erro de conexão com o Mercado Pago' });
  }
}
