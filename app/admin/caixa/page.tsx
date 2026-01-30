"use client"

import { useEffect, useState } from "react"
import { HeaderWrapper } from "@/components/header-wrapper"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { DollarSign, Calendar, TrendingUp, ArrowLeft, Package, CheckCircle, Clock, ChevronDown, ChevronUp } from "lucide-react"
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

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
      } else if (user.email && ADMIN_EMAILS.includes(user.email)) {
        setIsAdmin(true)
        loadData()
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

            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-gradient-to-br from-green-400 to-green-500 rounded-2xl flex items-center justify-center shadow-lg">
                <DollarSign className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-gray-900">Fechamento de Caixa</h1>
                <p className="text-gray-500 text-sm md:text-base">Resumo de vendas e histórico de receitas</p>
              </div>
            </div>
          </div>

          {/* Resumo de Hoje */}
          <div className="mb-12">
            <h2 className="text-2xl font-black text-gray-900 mb-4">Resumo de Hoje</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="border-none shadow-md bg-white rounded-2xl overflow-hidden">
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

              <Card className="border-none shadow-md bg-white rounded-2xl overflow-hidden">
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

              <Card className="border-none shadow-md bg-white rounded-2xl overflow-hidden">
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

              <Card className="border-none shadow-md bg-white rounded-2xl overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">Receita</span>
                  </div>
                  <p className="text-gray-600 text-sm font-semibold mb-1">Faturamento</p>
                  <p className="text-3xl font-black text-green-600">R$ {stats.totalSales.toFixed(2)}</p>
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
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1">
                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              expandedDate === day.date ? "bg-yellow-500 text-white" : "bg-blue-50 text-blue-600"
                            }`}>
                              <Calendar className="h-6 w-6" />
                            </div>
                            <div>
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
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-2xl font-black text-green-600">R$ {day.total.toFixed(2)}</p>
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
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                  <thead>
                                    <tr className="text-gray-400 font-bold border-b border-gray-50">
                                      <th className="pb-3 px-2">Pedido</th>
                                      <th className="pb-3 px-2">Cliente</th>
                                      <th className="pb-3 px-2">Itens</th>
                                      <th className="pb-3 px-2 text-right">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-50">
                                    {dateOrders[day.date].map((order) => (
                                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-2 font-bold text-gray-700">#{order.orderNumber}</td>
                                        <td className="py-3 px-2">
                                          <p className="font-bold text-gray-800">{order.customerName}</p>
                                          <p className="text-[10px] text-gray-400">{new Date(order.createdAt).toLocaleTimeString()}</p>
                                        </td>
                                        <td className="py-3 px-2 text-gray-600">
                                          {order.items.map(i => `${i.quantity}x ${i.name}`).join(", ")}
                                        </td>
                                        <td className="py-3 px-2 text-right font-black text-green-600">
                                          R$ {order.total.toFixed(2)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
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
      <Footer />
    </div>
  )
}
