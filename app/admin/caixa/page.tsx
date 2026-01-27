"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { HeaderWrapper } from "@/components/header-wrapper"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  BarChart3, 
  Eye, 
  EyeOff, 
  MapPin, 
  Phone, 
  X,
  Wallet,
  Truck,
  ShoppingBag,
  ClipboardList,
  Receipt
} from "lucide-react"
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

  const loadData = useCallback(async () => {
    try {
      const todayStats = await ordersManager.getTodayStats()
      const history = await ordersManager.getSalesHistory()
      setStats(todayStats)
      setSalesHistory(history)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    }
  }, [])

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

  // Extrair troco das notas de forma segura
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
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-500 hover:text-yellow-600 transition-colors cursor-pointer mb-2" onClick={() => router.push('/admin')}>
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-semibold">Voltar ao início</span>
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Fluxo de Caixa</h1>
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

          {/* Stats Grid */}
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

          {/* History Section */}
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
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-colors ${expandedDate === day.date ? 'bg-yellow-500 text-white' : 'bg-white border border-slate-100 text-slate-400'}`}>
                          <Calendar className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 capitalize">
                            {new Date(day.date + 'T12:00:00').toLocaleDateString("pt-BR", { weekday: 'long', day: 'numeric', month: 'long' })}
                          </p>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{day.count} {day.count === 1 ? 'Pedido' : 'Pedidos'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                          <p className="text-lg font-black text-emerald-600">R$ {day.total.toFixed(2)}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Total do dia</p>
                        </div>
                        {expandedDate === day.date ? <ChevronUp className="h-5 w-5 text-slate-300" /> : <ChevronDown className="h-5 w-5 text-slate-300" />}
                      </div>
                    </div>

                    {expandedDate === day.date && (
                      <div className="px-5 pb-5 pt-2 border-t border-slate-50">
                        {loadingOrders === day.date ? (
                          <div className="py-8 flex justify-center"><div className="animate-spin h-6 w-6 border-2 border-yellow-500 border-t-transparent rounded-full"></div></div>
                        ) : (
                          <div className="grid gap-2">
                            {dateOrders[day.date]?.map((order) => (
                              <div 
                                key={order.id}
                                onClick={() => handleOrderClick(order)}
                                className="group flex items-center justify-between p-4 bg-slate-50/50 hover:bg-white hover:shadow-md border border-transparent hover:border-slate-100 rounded-2xl transition-all cursor-pointer"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-yellow-500 transition-colors shadow-sm">
                                    <Receipt className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-900">#{order.orderNumber}</p>
                                    <p className="text-xs text-slate-500 font-medium">{order.customerName}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <p className="font-bold text-slate-900">R$ {order.total.toFixed(2)}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                  </div>
                                  <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                                    <ChevronDown className="h-4 w-4 text-slate-400 -rotate-90" />
                                  </div>
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

      {/* Order Details Modal */}
      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="max-w-lg p-0 border-none bg-white rounded-[2.5rem] overflow-hidden shadow-2xl">
          <DialogHeader className="bg-slate-900 p-8 text-white relative">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <Badge className="bg-yellow-500 hover:bg-yellow-500 text-slate-900 font-black border-none px-3 py-1 rounded-full mb-2">
                  PEDIDO FINALIZADO
                </Badge>
                <DialogTitle className="text-4xl font-black tracking-tighter">#{selectedOrder?.orderNumber}</DialogTitle>
                <p className="text-slate-400 text-sm font-medium">
                  {selectedOrder?.createdAt && new Date(selectedOrder.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
              <button 
                onClick={() => setIsOrderDialogOpen(false)}
                className="h-10 w-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="p-8 space-y-8">
              
              {/* Customer Info */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <ShoppingBag className="h-4 w-4" />
                  <h4 className="text-xs font-bold uppercase tracking-widest">Dados do Cliente</h4>
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                    <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-slate-400"><ClipboardList className="h-5 w-5" /></div>
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase">Nome</p><p className="font-bold text-slate-900">{selectedOrder?.customerName}</p></div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                    <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-slate-400"><Phone className="h-5 w-5" /></div>
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase">WhatsApp</p><p className="font-bold text-slate-900">{selectedOrder?.customerPhone}</p></div>
                  </div>
                  {selectedOrder?.deliveryType === 'delivery' && (
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                      <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-slate-400"><MapPin className="h-5 w-5" /></div>
                      <div className="flex-1"><p className="text-[10px] font-bold text-slate-400 uppercase">Endereço de Entrega</p><p className="font-bold text-slate-900 text-sm leading-tight">{selectedOrder?.address}</p></div>
                    </div>
                  )}
                </div>
              </section>

              {/* Items List */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <Package className="h-4 w-4" />
                  <h4 className="text-xs font-bold uppercase tracking-widest">Itens do Pedido</h4>
                </div>
                <div className="space-y-2">
                  {selectedOrder?.items.map((item, idx) => (
                    <div key={idx} className="p-4 border border-slate-100 rounded-2xl space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-3">
                          <span className="h-6 w-6 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-black text-slate-600">{item.quantity}x</span>
                          <p className="font-bold text-slate-900">{item.name}</p>
                        </div>
                        <p className="font-bold text-slate-900">R$ {(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                      {item.adicionais && item.adicionais.length > 0 && (
                        <div className="pl-9 flex flex-wrap gap-1.5">
                          {item.adicionais.map((add: any, i: number) => (
                            <Badge key={i} variant="outline" className="bg-slate-50 border-slate-200 text-slate-500 text-[10px] font-bold py-0 px-2">
                              + {add.name || add}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Payment & Summary */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <Wallet className="h-4 w-4" />
                  <h4 className="text-xs font-bold uppercase tracking-widest">Pagamento e Resumo</h4>
                </div>
                <div className="bg-slate-900 rounded-[2rem] p-6 text-white space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-slate-400"><Wallet className="h-4 w-4" /><span className="text-sm font-medium">Método</span></div>
                    <Badge className="bg-white/10 hover:bg-white/20 text-white border-none font-bold capitalize">{selectedOrder?.paymentMethod}</Badge>
                  </div>
                  
                  {selectedOrder?.paymentMethod === 'dinheiro' && trocoInfo && (
                    <div className="flex justify-between items-center p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                      <div className="flex items-center gap-2 text-yellow-500"><TrendingUp className="h-4 w-4" /><span className="text-sm font-bold">Troco para</span></div>
                      <span className="font-black text-yellow-500 text-lg">R$ {trocoInfo}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-slate-400"><Truck className="h-4 w-4" /><span className="text-sm font-medium">Entrega</span></div>
                    <span className="text-sm font-bold">{selectedOrder?.deliveryType === 'delivery' ? 'Delivery' : 'Retirada'}</span>
                  </div>

                  <Separator className="bg-white/10" />

                  <div className="flex justify-between items-end pt-2">
                    <p className="text-slate-400 font-bold text-xs uppercase">Total Pago</p>
                    <p className="text-3xl font-black text-yellow-500">R$ {selectedOrder?.total.toFixed(2)}</p>
                  </div>
                </div>
              </section>

              {/* Notes */}
              {selectedOrder?.notes && (
                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <ClipboardList className="h-4 w-4" />
                    <h4 className="text-xs font-bold uppercase tracking-widest">Observações</h4>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                    <p className="text-sm text-blue-900 font-medium leading-relaxed">{selectedOrder.notes}</p>
                  </div>
                </section>
              )}
            </div>
          </ScrollArea>
          
          <div className="p-8 pt-0">
            <Button 
              onClick={() => setIsOrderDialogOpen(false)}
              className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl text-lg shadow-xl transition-all active:scale-[0.98]"
            >
              Fechar Detalhes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}
