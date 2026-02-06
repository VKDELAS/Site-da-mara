"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { HeaderWrapper } from "@/components/header-wrapper"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { 
  Calendar, 
  TrendingUp, 
  ArrowLeft, 
  Package, 
  CheckCircle, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  EyeOff, 
  MapPin, 
  Phone, 
  Wallet,
  Truck,
  ShoppingBag,
  ClipboardList,
  Receipt,
  Ticket,
  Trash2,
  AlertTriangle
} from "lucide-react"
import { ordersManager, type DailySales, type Order } from "@/lib/orders-manager"

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const todayStats = await ordersManager.getTodayStats()
      const history = await ordersManager.getSalesHistory()
      
      // Adicionar o dia de hoje ao histórico se não estiver lá
      const todayStr = new Date().toISOString().split('T')[0]
      const hasToday = history.some(h => h.date === todayStr)
      
      let finalHistory = [...history]
      if (!hasToday && todayStats.completedOrders > 0) {
        finalHistory.unshift({
          date: todayStr,
          total: todayStats.totalSales,
          count: todayStats.completedOrders
        })
      } else if (hasToday) {
        // Atualizar os dados de hoje no histórico caso já existam
        finalHistory = finalHistory.map(h => 
          h.date === todayStr 
            ? { ...h, total: todayStats.totalSales, count: todayStats.completedOrders }
            : h
        )
      }

      setStats(todayStats)
      setSalesHistory(finalHistory)
      
      // Se houver uma data expandida, recarregar os pedidos dela também
      if (expandedDate) {
        const orders = await ordersManager.getOrdersByDate(expandedDate)
        setDateOrders(prev => ({ ...prev, [expandedDate]: orders }))
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    }
  }, [expandedDate])

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
      } else if (user.email && ADMIN_EMAILS.includes(user.email)) {
        setIsAdmin(true)
        loadData()
        const interval = setInterval(loadData, 30000)
        return () => clearInterval(interval)
      } else {
        alert("Você não tem permissão para acessar esta página")
        router.push("/")
      }
    }
  }, [user, loading, router, loadData])

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

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order)
    setIsOrderDialogOpen(true)
  }

  const handleDeleteClick = (e: React.MouseEvent, order: Order) => {
    e.stopPropagation()
    setOrderToDelete(order)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return
    
    setIsDeleting(true)
    try {
      await ordersManager.deleteOrder(orderToDelete.id)
      setIsDeleteDialogOpen(false)
      setOrderToDelete(null)
      if (isOrderDialogOpen) setIsOrderDialogOpen(false)
      await loadData()
    } catch (error) {
      console.error("Erro ao deletar pedido:", error)
      alert("Erro ao deletar pedido. Tente novamente.")
    } finally {
      setIsDeleting(false)
    }
  }

  const trocoInfo = useMemo(() => {
    if (!selectedOrder?.notes) return null
    const match = selectedOrder.notes.match(/Troco para:\s*R?\$\s*([\d,.]+)/i)
    return match ? match[1] : null
  }, [selectedOrder])

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-500 border-t-transparent"></div>
          <p className="text-slate-500 font-medium">Carregando painel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <HeaderWrapper />
      
      <main className="flex-1 py-8 px-4 md:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-500 hover:text-yellow-600 transition-colors cursor-pointer mb-2" onClick={() => router.push('/admin')}>
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-semibold">Voltar ao início</span>
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Gestão Financeira</h1>
              <p className="text-slate-500">Gestão de faturamento e histórico de vendas</p>
            </div>
            
            <Button 
              onClick={handleRefresh} 
              disabled={refreshing}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-2xl px-6 h-12 shadow-lg shadow-yellow-100 transition-all active:scale-95"
            >
              {refreshing ? <Clock className="h-5 w-5 animate-spin mr-2" /> : <TrendingUp className="h-5 w-5 mr-2" />}
              {refreshing ? "Sincronizando..." : "Atualizar Dados"}
            </Button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Pedidos Hoje", value: stats.totalOrders, icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Pendentes", value: stats.pendingOrders, icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
              { label: "Entregues", value: stats.completedOrders, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
              { 
                label: "Faturamento", 
                value: showRevenue ? `R$ ${stats.totalSales.toFixed(2)}` : "••••", 
                icon: Wallet, 
                color: "text-emerald-600", 
                bg: "bg-emerald-50",
                isRevenue: true 
              },
            ].map((stat, i) => (
              <Card key={i} className="border-none shadow-sm rounded-3xl overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 ${stat.bg} rounded-2xl`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    {stat.isRevenue && (
                      <button onClick={() => setShowRevenue(!showRevenue)} className="text-slate-400 hover:text-slate-600 transition-colors">
                        {showRevenue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Calendar className="h-5 w-5 text-slate-400" />
              <h2 className="text-xl font-bold text-slate-800">Histórico de Vendas</h2>
            </div>

            {salesHistory.length === 0 ? (
              <div className="bg-white rounded-[2rem] p-12 text-center border-2 border-dashed border-slate-200">
                <div className="bg-slate-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ClipboardList className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-slate-900 font-bold text-lg">Nenhuma venda registrada</h3>
                <p className="text-slate-500 max-w-xs mx-auto mt-1">As vendas finalizadas aparecerão aqui organizadas por data.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {salesHistory.map((day) => (
                  <Card 
                    key={day.date} 
                    className={`border-none shadow-sm rounded-[1.5rem] transition-all duration-300 overflow-hidden ${expandedDate === day.date ? 'ring-2 ring-yellow-400' : 'hover:bg-slate-50'}`}
                  >
                    <div 
                      className="p-5 cursor-pointer flex items-center justify-between"
                      onClick={() => toggleDate(day.date)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-colors ${expandedDate === day.date ? 'bg-yellow-500 text-white' : 'bg-yellow-50 text-yellow-600'}`}>
                          <Calendar className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 capitalize">
                            {new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                            {day.date === new Date().toISOString().split('T')[0] && <Badge className="ml-2 bg-blue-100 text-blue-600 border-none">Hoje</Badge>}
                          </p>
                          <p className="text-sm text-slate-500 font-medium">{day.count} {day.count === 1 ? 'pedido finalizado' : 'pedidos finalizados'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total</p>
                          <p className="text-lg font-black text-slate-900">
                            {showRevenue ? `R$ ${day.total.toFixed(2)}` : "••••"}
                          </p>
                        </div>
                        {expandedDate === day.date ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                      </div>
                    </div>

                    {expandedDate === day.date && (
                      <div className="px-5 pb-5 animate-in slide-in-from-top-2 duration-300">
                        <Separator className="mb-4 bg-slate-100" />
                        {loadingOrders === day.date ? (
                          <div className="py-8 flex justify-center"><Clock className="h-6 w-6 text-yellow-500 animate-spin" /></div>
                        ) : (
                          <div className="space-y-3">
                            {dateOrders[day.date]?.map((order) => (
                              <div 
                                key={order.id} 
                                onClick={() => handleOrderClick(order)}
                                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-md border border-transparent hover:border-slate-100 transition-all cursor-pointer group"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center font-black text-slate-400 border border-slate-100 group-hover:text-yellow-600 group-hover:border-yellow-100 transition-colors">
                                    #{order.orderNumber}
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-900">{order.customerName}</p>
                                    <p className="text-xs text-slate-500 font-medium">
                                      {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • {order.paymentMethod.toUpperCase()}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <p className="font-black text-slate-900">R$ {order.total.toFixed(2)}</p>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                    onClick={(e) => handleDeleteClick(e, order)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de Detalhes do Pedido */}
      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="max-w-md rounded-[2rem] border-none p-0 overflow-hidden">
          <DialogHeader className="bg-yellow-500 p-6 text-white">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-black">Pedido #{selectedOrder?.orderNumber}</DialogTitle>
              <Badge className="bg-white/20 text-white border-none font-bold uppercase tracking-wider">
                {selectedOrder?.status === 'delivered' ? 'Entregue' : selectedOrder?.status}
              </Badge>
            </div>
          </DialogHeader>
          
          <ScrollArea className="max-h-[70vh]">
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500"><Phone className="h-5 w-5" /></div>
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase">WhatsApp</p><p className="font-bold text-slate-900">{selectedOrder?.customerPhone}</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0"><MapPin className="h-5 w-5" /></div>
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase">Endereço</p><p className="font-bold text-slate-900 text-sm leading-tight">{selectedOrder?.address}</p></div>
                </div>
              </div>

              <Separator className="bg-slate-100" />

              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Itens do Pedido</p>
                {selectedOrder?.items.map((item, i) => (
                  <div key={i} className="flex justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900"><span className="text-yellow-600">{item.quantity}x</span> {item.name}</p>
                      {item.pastaType && <p className="text-[10px] font-bold text-yellow-600 uppercase">Tipo: {item.pastaType}</p>}
                      {item.adicionais?.map((a: any, j: number) => (
                        <p key={j} className="text-[10px] text-slate-500 font-medium">+ {a.quantity}x {a.name}</p>
                      ))}
                    </div>
                    <p className="text-sm font-black text-slate-900">R$ {(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              {selectedOrder?.notes && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Observações</p>
                  <p className="text-sm text-slate-700 font-medium">{selectedOrder.notes}</p>
                </div>
              )}

              <div className="pt-4 space-y-2">
                <div className="flex justify-between text-sm font-bold text-slate-500"><span>Subtotal</span><span>R$ {(selectedOrder?.total || 0 + (selectedOrder?.discountAmount || 0)).toFixed(2)}</span></div>
                {selectedOrder?.discountAmount ? (
                  <div className="flex justify-between text-sm font-bold text-green-600"><span>Desconto</span><span>- R$ {selectedOrder.discountAmount.toFixed(2)}</span></div>
                ) : null}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-lg font-black text-slate-900">Total Pago</span>
                  <span className="text-2xl font-black text-yellow-600">R$ {selectedOrder?.total.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase bg-slate-50 p-2 rounded-lg">
                  <Receipt className="h-3 w-3" />
                  <span>Pagamento via {selectedOrder?.paymentMethod}</span>
                  {trocoInfo && <span className="ml-auto text-orange-600">Troco para R$ {trocoInfo}</span>}
                </div>
              </div>
            </div>
          </ScrollArea>
          
          <DialogFooter className="p-6 bg-slate-50">
            <Button variant="outline" onClick={() => setIsOrderDialogOpen(false)} className="w-full rounded-xl font-bold">Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-sm rounded-[2rem] border-none p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center text-red-500">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-xl font-black text-slate-900">Excluir Pedido?</DialogTitle>
              <p className="text-sm text-slate-500 font-medium">
                Esta ação é permanente e removerá o pedido #{orderToDelete?.orderNumber} de todos os registros financeiros.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full pt-2">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting} className="rounded-xl font-bold">Cancelar</Button>
              <Button variant="destructive" onClick={confirmDeleteOrder} disabled={isDeleting} className="rounded-xl font-bold bg-red-500 hover:bg-red-600">
                {isDeleting ? <Clock className="h-4 w-4 animate-spin" /> : "Sim, Excluir"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}
