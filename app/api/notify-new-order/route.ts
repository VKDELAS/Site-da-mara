import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import {
  ADMIN_ORDERS_CHANNEL_ID,
  buildExpoPushMessages,
  buildNewOrderPushContent,
  sendExpoPush,
} from '@/lib/push-notifications';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY nao configuradas');
  }

  return createClient(url, key);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'orderId obrigatorio' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } },
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items (*)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: 'Pedido nao encontrado' },
        { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } },
      );
    }

    const { data: tokens, error: tokenError } = await supabase
      .from('admin_push_tokens')
      .select('expo_push_token');

    if (tokenError) {
      return NextResponse.json(
        { success: false, error: tokenError.message },
        { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } },
      );
    }

    const uniqueTokens = [
      ...new Set((tokens || []).map((t) => t.expo_push_token).filter(Boolean)),
    ] as string[];

    const content = buildNewOrderPushContent(order, order.order_items || []);
    const messages = buildExpoPushMessages(uniqueTokens, content);
    const pushResult = await sendExpoPush(messages);

    return NextResponse.json(
      {
        success: true,
        sent: messages.length,
        channelId: ADMIN_ORDERS_CHANNEL_ID,
        push: pushResult,
      },
      { headers: { 'Access-Control-Allow-Origin': '*' } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } },
    );
  }
}
