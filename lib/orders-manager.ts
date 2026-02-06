import { getSupabase } from "./supabase-fix"
import { storeStatusManager } from "./store-status-manager"
import { validateOrder } from "./validation"

export interface Order {
  id: string
  orderNumber?: number
  customerName: string
  customerPhone: string
  items: any[]
  total: number
  status: "pending" | "preparing" | "ready" | "delivered" | "cancelled"
  paymentMethod: string
  deliveryType: "delivery" | "pickup"
  address: string
  createdAt: Date
  completedAt?: Date
  statusUpdatedAt?: Date
  notes?: string
  discountAmount?: number
  couponCode?: string | null
  user_id?: string | null
}

export interface DailySales {
  date: string
  total: number
  count: number
}

class OrdersManager {
  private supabase = getSupabase()

  async createOrder(order: any): Promise<Order> {
    const validation = validateOrder(order)
    if (!validation.isValid) {
      throw new Error(validation.error || "Dados do pedido inválidos")
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let nextNumber = 1
    
    try {
      const sb = await this.supabase;
      const { data: lastOrders, error: numError } = await sb
        .from("orders")
        .select("order_number")
        .gte("created_at", today.toISOString())
        .order("order_number", { ascending: false })
        .limit(1)

      if (lastOrders && lastOrders.length > 0) {
        const lastNum = lastOrders[0].order_number
        if (lastNum && !isNaN(lastNum)) nextNumber = lastNum + 1
      }
    } catch (e) {
      nextNumber = Math.floor(Math.random() * 1000);
    }

    const insertData: any = {
      user_id: order.user_id || null,
      customer_name: order.customerName || "Cliente",
      customer_phone: order.customerPhone || "Não informado",
      customer_address: order.customerAddress || "",
      customer_neighborhood: order.customerNeighborhood || "",
      customer_complement: order.customerComplement || "",
      payment_method: order.paymentMethod || "dinheiro",
      total_amount: order.totalAmount || 0,
      discount_amount: order.discountAmount || 0,
      coupon_code: order.couponCode || null,
      status: "pending",
      delivery_type: order.deliveryType || "delivery",
      notes: order.notes || "",
      order_number: nextNumber,
      metadata: { items: order.items }
    }

    const sb = await this.supabase;
    const { data: orderData, error: orderError } = await sb
      .from("orders")
      .insert(insertData)
      .select()
      .single()

    if (orderError) throw new Error(`Erro Supabase: ${orderError.message}`);

    await this.saveOrderItems(orderData.id, order.items)
    await storeStatusManager.addOrderIncrement()
    this.startOrderProgression(orderData.id).catch(() => {})

    return this.mapOrderData(orderData, order.items)
  }

  private async saveOrderItems(orderId: string, items: any[]) {
    if (!items || items.length === 0) return;
    const sb = await this.supabase;
    const itemsToInsert = items.map((item) => ({
      order_id: orderId,
      product_id: item.product_id || null,
      product_name: item.product_name || "Produto",
      product_price: item.product_price || 0,
      quantity: item.quantity || 1,
      adicionais: item.adicionais || []
    }))
    await sb.from("order_items").insert(itemsToInsert)
  }

  private mapOrderData(o: any, items: any[] = []): Order {
    let finalItems = items;
    if (!finalItems || finalItems.length === 0) {
      if (o.order_items && o.order_items.length > 0) {
        finalItems = o.order_items.map((item: any) => ({
          id: item.product_id,
          name: item.product_name,
          quantity: item.quantity,
          price: Number(item.product_price),
          adicionais: item.adicionais || []
        }))
      } else if (o.metadata?.items && o.metadata.items.length > 0) {
        finalItems = o.metadata.items.map((item: any) => ({
          id: item.product_id || item.id,
          name: item.product_name || item.name,
          quantity: item.quantity,
          price: Number(item.product_price || item.price),
          adicionais: item.adicionais || []
        }))
      }
    }

    return {
      id: o.id,
      orderNumber: o.order_number || 0,
      customerName: o.customer_name,
      customerPhone: o.customer_phone,
      items: finalItems,
      total: Number(o.total_amount),
      status: o.status as any,
      paymentMethod: o.payment_method,
      deliveryType: o.delivery_type || "delivery",
      address: o.customer_address,
      createdAt: new Date(o.created_at),
      completedAt: o.updated_at ? new Date(o.updated_at) : undefined,
      statusUpdatedAt: o.metadata?.statusUpdatedAt ? new Date(o.metadata.statusUpdatedAt) : (o.updated_at ? new Date(o.updated_at) : undefined),
      notes: o.notes,
      discountAmount: Number(o.discount_amount),
      couponCode: o.coupon_code,
      user_id: o.user_id
    }
  }

  async getTodayOrders(): Promise<Order[]> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const sb = await this.supabase;
    const { data } = await sb
      .from("orders")
      .select(`*, order_items (*)`)
      .gte("created_at", today.toISOString())
      .order("created_at", { ascending: false })
    return data?.map((o: any) => this.mapOrderData(o)) || []
  }

  async getActiveOrders(): Promise<Order[]> {
    const sb = await this.supabase;
    const { data } = await sb
      .from("orders")
      .select(`*, order_items (*)`)
      .in("status", ["pending", "preparing", "ready"])
      .order("created_at", { ascending: false })
    return data?.map((o: any) => this.mapOrderData(o)) || []
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    const sb = await this.supabase;
    const { data } = await sb
      .from("orders")
      .select(`*, order_items (*)`)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
    return data?.map((o: any) => this.mapOrderData(o)) || []
  }

  async getOrdersByDate(dateStr: string): Promise<Order[]> {
    const start = new Date(dateStr + 'T00:00:00')
    const end = new Date(dateStr + 'T23:59:59')
    const sb = await this.supabase;
    const { data } = await sb
      .from("orders")
      .select(`*, order_items (*)`)
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString())
      .order("created_at", { ascending: false })
    return data?.map((o: any) => this.mapOrderData(o)) || []
  }

  async getSalesHistory(): Promise<DailySales[]> {
    const sb = await this.supabase;
    const { data } = await sb
      .from("orders")
      .select("created_at, total_amount, status")
      .eq("status", "delivered")
      .order("created_at", { ascending: false })

    const history: Record<string, DailySales> = {}
    data?.forEach((o: any) => {
      const date = new Date(o.created_at).toISOString().split('T')[0]
      if (!history[date]) history[date] = { date, total: 0, count: 0 }
      history[date].total += Number(o.total_amount)
      history[date].count += 1
    })
    return Object.values(history)
  }

  async getTodayStats() {
    const orders = await this.getTodayOrders()
    const completedOrders = orders.filter((o) => o.status === "delivered")
    return {
      totalOrders: orders.length,
      pendingOrders: orders.filter((o) => o.status === "pending").length,
      preparingOrders: orders.filter((o) => o.status === "preparing").length,
      completedOrders: completedOrders.length,
      totalSales: completedOrders.reduce((sum, o) => sum + o.total, 0),
    }
  }

  async updateOrderStatus(orderId: string, status: Order["status"]): Promise<void> {
    const sb = await this.supabase;
    const { data: existingOrder } = await sb.from("orders").select("metadata").eq("id", orderId).maybeSingle()
    const existingMetadata = existingOrder?.metadata || {}
    await sb.from("orders").update({ 
      status,
      metadata: { ...existingMetadata, statusUpdatedAt: new Date().toISOString() }
    }).eq("id", orderId)
  }

  async deleteOrder(orderId: string): Promise<void> {
    const sb = await this.supabase;
    await sb.from("order_items").delete().eq("order_id", orderId)
    await sb.from("orders").delete().eq("id", orderId)
  }

  private progressionTimers: Map<string, NodeJS.Timeout[]> = new Map()
  private readonly BASE_PREPARING_TIME = 6 * 60 * 1000 
  private readonly BASE_READY_TIME = 9 * 60 * 1000 

  async startOrderProgression(orderId: string) {
    if (this.progressionTimers.has(orderId)) return;
    
    const sb = await this.supabase;
    const { data: order } = await sb.from("orders").select("status, created_at").eq("id", orderId).single();
    if (!order || order.status === "delivered" || order.status === "cancelled") return;

    const activeOrders = await this.getActiveOrders()
    const timeMultiplier = Math.max(1, activeOrders.length / 2)
    const timers: NodeJS.Timeout[] = [];

    const preparingTime = this.BASE_PREPARING_TIME * timeMultiplier
    const readyTime = preparingTime + (this.BASE_READY_TIME * timeMultiplier)

    if (order.status === "pending") {
      timers.push(setTimeout(async () => { 
        await this.updateOrderStatus(orderId, "preparing") 
      }, 1000));
      
      timers.push(setTimeout(async () => { 
        await this.updateOrderStatus(orderId, "ready") 
      }, preparingTime));

      timers.push(setTimeout(async () => {
        await this.updateOrderStatus(orderId, "delivered")
        this.progressionTimers.delete(orderId)
        await storeStatusManager.decrementWaitTime()
      }, readyTime));
    } else if (order.status === "preparing") {
      timers.push(setTimeout(async () => { 
        await this.updateOrderStatus(orderId, "ready") 
      }, preparingTime / 2)); // Assume metade do tempo se já estiver preparando

      timers.push(setTimeout(async () => {
        await this.updateOrderStatus(orderId, "delivered")
        this.progressionTimers.delete(orderId)
        await storeStatusManager.decrementWaitTime()
      }, readyTime / 2));
    } else if (order.status === "ready") {
      timers.push(setTimeout(async () => {
        await this.updateOrderStatus(orderId, "delivered")
        this.progressionTimers.delete(orderId)
        await storeStatusManager.decrementWaitTime()
      }, (this.BASE_READY_TIME * timeMultiplier) / 2));
    }

    if (timers.length > 0) {
      this.progressionTimers.set(orderId, timers)
    }
  }

  async initializeActiveOrdersProgression() {
    const orders = await this.getActiveOrders()
    for (const order of orders) {
      if (!this.progressionTimers.has(order.id)) this.startOrderProgression(order.id)
    }
  }

  stopOrderProgression(orderId: string) {
    const timers = this.progressionTimers.get(orderId)
    if (timers) {
      timers.forEach(t => clearTimeout(t))
      this.progressionTimers.delete(orderId)
    }
  }

  async cancelOrder(orderId: string): Promise<void> {
    this.stopOrderProgression(orderId)
    await this.updateOrderStatus(orderId, "cancelled")
    await storeStatusManager.decrementWaitTime()
  }
}

export const ordersManager = new OrdersManager()
