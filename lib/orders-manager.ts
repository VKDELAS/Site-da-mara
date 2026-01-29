import { getSupabase } from "./supabase-fix"
import { storeStatusManager } from "./store-status-manager"

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

  async addOrder(order: any): Promise<Order> {
    console.log("Iniciando processo de salvamento de pedido...", order);
    
    let user = null;
    try {
      const sb = await this.supabase;
      const { data: authData } = await sb.auth.getUser();
      user = authData?.user;
      console.log("Usuário autenticado detectado:", user?.id);
    } catch (e) {
      console.log("Usuário não autenticado ou erro na auth, prosseguindo como anônimo");
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let nextNumber = 1
    
    try {
      const sb = await this.supabase;
      const { data: lastOrders, error: numError } = await sb
        .from("orders")
        .select("customer_neighborhood")
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: false })
        .limit(1)

      if (numError) throw numError;

      if (lastOrders && lastOrders.length > 0) {
        const lastNum = parseInt(lastOrders[0].customer_neighborhood)
        if (!isNaN(lastNum)) nextNumber = lastNum + 1
      }
    } catch (e) {
      console.error("Erro ao buscar número do pedido, usando fallback 1:", e)
      nextNumber = Math.floor(Math.random() * 1000);
    }

    const insertData: any = {
      user_id: user?.id || order.user_id || null,
      customer_name: order.customerName || "Cliente",
      customer_phone: order.customerPhone || "Não informado",
      customer_address: order.address || "",
      customer_neighborhood: nextNumber.toString(),
      payment_method: order.paymentMethod || "dinheiro",
      total_amount: order.total || 0,
      discount_amount: order.discountAmount || 0,
      coupon_code: order.couponCode || null,
      status: "pending",
      delivery_type: order.deliveryType || "delivery",
      notes: order.notes || "",
      metadata: { items: order.items }
    }

    console.log("Tentando inserir na tabela 'orders':", insertData);

    const sb = await this.supabase;
    const { data: orderData, error: orderError } = await sb
      .from("orders")
      .insert(insertData)
      .select()
      .single()

    if (orderError) {
      console.error("ERRO CRÍTICO AO INSERIR PEDIDO:", orderError);
      
      if (insertData.user_id) {
        console.log("Tentando fallback sem user_id...");
        const { data: retryData, error: retryError } = await sb
          .from("orders")
          .insert({ ...insertData, user_id: null })
          .select()
          .single();
          
        if (retryError) {
          console.error("FALHA NO FALLBACK:", retryError);
          throw new Error(`Erro Supabase: ${retryError.message}`);
        }
        
        console.log("Pedido salvo via fallback!");
        await this.saveOrderItems(retryData.id, order.items)
        return this.mapOrderData(retryData, order.items);
      }
      
      throw new Error(`Erro Supabase: ${orderError.message}`);
    }

    console.log("Pedido inserido com sucesso! ID:", orderData.id);

    try {
      await this.saveOrderItems(orderData.id, order.items)
    } catch (error) {
      console.error("Erro ao salvar itens do pedido:", error)
    }

    try {
      await storeStatusManager.addOrderIncrement()
    } catch (error) {
      console.error("Error updating wait time:", error)
    }

    this.startOrderProgression(orderData.id).catch(err => 
      console.error("Erro ao iniciar progressão automática:", err)
    )

    return this.mapOrderData(orderData, order.items)
  }

  private async saveOrderItems(orderId: string, items: any[]) {
    if (!items || items.length === 0) return;
    
    try {
      const sb = await this.supabase;
      const itemsToInsert = items.map((item) => {
        let cleanProductId = item.id
        if (typeof cleanProductId === 'string' && cleanProductId.includes('-') && cleanProductId.split('-').length > 5) {
           const parts = cleanProductId.split('-')
           cleanProductId = parts.slice(0, 5).join('-')
        }

        return {
          order_id: orderId,
          product_id: cleanProductId && cleanProductId.length === 36 ? cleanProductId : null,
          product_name: item.name || "Produto",
          product_price: item.price || 0,
          quantity: item.quantity || 1,
          adicionais: item.adicionais ? item.adicionais : []
        }
      })

      console.log("Inserindo itens do pedido:", itemsToInsert);
      const { error: itemsError } = await sb.from("order_items").insert(itemsToInsert)
      
      if (itemsError) {
        console.error("Erro ao inserir itens:", itemsError);
      }
    } catch (e) {
      console.error("Erro inesperado ao salvar itens:", e)
    }
  }

  private mapOrderData(o: any, items: any[] = []): Order {
    let finalItems = items;
    if ((!items || items.length === 0) && o.order_items) {
      finalItems = o.order_items.map((item: any) => ({
        id: item.product_id,
        name: item.product_name,
        quantity: item.quantity,
        price: Number(item.product_price),
        adicionais: item.adicionais || []
      }))
    } else if ((!items || items.length === 0) && o.metadata?.items) {
      finalItems = o.metadata.items
    }

    return {
      id: o.id,
      orderNumber: parseInt(o.customer_neighborhood) || 0,
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

    try {
      const sb = await this.supabase;
      const { data, error } = await sb
        .from("orders")
        .select(`*, order_items (*)`)
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Erro ao buscar pedidos do dia:", error)
        return []
      }

      return data?.map((o: any) => this.mapOrderData(o)) || []
    } catch (e) {
      console.error("Erro inesperado ao buscar pedidos:", e);
      return [];
    }
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    try {
      const sb = await this.supabase;
      const { data, error } = await sb
        .from("orders")
        .select(`*, order_items (*)`)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Erro ao buscar pedidos do usuário:", error)
        return []
      }

      return data?.map((o: any) => this.mapOrderData(o)) || []
    } catch (e) {
      console.error("Erro inesperado ao buscar pedidos do usuário:", e);
      return [];
    }
  }

  async getOrdersByDate(dateStr: string): Promise<Order[]> {
    const start = new Date(dateStr + 'T00:00:00')
    const end = new Date(dateStr + 'T23:59:59')

    try {
      const sb = await this.supabase;
      const { data, error } = await sb
        .from("orders")
        .select(`*, order_items (*)`)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
        .order("created_at", { ascending: false })

      if (error) return []
      return data?.map((o: any) => this.mapOrderData(o)) || []
    } catch (e) {
      return []
    }
  }

  async getSalesHistory(): Promise<DailySales[]> {
    try {
      const sb = await this.supabase;
      const { data, error } = await sb
        .from("orders")
        .select("created_at, total_amount, status")
        .eq("status", "delivered")
        .order("created_at", { ascending: false })

      if (error) return []

      const history: Record<string, DailySales> = {}
      data.forEach((o: any) => {
        const date = new Date(o.created_at).toISOString().split('T')[0]
        if (!history[date]) {
          history[date] = { date, total: 0, count: 0 }
        }
        history[date].total += Number(o.total_amount)
        history[date].count += 1
      })

      return Object.values(history)
    } catch (e) {
      return []
    }
  }

  async updateOrderStatus(orderId: string, status: Order["status"]): Promise<void> {
    try {
      const sb = await this.supabase;
      const { data: existingOrder } = await sb
        .from("orders")
        .select("metadata")
        .eq("id", orderId)
        .maybeSingle()
      
      const existingMetadata = existingOrder?.metadata || {}
      
      const { error } = await sb
        .from("orders")
        .update({ 
          status,
          metadata: { 
            ...existingMetadata, 
            statusUpdatedAt: new Date().toISOString() 
          }
        })
        .eq("id", orderId)
        
      if (error) console.error("Error updating order status:", error)
    } catch (e) {
      console.error("Unexpected error in updateOrderStatus:", e)
    }
  }

  async getTodayStats() {
    const orders = await this.getTodayOrders()
    // Filtramos apenas pedidos que NÃO estão cancelados para as estatísticas gerais
    const activeOrders = orders.filter(o => o.status !== "cancelled")
    const completedOrders = orders.filter((o) => o.status === "delivered")
    
    return {
      totalOrders: activeOrders.length,
      pendingOrders: activeOrders.filter((o) => o.status === "pending").length,
      preparingOrders: activeOrders.filter((o) => o.status === "preparing").length,
      completedOrders: completedOrders.length,
      totalSales: completedOrders.reduce((sum, o) => sum + o.total, 0),
    }
  }

  private progressionTimers: Map<string, NodeJS.Timeout> = new Map()
  private readonly BASE_PREPARING_TIME = 2 * 60 * 1000 // Reduzido de 6 para 2 min
  private readonly BASE_READY_TIME = 3 * 60 * 1000     // Reduzido de 9 para 3 min

  async startOrderProgression(orderId: string) {
    if (this.progressionTimers.has(orderId)) return;

    const activeOrders = await this.getActiveOrdersCount()
    // Multiplicador mais suave: cada 4 pedidos aumentam o tempo em 1x (antes era cada 2)
    const timeMultiplier = Math.max(1, activeOrders / 4)

    const preparingStartTimer = setTimeout(async () => {
      await this.updateOrderStatus(orderId, "preparing")
    }, 1000)

    const preparingTime = this.BASE_PREPARING_TIME * timeMultiplier
    const readyTimer = setTimeout(async () => {
      await this.updateOrderStatus(orderId, "ready")
    }, preparingTime)

    const readyTime = preparingTime + (this.BASE_READY_TIME * timeMultiplier)
    const deliveredTimer = setTimeout(async () => {
      await this.updateOrderStatus(orderId, "delivered")
      this.progressionTimers.delete(orderId)
      try {
        await storeStatusManager.decrementWaitTime()
      } catch (error) {
        console.error("Erro ao decrementar tempo de espera:", error)
      }
    }, readyTime)

    this.progressionTimers.set(orderId, deliveredTimer)
  }

  async deleteOrder(orderId: string): Promise<void> {
    try {
      this.stopOrderProgression(orderId)
      const sb = await this.supabase
      
      // Primeiro deletar os itens do pedido devido à FK
      await sb.from("order_items").delete().eq("order_id", orderId)
      
      // Depois deletar o pedido
      const { error } = await sb.from("orders").delete().eq("id", orderId)
      
      if (error) throw error
      
      await storeStatusManager.decrementWaitTime()
    } catch (e) {
      console.error("Error deleting order:", e)
      throw e
    }
  }

  async initializeActiveOrdersProgression() {
    const orders = await this.getTodayOrders()
    const activeOrders = orders.filter(o => ["pending", "preparing", "ready"].includes(o.status))
    
    for (const order of activeOrders) {
      if (!this.progressionTimers.has(order.id)) {
        this.startOrderProgression(order.id)
      }
    }
  }

  private async getActiveOrdersCount(): Promise<number> {
    const orders = await this.getTodayOrders()
    return orders.filter(o => ["pending", "preparing", "ready"].includes(o.status)).length
  }

  stopOrderProgression(orderId: string) {
    const timer = this.progressionTimers.get(orderId)
    if (timer) {
      clearTimeout(timer)
      this.progressionTimers.delete(orderId)
    }
  }

  async cancelOrder(orderId: string): Promise<void> {
    try {
      this.stopOrderProgression(orderId)
      await this.updateOrderStatus(orderId, "cancelled")
      await storeStatusManager.decrementWaitTime()
    } catch (e) {
      console.error("Error cancelling order:", e)
    }
  }
}

export const ordersManager = new OrdersManager()
