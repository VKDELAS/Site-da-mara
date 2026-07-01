const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
export const ADMIN_ORDERS_CHANNEL_ID = 'new-orders';

type OrderItem = {
  product_name?: string;
  name?: string;
  quantity?: number;
  adicionais?: (string | { name?: string })[];
};

type Order = {
  id: string;
  order_number?: number | null;
  customer_name?: string | null;
  order_items?: OrderItem[];
};

export function buildNewOrderPushContent(order: Order, items: OrderItem[] = []) {
  const orderLabel = order.order_number
    ? `#${order.order_number}`
    : `#${String(order.id).slice(-4).toUpperCase()}`;

  const itemLines = items.slice(0, 5).map((item) => {
    const name = item.product_name || item.name || 'Item';
    const qty = item.quantity || 1;
    const adicionais = (item.adicionais || [])
      .map((a) => (typeof a === 'string' ? a : a?.name))
      .filter(Boolean);
    const adicText = adicionais.length ? `\n   + ${adicionais.join(', ')}` : '';
    return `${qty}x ${name}${adicText}`;
  });

  const extra = items.length > 5 ? `\n+${items.length - 5} item(ns)` : '';
  const customer = order.customer_name || 'Cliente';

  const body = [
    customer,
    '────────────────',
    ...itemLines,
    extra,
    '────────────────',
    'Toque para gerenciar o pedido',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    title: `Novo Pedido ${orderLabel}`,
    subtitle: customer,
    body,
    data: {
      orderId: order.id,
      screen: 'admin/pedidos',
      url: '/admin/pedidos',
    },
  };
}

export async function sendExpoPush(messages: Record<string, unknown>[]) {
  if (!messages.length) {
    return { ok: true, sent: 0, result: null };
  }

  const response = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });

  const result = await response.json();
  return { ok: response.ok, sent: messages.length, result };
}

export function buildExpoPushMessages(
  tokens: string[],
  content: ReturnType<typeof buildNewOrderPushContent>,
) {
  return tokens.map((to) => ({
    to,
    title: content.title,
    subtitle: content.subtitle,
    body: content.body,
    sound: 'new-order.mp3',
    priority: 'high',
    channelId: ADMIN_ORDERS_CHANNEL_ID,
    data: content.data,
    android: {
      channelId: ADMIN_ORDERS_CHANNEL_ID,
      priority: 'max',
      sound: 'new-order.mp3',
      color: '#1A1A1A',
    },
    ios: {
      sound: 'new-order.mp3',
      subtitle: content.subtitle,
    },
  }));
}
