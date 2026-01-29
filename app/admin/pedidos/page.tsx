"use client"

import { useEffect, useState } from "react"
import { HeaderWrapper } from "@/components/header-wrapper"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Clock, ChefHat, CheckCircle, XCircle, Phone, MapPin, ArrowLeft, RefreshCw, Filter, Trash2, AlertCircle, ShoppingBag } from "lucide-react"
import { ordersManager, type Order } from "@/lib/orders-manager"
import Link from "next/link"

const ADMIN_EMAILS = ["enzzobaraldo2008@gmail.com", "maraysis9010@gmail.com"]

const statusConfig = {
  pending: { label: "Pendente", color: "bg-orange-100 text-orange-700", bgColor: "bg-orange-50", icon: Clock, borderColor: "border-orange-200" },
  preparing: { label: "Preparando", color: "bg-blue-100 text-blue-700", bgColor: "bg-blue-50", icon: ChefHat, borderColor: "border-blue-200" },
  ready: { label: "Pronto", color: "bg-purple-100 text-purple-700", bgColor: "bg-purple-50", icon: CheckCircle, borderColor: "border-purple-200" },
  delivered: { label: "Entregue", color: "bg-green-100 text-green-700", bgColor: "bg-green-50", icon: CheckCircle, borderColor: "border-green-200" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700", bgColor: "bg-red-50", icon: XCircle, borderColor: "border-red-200" },
}

export default function AdminPedidosPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState<"all" | Order["status"]>("all")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
      } else if (user.email && ADMIN_EMAILS.includes(user.email)) {
        setIsAdmin(true)
        loadOrders()
        const interval = setInterval(loadOrders, 10000)
        return () => clearInterval(interval)
      } else {
        alert("Você não tem permissão para acessar esta página")
        router.push("/")
      }
    }
  }, [user, loading, router])

  const loadOrders = async () => {
    // Busca pedidos de hoje + pedidos ativos (mesmo que de dias anteriores)
    const todayOrders = await ordersManager.getTodayOrders()
    const activeOrders = await ordersManager.getActiveOrders()
    
    // Merge e remove duplicados
    const allOrders = [...activeOrders, ...todayOrders]
    const uniqueOrders = allOrders.filter((order, index, self) =>
      index === self.findIndex((t) => t.id === order.id)
    )
    
    setOrders(uniqueOrders)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadOrders()
    setIsRefreshing(false)
  }

  const handleStatusChange = async (orderId: string, status: Order["status"]) => {
    await ordersManager.updateOrderStatus(orderId, status)
    loadOrders()
  }

  const handleDeleteOrder = async (orderId: string) => {
    setDeletingId(orderId)
    try {
      await ordersManager.deleteOrder(orderId)
      setConfirmDelete(null)
      await loadOrders()
    } catch (error) {
      console.error("Erro ao deletar pedido:", error)
      alert("Erro ao deletar pedido. Tente novamente.")
    } finally {
      setDeletingId(null)
    }
  }

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-200 border-t-yellow-500 mx-auto mb-6"></div>
          <p className="text-gray-600 font-semibold">Verificando permissões...</p>
        </div>
      </div>
    )
  }

  const filteredOrders = filter === "all" ? orders : orders.filter((o) => o.status === filter)

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    preparing: orders.filter((o) => o.status === "preparing").length,
    ready: orders.filter((o) => o.status === "ready").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-yellow-50 via-white to-yellow-50">
      <HeaderWrapper />
      <main className="flex-1 py-8 px-4 md:px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8">
            <Link href="/admin">
              <Button variant="ghost" className="mb-6 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 font-semibold gap-2">
                <ArrowLeft className="h-5 w-5" />
                Voltar ao Painel
              </Button>
            </Link>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <ShoppingBag className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-4xl md:text-5xl font-black text-gray-900">Gerenciar Pedidos</h1>
                  <p className="text-gray-500 text-sm md:text-base">Acompanhe e gerencie todos os pedidos ativos</p>
                </div>
              </div>
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-yellow-400 hover:bg-yellow-500 text-white font-bold rounded-xl gap-2 shadow-lg"
              >
                <RefreshCw className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`} />
                {isRefreshing ? "..." : "Atualizar"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            <button onClick={() => setFilter("all")} className={`p-4 rounded-2xl font-bold text-sm transition-all ${filter === "all" ? "bg-yellow-400 text-white shadow-lg" : "bg-white text-gray-700 border-2 border-gray-100 hover:border-yellow-200"}`}>
              <div className="text-2xl font-black mb-1">{stats.total}</div>
              <div>Todos</div>
            </button>
            <button onClick={() => setFilter("pending")} className={`p-4 rounded-2xl font-bold text-sm transition-all ${filter === "pending" ? "bg-orange-400 text-white shadow-lg" : "bg-white text-gray-700 border-2 border-gray-100 hover:border-orange-200"}`}>
              <div className="text-2xl font-black mb-1">{stats.pending}</div>
              <div>Pendentes</div>
            </button>
            <button onClick={() => setFilter("preparing")} className={`p-4 rounded-2xl font-bold text-sm transition-all ${filter === "preparing" ? "bg-blue-400 text-white shadow-lg" : "bg-white text-gray-700 border-2 border-gray-100 hover:border-blue-200"}`}>
              <div className="text-2xl font-black mb-1">{stats.preparing}</div>
              <div>Preparando</div>
            </button>
            <button onClick={() => setFilter("ready")} className={`p-4 rounded-2xl font-bold text-sm transition-all ${filter === "ready" ? "bg-purple-400 text-white shadow-lg" : "bg-white text-gray-700 border-2 border-gray-100 hover:border-purple-200"}`}>
              <div className="text-2xl font-black mb-1">{stats.ready}</div>
              <div>Pronto</div>
            </button>
            <button onClick={() => setFilter("delivered")} className={`p-4 rounded-2xl font-bold text-sm transition-all ${filter === "delivered" ? "bg-green-400 text-white shadow-lg" : "bg-white text-gray-700 border-2 border-gray-100 hover:border-green-200"}`}>
              <div className="text-2xl font-black mb-1">{stats.delivered}</div>
              <div>Entregues</div>
            </button>
            <button onClick={() => setFilter("cancelled")} className={`p-4 rounded-2xl font-bold text-sm transition-all ${filter === "cancelled" ? "bg-red-400 text-white shadow-lg" : "bg-white text-gray-700 border-2 border-gray-100 hover:border-red-200"}`}>
              <div className="text-2xl font-black mb-1">{orders.filter((o) => o.status === "cancelled").length}</div>
              <div>Cancelados</div>
            </button>
          </div>

          {filteredOrders.length === 0 ? (
            <Card className="border-none shadow-md bg-white rounded-3xl">
              <CardContent className="p-12 text-center">
                <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="h-10 w-10 text-gray-300" />
                </div>
                <p className="text-gray-600 font-semibold text-lg">Nenhum pedido encontrado</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const config = statusConfig[order.status]
                return (
                  <Card key={order.id} className={`border-2 ${config.borderColor} shadow-md bg-white rounded-2xl overflow-hidden`}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge className={`${config.color} border-none font-bold px-3 py-1 rounded-lg`}>
                                Pedido #{order.orderNumber || order.id.slice(0, 4)}
                              </Badge>
                              <span className="text-gray-400 text-sm font-medium">
                                {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <select 
                                value={order.status} 
                                onChange={(e) => handleStatusChange(order.id, e.target.value as any)}
                                className="text-sm font-bold border-2 border-gray-100 rounded-xl px-3 py-1 focus:outline-none focus:border-yellow-400"
                              >
                                <option value="pending">Pendente</option>
                                <option value="preparing">Preparando</option>
                                <option value="ready">Pronto</option>
                                <option value="delivered">Entregue</option>
                                <option value="cancelled">Cancelado</option>
                              </select>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => confirmDelete === order.id ? handleDeleteOrder(order.id) : setConfirmDelete(order.id)}
                                className={confirmDelete === order.id ? "text-red-600 bg-red-50" : "text-gray-400 hover:text-red-600"}
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Cliente</p>
                              <p className="text-lg font-black text-gray-900">{order.customerName}</p>
                              <div className="flex items-center gap-2 text-gray-600">
                                <Phone className="h-4 w-4" />
                                <span className="text-sm font-bold">{order.customerPhone}</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Entrega</p>
                              <div className="flex items-start gap-2 text-gray-600">
                                <MapPin className="h-4 w-4 mt-1 shrink-0" />
                                <span className="text-sm font-bold">{order.address}</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Itens do Pedido</p>
                            <div className="space-y-2">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm">
                                  <span className="font-bold text-gray-700">{item.quantity}x {item.name}</span>
                                  <span className="font-black text-gray-900">R$ {(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                              <span className="font-bold text-gray-500">Total</span>
                              <span className="text-xl font-black text-yellow-600">R$ {order.total.toFixed(2)}</span>
                            </div>
                          </div>
                          
                          {order.notes && (
                            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 flex gap-2">
                              <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0" />
                              <p className="text-sm text-yellow-700 font-medium">{order.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
