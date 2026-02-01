"use client"

import { useEffect, useState } from "react"
import { HeaderWrapper } from "@/components/header-wrapper"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Clock, ChefHat, CheckCircle, XCircle, Phone, MapPin, ArrowLeft, RefreshCw, Filter, ShoppingBag, Trash2, User, Ticket, Megaphone, Zap, Tag, Image, CreditCard, FileText } from "lucide-react"
import { ordersManager, type Order } from "@/lib/orders-manager"
import { storeStatusManager } from "@/lib/store-status-manager"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
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
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [isPromoActive, setIsPromoActive] = useState(false)
  const [promoPrice, setPromoPrice] = useState("24.99")
  const [promoImage, setPromoImage] = useState("/images/promo-batatop.png")
  const [isUpdatingPromo, setIsUpdatingPromo] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
      } else if (user.email && ADMIN_EMAILS.includes(user.email)) {
        setIsAdmin(true)
        loadOrders()
        loadPromoStatus()
        // Inicializar progressão automática dos pedidos ativos
        ordersManager.initializeActiveOrdersProgression()
        // Atualizar a cada 10 segundos
        const interval = setInterval(() => {
          loadOrders()
          ordersManager.initializeActiveOrdersProgression()
        }, 10000)
        return () => clearInterval(interval)
      } else {
        alert("Você não tem permissão para acessar esta página")
        router.push("/")
      }
    }
  }, [user, loading, router])

  const loadOrders = async () => {
    const todayOrders = await ordersManager.getTodayOrders()
    const activeOrders = await ordersManager.getActiveOrders()
    const allOrders = [...activeOrders, ...todayOrders]
    const uniqueOrders = allOrders.filter((order, index, self) =>
      index === self.findIndex((t) => t.id === order.id)
    )
    setOrders(uniqueOrders)
  }

  const loadPromoStatus = async () => {
    const status = await storeStatusManager.getStatus()
    setIsPromoActive(status.isPromoActive ?? false)
    setPromoPrice((status.promoPrice ?? 24.99).toString())
    setPromoImage(status.promoImage ?? "/images/promo-batatop.png")
  }

  const handleTogglePromo = async () => {
    setIsUpdatingPromo(true)
    try {
      const newState = await storeStatusManager.togglePromoStatus()
      setIsPromoActive(newState)
    } finally {
      setIsUpdatingPromo(false)
    }
  }

  const handleUpdatePromoSettings = async () => {
    const price = parseFloat(promoPrice)
    if (isNaN(price) || price <= 0) {
      alert("Preço inválido")
      return
    }
    setIsUpdatingPromo(true)
    try {
      await storeStatusManager.updatePromoPrice(price)
      await storeStatusManager.updatePromoImage(promoImage)
      alert("Configurações da promoção atualizadas com sucesso!")
    } finally {
      setIsUpdatingPromo(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadOrders()
    setIsRefreshing(false)
  }

  const handleStatusChange = async (orderId: string, status: Order["status"]) => {
    ordersManager.stopOrderProgression(orderId)
    await ordersManager.updateOrderStatus(orderId, status)
    loadOrders()
  }

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Tem certeza que deseja DELETAR este pedido permanentemente? Esta ação removerá o pedido de todos os registros, inclusive do faturamento.")) return
    try {
      await ordersManager.deleteOrder(orderId)
      await loadOrders()
    } catch (error) {
      alert("Erro ao deletar pedido")
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
                <ArrowLeft className="h-5 w-5" /> Voltar ao Painel
              </Button>
            </Link>

            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg">
                <ShoppingBag className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-black text-gray-900">Gerenciar Pedidos</h1>
                <p className="text-gray-500 text-sm md:text-base">Acompanhe e gerencie todos os pedidos ativos</p>
              </div>
              <Button onClick={handleRefresh} disabled={isRefreshing} className="bg-yellow-400 hover:bg-yellow-500 text-white font-bold rounded-xl gap-2 shadow-lg">
                <RefreshCw className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`} /> Atualizar
              </Button>
            </div>
          </div>

          {/* LINK PARA PÁGINA DE PROMOÇÃO */}
          <Link href="/admin/promocoes">
            <Card className="mb-8 border-2 border-orange-400 bg-orange-50/50 overflow-hidden rounded-3xl shadow-xl shadow-orange-100 hover:shadow-orange-200 transition-all cursor-pointer group">
              <div className="bg-orange-400 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Megaphone className="h-6 w-6 text-white" />
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Gerenciar Promoção Ativa</h2>
                </div>
                <ArrowLeft className="h-6 w-6 text-white rotate-180 group-hover:translate-x-1 transition-transform" />
              </div>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isPromoActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    <Zap className={`h-5 w-5 ${isPromoActive ? 'fill-current' : ''}`} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Status: {isPromoActive ? 'Ativa' : 'Desativada'}</p>
                    <p className="text-xs text-gray-500">Clique para configurar preço e banner</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-orange-600 uppercase">Preço Atual</p>
                  <p className="text-lg font-black text-gray-900">R$ {parseFloat(promoPrice).toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            <button onClick={() => setFilter("all")} className={`p-4 rounded-2xl font-bold text-sm transition-all ${filter === "all" ? "bg-yellow-400 text-white shadow-lg" : "bg-white text-gray-700 border-2 border-gray-100 hover:border-yellow-200"}`}>
              <div className="text-2xl font-black mb-1">{stats.total}</div><div>Todos</div>
            </button>
            <button onClick={() => setFilter("pending")} className={`p-4 rounded-2xl font-bold text-sm transition-all ${filter === "pending" ? "bg-orange-400 text-white shadow-lg" : "bg-white text-gray-700 border-2 border-gray-100 hover:border-orange-200"}`}>
              <div className="text-2xl font-black mb-1">{stats.pending}</div><div>Pendentes</div>
            </button>
            <button onClick={() => setFilter("preparing")} className={`p-4 rounded-2xl font-bold text-sm transition-all ${filter === "preparing" ? "bg-blue-400 text-white shadow-lg" : "bg-white text-gray-700 border-2 border-gray-100 hover:border-blue-200"}`}>
              <div className="text-2xl font-black mb-1">{stats.preparing}</div><div>Preparando</div>
            </button>
            <button onClick={() => setFilter("ready")} className={`p-4 rounded-2xl font-bold text-sm transition-all ${filter === "ready" ? "bg-purple-400 text-white shadow-lg" : "bg-white text-gray-700 border-2 border-gray-100 hover:border-purple-200"}`}>
              <div className="text-2xl font-black mb-1">{stats.ready}</div><div>Pronto</div>
            </button>
            <button onClick={() => setFilter("delivered")} className={`p-4 rounded-2xl font-bold text-sm transition-all ${filter === "delivered" ? "bg-green-400 text-white shadow-lg" : "bg-white text-gray-700 border-2 border-gray-100 hover:border-green-200"}`}>
              <div className="text-2xl font-black mb-1">{stats.delivered}</div><div>Entregues</div>
            </button>
            <button onClick={() => setFilter("cancelled")} className={`p-4 rounded-2xl font-bold text-sm transition-all ${filter === "cancelled" ? "bg-red-400 text-white shadow-lg" : "bg-white text-gray-700 border-2 border-gray-100 hover:border-red-200"}`}>
              <div className="text-2xl font-black mb-1">{orders.filter((o) => o.status === "cancelled").length}</div><div>Cancelados</div>
            </button>
          </div>

          {filteredOrders.length === 0 ? (
            <Card className="border-none shadow-md bg-white rounded-3xl">
              <CardContent className="p-12 text-center">
                <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><ShoppingBag className="h-10 w-10 text-gray-300" /></div>
                <p className="text-gray-600 font-semibold text-lg">Nenhum pedido encontrado</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const StatusIcon = statusConfig[order.status].icon
                const config = statusConfig[order.status]
                return (
                  <Card key={order.id} className={`border-2 ${config.borderColor} shadow-md bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-all`}>
                    <CardHeader className={`${config.bgColor} border-b ${config.borderColor} pb-4`}>
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl md:text-2xl font-black text-gray-900">Pedido #{order.orderNumber || order.id.slice(-4).toUpperCase()}</h3>
                            <Badge className={`${config.color} border-none font-bold gap-1`}><StatusIcon className="h-3 w-3" />{config.label}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600"><Clock className="h-4 w-4" />{new Date(order.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteOrder(order.id)} className="text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="h-5 w-5" /></Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-5">
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                          <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm"><User className="h-5 w-5 text-gray-400" /></div>
                          <div><p className="font-bold text-gray-900">{order.customerName}</p><p className="text-sm text-gray-600">{order.customerPhone}</p></div>
                        </div>
                        {order.deliveryType === "delivery" && order.address && (
                          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl"><MapPin className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-1" /><div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-900 mb-1">Endereço de Entrega</p><p className="text-sm text-gray-600 break-words">{order.address}</p></div></div>
                        )}
                        {order.deliveryType === "pickup" && (
                          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl"><MapPin className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-1" /><div className="flex-1"><p className="text-sm font-semibold text-gray-900">Retirada no Local</p><p className="text-sm text-gray-600">Cliente buscará na loja</p></div></div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                            <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm"><CreditCard className="h-5 w-5 text-blue-500" /></div>
                            <div>
                              <p className="text-xs font-bold text-gray-400 uppercase">Pagamento</p>
                              <p className="font-bold text-gray-900 uppercase">{order.paymentMethod}</p>
                            </div>
                          </div>
                          {order.notes && (
                            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                              <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm flex-shrink-0"><FileText className="h-5 w-5 text-orange-500" /></div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-400 uppercase">Observações</p>
                                <p className="text-sm font-medium text-gray-700 break-words">{order.notes}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="border-t-2 border-gray-100 pt-4">
                          {order.couponCode && (
                            <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-xl flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                                  <Ticket className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-green-600 uppercase">Cupom Aplicado</p>
                                  <p className="text-sm font-black text-green-700">{order.couponCode}</p>
                                </div>
                              </div>
                              {order.discountAmount > 0 && (
                                <p className="text-sm font-bold text-green-600">- R$ {order.discountAmount.toFixed(2)}</p>
                              )}
                            </div>
                          )}
                          <h4 className="font-bold text-gray-900 mb-3">Itens do Pedido</h4>
                          <div className="space-y-2 bg-gray-50 p-4 rounded-xl">
                            {order.items && order.items.length > 0 ? (
                              order.items.map((item, idx) => (
                                <div key={idx} className="flex flex-col border-b border-gray-100 last:border-0 pb-2 mb-2 last:pb-0 last:mb-0">
                                  <div className="flex justify-between items-start gap-3">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="flex items-center justify-center w-6 h-6 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">{idx + 1}</span>
                                        <p className="font-bold text-gray-900">{item.quantity}x {item.name}</p>
                                      </div>
                                      {item.adicionais && item.adicionais.length > 0 && (
                                        <div className="ml-8 mt-1">
                                          <p className="text-xs text-gray-500 font-medium">
                                            + {item.adicionais.map((a: any) => `${a.quantity || 1}x ${a.name}`).join(', ')}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                    <p className="font-bold text-gray-900 flex-shrink-0 pt-1">R$ {(item.price * item.quantity).toFixed(2)}</p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-gray-500 italic">Nenhum item encontrado para este pedido.</p>
                            )}
                          </div>
                          <div className="mt-4 pt-4 border-t-2 border-gray-100 flex justify-between items-center"><p className="font-bold text-gray-900">Total do Pedido</p><p className="text-2xl font-black text-yellow-600">R$ {order.total.toFixed(2)}</p></div>
                        </div>
                        {order.status !== "delivered" && order.status !== "cancelled" && (
                          <div className="border-t-2 border-gray-100 pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {order.status === "pending" && (
                                <><Button onClick={() => handleStatusChange(order.id, "preparing")} className="bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl h-11">Iniciar Preparo</Button><Button onClick={() => handleStatusChange(order.id, "cancelled")} variant="outline" className="border-2 border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-xl h-11">Cancelar</Button></>
                              )}
                              {order.status === "preparing" && <Button onClick={() => handleStatusChange(order.id, "ready")} className="col-span-full bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl h-11">Marcar como Pronto</Button>}
                              {order.status === "ready" && <Button onClick={() => handleStatusChange(order.id, "delivered")} className="col-span-full bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl h-11">Marcar como Entregue</Button>}
                            </div>
                          </div>
                        )}
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
