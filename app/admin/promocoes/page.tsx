"use client"

import { useEffect, useState } from "react"
import { HeaderWrapper } from "@/components/header-wrapper"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { ArrowLeft, Megaphone, Zap, Tag, Image, Save, AlertCircle } from "lucide-react"
import { storeStatusManager } from "@/lib/store-status-manager"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import Link from "next/link"

const ADMIN_EMAILS = ["enzzobaraldo2008@gmail.com", "maraysis9010@gmail.com"]

export default function AdminPromocoesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
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
        loadPromoStatus()
      } else {
        alert("Você não tem permissão para acessar esta página")
        router.push("/")
      }
    }
  }, [user, loading, router])

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
        <div className="container mx-auto max-w-4xl">
          <div className="mb-8">
            <Link href="/admin">
              <Button variant="ghost" className="mb-6 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 font-semibold gap-2">
                <ArrowLeft className="h-5 w-5" /> Voltar ao Painel
              </Button>
            </Link>

            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Megaphone className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-black text-gray-900">Gerenciar Promoção</h1>
                <p className="text-gray-500 text-sm md:text-base">Configure a promoção ativa no site</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {/* Status da Promoção */}
            <Card className="border-none shadow-md bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-orange-50 border-b border-orange-100 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${isPromoActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      <Zap className={`h-6 w-6 ${isPromoActive ? 'fill-current' : ''}`} />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black text-gray-900">Status da Promoção</CardTitle>
                      <p className="text-sm text-gray-500">{isPromoActive ? 'A promoção está visível para todos os clientes' : 'A promoção está desativada'}</p>
                    </div>
                  </div>
                  <Switch 
                    checked={isPromoActive} 
                    onCheckedChange={handleTogglePromo}
                    disabled={isUpdatingPromo}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="font-black text-gray-900 flex items-center gap-2">
                        <Tag className="h-4 w-4 text-orange-500" />
                        Preço Promocional (Batatas)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">R$</span>
                        <Input 
                          type="number" 
                          value={promoPrice} 
                          onChange={(e) => setPromoPrice(e.target.value)}
                          className="pl-12 h-14 rounded-2xl border-2 border-gray-100 focus:border-orange-400 font-bold text-lg"
                        />
                      </div>
                      <p className="text-xs text-gray-500">Este preço será aplicado a todos os produtos da categoria batatas quando a promoção estiver ativa.</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-black text-gray-900 flex items-center gap-2">
                        <Image className="h-4 w-4 text-orange-500" />
                        Caminho da Imagem do Banner
                      </Label>
                      <Input 
                        value={promoImage} 
                        onChange={(e) => setPromoImage(e.target.value)}
                        placeholder="/images/promo-batatop.png"
                        className="h-14 rounded-2xl border-2 border-gray-100 focus:border-orange-400 font-bold"
                      />
                      <p className="text-xs text-gray-500">Caminho da imagem que será exibida no banner promocional da página inicial.</p>
                    </div>

                    <Button 
                      onClick={handleUpdatePromoSettings}
                      disabled={isUpdatingPromo}
                      className="w-full h-14 bg-gray-900 hover:bg-black text-white font-black rounded-2xl gap-2 shadow-lg transition-all"
                    >
                      <Save className="h-5 w-5" /> Salvar Configurações
                    </Button>
                  </div>

                  <div className="bg-orange-50 rounded-3xl p-6 border-2 border-orange-100 flex flex-col items-center justify-center text-center">
                    <div className="h-20 w-20 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
                      <AlertCircle className="h-10 w-10 text-orange-400" />
                    </div>
                    <h3 className="font-black text-gray-900 mb-2">Como funciona?</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Ao ativar a promoção, o sistema automaticamente altera o preço de exibição de todas as batatas para o valor configurado e exibe um banner especial na página inicial.
                    </p>
                    <div className="mt-6 p-4 bg-white rounded-2xl w-full border border-orange-100">
                      <p className="text-xs font-bold text-orange-500 uppercase mb-1">Preview do Preço</p>
                      <p className="text-2xl font-black text-gray-900">R$ {parseFloat(promoPrice || "0").toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
