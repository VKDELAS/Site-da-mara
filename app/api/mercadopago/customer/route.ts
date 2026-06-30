import { NextRequest, NextResponse } from 'next/server';

async function findCustomerByEmail(email: string, token: string) {
  try {
    const res = await fetch(
      `https://api.mercadopago.com/v1/customers/search?email=${encodeURIComponent(email)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    const customer = data.results?.[0];
    if (res.ok && customer) {
      return { success: true, customerId: customer.id };
    }
    return { success: false, error: 'Cliente não encontrado' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, firstName, lastName } = await req.json();
    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    if (!token) {
      return NextResponse.json({
        success: true,
        simulation: true,
        customerId: `SIMULATED-CUSTOMER-${Math.random().toString(36).substring(2, 10)}`,
      });
    }

    const mpRes = await fetch('https://api.mercadopago.com/v1/customers', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        first_name: firstName || 'Cliente',
        last_name: lastName || 'Batatatop',
      }),
    });

    const data = await mpRes.json();

    if (mpRes.ok) {
      return NextResponse.json({ success: true, simulation: false, customerId: data.id });
    }

    // E-mail duplicado: busca o customer existente em vez de falhar.
    if (data.cause?.some((c: any) => c.code === 101 || c.code === '101')) {
      const existing = await findCustomerByEmail(email, token);
      if (existing.success) {
        return NextResponse.json({ success: true, simulation: false, customerId: existing.customerId });
      }
    }

    return NextResponse.json({ success: false, error: data.message || 'Erro ao criar cliente no Mercado Pago' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Erro de conexão com o Mercado Pago' });
  }
}
