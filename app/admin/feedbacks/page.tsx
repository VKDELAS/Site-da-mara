"use client"

import { useEffect, useState } from "react"
import { HeaderWrapper } from "@/components/header-wrapper"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { ArrowLeft, Star, MessageSquare, Calendar, User, Phone, Package, TrendingUp, Loader2, RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase-fix"

const ADMIN_EMAILS = ["enzzobaraldo2008@gmail.com", "maraysis9010@gmail.com"]

interface Feedback {
  id: string
  order_id: string
  customer_name: string
  customer_phone: string | null
  rating: number
  comment: string | null
  created_at: string
}

export default function AdminFeedbacksPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [isLoadingFeedbacks, setIsLoadingFeedbacks] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    average: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  })

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
      } else if (user.email && ADMIN_EMAILS.includes(user.email)) {
        setIsAdmin(true)
        loadFeedbacks()
      } else {
        alert("Você não tem permissão para acessar esta página")
        router.push("/")
      }
    }
  }, [user, loading, router])

  const loadFeedbacks = async () => {
    setIsLoadingFeedbacks(true)
    try {
      // Busca sem filtros de RLS complexos para garantir que apareça
      const { data, error } = await supabase
        .from("feedbacks")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      setFeedbacks(data || [])
      calculateStats(data || [])
    } catch (error) {
      console.error("Erro ao carregar feedbacks:", error)
    } finally {
      setIsLoadingFeedbacks(false)
    }
  }

  const calculateStats = (feedbacksData: Feedback[]) => {
    const total = feedbacksData.length
    const sum = feedbacksData.reduce((acc, fb) => acc + fb.rating, 0)
    const average = total > 0 ? sum / total : 0

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    feedbacksData.forEach((fb) => {
      distribution[fb.rating as keyof typeof distribution]++
    })

    setStats({ total, average, distribution })
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "text-green-600 bg-green-50"
    if (rating === 3) return "text-yellow-600 bg-yellow-50"
    return "text-red-600 bg-red-50"
  }

  const getRatingLabel = (rating: number) => {
    const labels: Record<number, string> = {
      1: "Muito ruim",
      2: "Ruim",
      3: "Regular",
      4: "Bom",
      5: "Excelente",
    }
    return labels[rating] || ""
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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <HeaderWrapper />
      
      <main className="flex-1 py-4 md:py-8 px-4 md:px-6">
        <div className="container mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={() => router.push("/admin")}
                  className="p-2 hover:bg-white rounded-xl transition-colors"
                >
                  <ArrowLeft className="h-6 w-6 text-gray-700" />
                </Button>
                <h1 className="text-2xl md:text-4xl font-black text-gray-900">Feedbacks</h1>
              </div>
              <Button 
                onClick={loadFeedbacks} 
                variant="outline" 
                size="sm" 
                className="rounded-xl border-2 border-yellow-400 text-yellow-700 font-bold"
                disabled={isLoadingFeedbacks}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingFeedbacks ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>

          {/* Stats Cards - Mobile Scrollable */}
          <div className="flex md:grid md:grid-cols-3 gap-4 mb-8 overflow-x-auto pb-4 md:pb-0 no-scrollbar">
            {/* Total */}
            <Card className="min-w-[160px] flex-1 border-none shadow-sm bg-white rounded-2xl">
              <CardContent className="p-5">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Total</p>
                <p className="text-3xl font-black text-gray-900">{stats.total}</p>
              </CardContent>
            </Card>

            {/* Média */}
            <Card className="min-w-[160px] flex-1 border-none shadow-sm bg-white rounded-2xl">
              <CardContent className="p-5">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Média</p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-black text-yellow-500">{stats.average.toFixed(1)}</p>
                  <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                </div>
              </CardContent>
            </Card>

            {/* Distribuição - Desktop Only or Expandable */}
            <Card className="hidden md:block border-none shadow-sm bg-white rounded-2xl">
              <CardContent className="p-5">
                <div className="space-y-1">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-400 w-4">{rating}★</span>
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 rounded-full"
                          style={{
                            width: `${stats.total > 0 ? (stats.distribution[rating as keyof typeof stats.distribution] / stats.total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feedbacks List */}
          <div className="space-y-4">
            {isLoadingFeedbacks ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-10 w-10 text-yellow-500 animate-spin mb-4" />
                <p className="text-gray-500 font-bold">Buscando avaliações...</p>
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-100">
                <div className="w-20 h-20 mx-auto mb-4 bg-yellow-50 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-10 w-10 text-yellow-200" />
                </div>
                <h3 className="text-xl font-black text-gray-800 mb-1">Nenhuma avaliação</h3>
                <p className="text-gray-500 text-sm">As avaliações aparecerão aqui assim que os clientes enviarem.</p>
              </div>
            ) : (
              feedbacks.map((feedback) => (
                <Card key={feedback.id} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden hover:shadow-md transition-all border border-gray-50">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Rating Circle */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center ${getRatingColor(feedback.rating)}`}>
                        <span className="text-lg font-black leading-none">{feedback.rating}</span>
                        <Star className="h-3 w-3 fill-current" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                          <h3 className="font-black text-gray-900 truncate">{feedback.customer_name}</h3>
                          <span className="text-[10px] font-bold text-gray-400 uppercase">
                            {new Date(feedback.created_at).toLocaleDateString("pt-BR")}
                          </span>
                        </div>

                        {/* Comment */}
                        {feedback.comment ? (
                          <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 p-3 rounded-xl mb-3 italic">
                            "{feedback.comment}"
                          </p>
                        ) : (
                          <p className="text-gray-400 text-xs mb-3 italic">Sem comentário</p>
                        )}

                        {/* Footer Info */}
                        <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            <span>#{feedback.order_id.slice(0, 6)}</span>
                          </div>
                          {feedback.customer_phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span>{feedback.customer_phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
