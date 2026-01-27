"use client"

import { useEffect, useState } from "react"
import { HeaderWrapper } from "@/components/header-wrapper"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { DollarSign, Calendar, TrendingUp, ArrowLeft, Package, CheckCircle, Clock, ChevronDown, ChevronUp, BarChart3, Eye, EyeOff, MapPin, Phone, Utensils, X } from "lucide-react"
import { ordersManager, type DailySales, type Order } from "@/lib/orders-manager"
import Link from "next/link"

const ADMIN_EMAILS = ["enzzobaraldo2008@gmail.com", "maraysis9010@gmail.com"]

export default function AdminCaixaPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    preparingOrders: 0,
    completedOrders: 0,
    totalSales: 0,
  })
  const [salesHistory, setSalesHistory] = useState<DailySales[]>([])
  const [expandedDate, setExpandedDate] = useState<string | null>(null)
  const [dateOrders, setDateOrders] = useState<Record<string, Order[]>>({})
  const [loadingOrders, setLoadingOrders] = useState<string | null>(null)
  const [showRevenue, setShowRevenue] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
      } else if (user.email && ADMIN_EMAILS.includes(user.email)) {
        setIsAdmin(true)
        loadData()
        // Atualizar dados a cada 30 segundos
        const interval = setInterval(() => {
          loadData()
        }, 30000)
        return () => clearInterval(interval)
      } else {
        alert("Você não tem permissão para acessar esta página")
        router.push("/")
      }
    }
  }, [user, loading, router])

  const loadData = async () => {
    const todayStats = await ordersManager.getTodayStats()
    const history = await ordersManager.getSalesHistory()
    setStats(todayStats)
    setSalesHistory(history)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const toggleDate = async (date: string) => {
    if (expandedDate === date) {
      setExpandedDate(null)
      return
    }

    setExpandedDate(date)
    if (!dateOrders[date]) {
      setLoadingOrders(date)
      try {
        const orders = await ordersManager.getOrdersByDate(date)
        setDateOrders(prev => ({ ...prev, [date]: orders }))
      } catch (error) {
        console.error("Erro ao carregar pedidos da data:", error)
      } finally {
        setLoadingOrders(null)
      }
    }
  }

  const handleOrderClick = (order: Order, date: string) => {
    setSelectedOrder(order)
    setIsOrderDialogOpen(true)
    // Garantir que a data permaneça expandida
    if (expandedDate !== date) {
      setExpandedDate(date)
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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-yellow-50 via-white to-yellow-50">
      <HeaderWrapper />
      <main className="flex-1 py-8 px-4 md:px-6">
        <div className="container mx-auto max-w-7xl">
          {/* Cabeçalho */}
          <div className="mb-8">
            <Link href="/admin">
              <Button variant="ghost" className="mb-6 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 font-semibold gap-2">
                <ArrowLeft className="h-5 w-5" />
                Voltar ao Painel
              </Button>
            </Link>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-5xl font-black text-gray-900">Resumo de Vendas</h1>
                  <p className="text-gray-500 text-xs md:text-base">Acompanhe o faturamento e histórico de receitas</p>
                </div>
              </div>
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-yellow-400 hover:bg-yellow-500 text-white font-bold rounded-xl gap-2 shadow-lg w-full md:w-auto"
              >
                <Clock className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Atualizando..." : "Atualizar"}
              </Button>
            </div>
          </div>

          {/* Resumo de Hoje */}
          <div className="mb-12">
            <h2 className="text-2xl font-black text-gray-900 mb-4">Resumo de Hoje</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <Card className="border-none shadow-md bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                      <Package className="h-6 w-6 text-yellow-600" />
                    </div>
                    <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">Total</span>
                  </div>
                  <p className="text-gray-600 text-sm font-semibold mb-1">Pedidos Totais</p>
                  <p className="text-4xl font-black text-gray-900">{stats.totalOrders}</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center">
                      <Clock className="h-6 w-6 text-orange-600" />
                    </div>
                    <span className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">Ação</span>
                  </div>
                  <p className="text-gray-600 text-sm font-semibold mb-1">Pendentes</p>
                  <p className="text-4xl font-black text-orange-600">{stats.pendingOrders}</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Preparo</span>
                  </div>
                  <p className="text-gray-600 text-sm font-semibold mb-1">Preparando</p>
                  <p className="text-4xl font-black text-blue-600">{stats.preparingOrders}</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">Completo</span>
                  </div>
                  <p className="text-gray-600 text-sm font-semibold mb-1">Entregues</p>
                  <p className="text-4xl font-black text-green-600">{stats.completedOrders}</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-all cursor-pointer" onClick={() => setShowRevenue(!showRevenue)}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <button className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full hover:bg-green-100 transition-colors">
                      {showRevenue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-gray-600 text-sm font-semibold mb-1">Faturamento</p>
                  <p className="text-3xl font-black text-green-600">
                    {showRevenue ? `R$ ${stats.totalSales.toFixed(2)}` : "••••••"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Histórico de Vendas */}
          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-4">Histórico de Vendas Passadas</h2>
            {salesHistory.length === 0 ? (
              <Card className="border-2 border-dashed border-gray-200 rounded-3xl">
                <CardContent className="p-12 text-center">
                  <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 font-semibold">Nenhum histórico de vendas ainda</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {salesHistory.map((day, index) => (
                  <div key={index} className="group">
                    <Card 
                      onClick={() => toggleDate(day.date)}
                      className={`border-2 transition-all cursor-pointer overflow-hidden rounded-2xl ${
                        expandedDate === day.date ? "border-yellow-400 shadow-lg" : "border-gray-100 hover:border-yellow-200 shadow-md"
                      }`}
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1 w-full">
                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                              expandedDate === day.date ? "bg-yellow-500 text-white shadow-lg" : "bg-blue-50 text-blue-600"
                            }`}>
                              <Calendar className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-gray-900 text-lg">
                                {new Date(day.date + 'T12:00:00').toLocaleDateString("pt-BR", {
                                  weekday: "long",
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })}
                              </p>
                              <p className="text-sm text-gray-500 font-semibold">
                                {day.count} {day.count === 1 ? "pedido entregue" : "pedidos entregues"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                            <div className="text-right">
                              <p className="text-2xl font-black text-yellow-600">R$ {day.total.toFixed(2)}</p>
                              <p className="text-xs text-gray-500 font-semibold">Faturamento</p>
                            </div>
                            {expandedDate === day.date ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
                          </div>
                        </div>

                        {/* Detalhes dos Pedidos (Expandido) */}
                        {expandedDate === day.date && (
                          <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
                            {loadingOrders === day.date ? (
                              <div className="flex justify-center py-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                              </div>
                            ) : dateOrders[day.date]?.length > 0 ? (
                              <div className="space-y-3">
                                {dateOrders[day.date].map((order) => (
                                  <div
                                    key={order.id}
                                    onClick={() => handleOrderClick(order, day.date)}
                                    className="p-4 bg-gradient-to-r from-yellow-50 to-white rounded-xl border border-yellow-200 hover:border-yellow-400 hover:shadow-md transition-all cursor-pointer group"
                                  >
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex-1">
                                        <p className="font-bold text-gray-900 text-lg">Pedido #{order.orderNumber}</p>
                                        <p className="text-sm text-gray-600 font-semibold mb-2">{order.customerName}</p>
                                        <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleTimeString()}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-xl font-black text-yellow-600">R$ {order.total.toFixed(2)}</p>
                                        <p className="text-xs text-gray-500 font-semibold">{order.items.length} item(ns)</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-center text-gray-400 py-4">Nenhum detalhe encontrado.</p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Pop-up Modal do Pedido - Estilo iFood */}
      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent showCloseButton={false} className="bg-white rounded-3xl border-0 shadow-2xl max-w-md p-0 overflow-hidden">
          {/* Header Amarelo */}
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 px-6 py-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold opacity-90">Pedido Nº</p>
                <h2 className="text-3xl font-black">#{selectedOrder?.orderNumber}</h2>
              </div>
              <button
                onClick={() => setIsOrderDialogOpen(false)}
                className="p-2 hover:bg-yellow-600 rounded-full transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="px-6 py-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
            {/* Informações do Cliente */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 text-lg">Informações do Cliente</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">Nome</p>
                    <p className="font-bold text-gray-900">{selectedOrder?.customerName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">Telefone</p>
                    <p className="font-bold text-gray-900">{selectedOrder?.customerPhone}</p>
                  </div>
                </div>
                {selectedOrder?.deliveryType === 'delivery' && (
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">Endereço</p>
                      <p className="font-bold text-gray-900">{selectedOrder?.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Itens do Pedido */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 text-lg">Itens do Pedido</h3>
              <div className="space-y-3">
                {selectedOrder?.items.map((item, index) => (
                  <div key={index} className="flex items-start justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{item.name}</p>
                      {item.adicionais && item.adicionais.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {item.adicionais.map((adicional: any, idx: number) => (
                            <p key={idx} className="text-xs text-gray-600">
                              • {adicional.name || adicional}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-bold text-gray-900">{item.quantity}x</p>
                      <p className="text-sm text-yellow-600 font-bold">R$ {(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detalhes do Pedido */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 text-lg">Detalhes</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 font-semibold">Tipo de Entrega</p>
                  <p className="font-bold text-gray-900 capitalize">{selectedOrder?.deliveryType === 'delivery' ? 'Entrega' : 'Retirada'}</p>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 font-semibold">Método de Pagamento</p>
                  <p className="font-bold text-gray-900 capitalize">{selectedOrder?.paymentMethod}</p>
                </div>
                {selectedOrder?.paymentMethod === 'dinheiro' && selectedOrder?.notes?.includes('Troco para:') && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <p className="text-blue-600 font-semibold">Troco Solicitado</p>
                    <p className="font-bold text-blue-700">
                      {selectedOrder.notes.split('Troco para:')[1].trim().split('\n')[0]}
                    </p>
                  </div>
                )}
                {selectedOrder?.couponCode && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 font-semibold">Cupom Aplicado</p>
                    <p className="font-bold text-gray-900">{selectedOrder.couponCode}</p>
                  </div>
                )}
                {selectedOrder?.discountAmount && selectedOrder.discountAmount > 0 && (
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <p className="text-gray-600 font-semibold">Desconto</p>
                    <p className="font-bold text-red-600">-R$ {selectedOrder.discountAmount.toFixed(2)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notas */}
            {selectedOrder?.notes && (
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 text-lg">Observações</h3>
                <p className="p-4 bg-blue-50 rounded-xl text-gray-700 text-sm">{selectedOrder.notes}</p>
              </div>
            )}
          </div>

          {/* Footer com Total */}
          <div className="bg-gradient-to-r from-yellow-50 to-white border-t border-yellow-200 px-6 py-6">
            <div className="flex items-center justify-between mb-4 gap-4">
              <p className="text-gray-600 font-semibold whitespace-nowrap">Total do Pedido</p>
              <p className="text-2xl sm:text-3xl font-black text-yellow-600 break-all text-right">R$ {selectedOrder?.total.toFixed(2)}</p>
            </div>
            <Button
              onClick={() => setIsOrderDialogOpen(false)}
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-bold h-12 rounded-xl shadow-lg"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}
