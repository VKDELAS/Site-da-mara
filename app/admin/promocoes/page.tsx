"use client"

import { useEffect, useState } from "react"
import { HeaderWrapper } from "@/components/header-wrapper"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { ArrowLeft, Megaphone, Zap, Tag, Image, Save, AlertCircle, Trash2, Plus } from "lucide-react"
import { storeStatusManager } from "@/lib/store-status-manager"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { productsManager } from "@/lib/products-db"
import { Product } from "@/lib/products-db"

const ADMIN_EMAILS = ["enzzobaraldo2008@gmail.com", "maraysis9010@gmail.com"]

interface PromoProduct {
  productId: string
  productName: string
  promoPrice: number
}

export default function AdminPromocoesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isPromoActive, setIsPromoActive] = useState(false)
  const [promoImage, setPromoImage] = useState("/images/promo-batatop.png")
  const [isUpdatingPromo, setIsUpdatingPromo] = useState(false)
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [promoProducts, setPromoProducts] = useState<PromoProduct[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
      } else if (user.email && ADMIN_EMAILS.includes(user.email)) {
        setIsAdmin(true)
        loadPromoStatus()
        loadProducts()
      } else {
        alert("Você não tem permissão para acessar esta página")
        router.push("/")
      }
    }
  }, [user, loading, router])

  const loadProducts = async () => {
    try {
      setLoadingProducts(true)
      const products = await productsManager.getProducts()
      setAllProducts(products)
      
      // Carrega produtos em promoção salvos
      const status = await storeStatusManager.getStatus()
      if (status.promoProducts) {
        setPromoProducts(status.promoProducts)
      }
    } catch (error) {
      console.error("Erro ao carregar produtos:", error)
    } finally {
      setLoadingProducts(false)
    }
  }

  const loadPromoStatus = async () => {
    const status = await storeStatusManager.getStatus()
    setIsPromoActive(status.isPromoActive ?? false)
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

  const handleAddProduct = (product: Product) => {
    const exists = promoProducts.some(p => p.productId === product.id)
    if (!exists) {
      setPromoProducts([
        ...promoProducts,
        {
          productId: product.id,
          productName: product.name,
          promoPrice: product.price - 1.00 // Desconto padrão de R$ 1.00
        }
      ])
    }
  }

  const handleRemoveProduct = (productId: string) => {
    setPromoProducts(promoProducts.filter(p => p.productId !== productId))
  }

  const handleUpdatePromoPrice = (productId: string, newPrice: number) => {
    setPromoProducts(
      promoProducts.map(p =>
        p.productId === productId ? { ...p, promoPrice: newPrice } : p
      )
    )
  }

  const handleUpdatePromoSettings = async () => {
    if (promoProducts.length === 0) {
      alert("Selecione pelo menos um produto para a promoção")
      return
    }

    setIsUpdatingPromo(true)
    try {
      await storeStatusManager.updatePromoProducts(promoProducts)
      await storeStatusManager.updatePromoImage(promoImage)
      alert("Configurações da promoção atualizadas com sucesso!")
    } finally {
      setIsUpdatingPromo(false)
    }
  }

  const getBatatas = () => allProducts.filter(p => p.category === "batata")
  const getMacarrao = () => allProducts.filter(p => p.category === "macarrao")

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
        <div className="container mx-auto max-w-6xl">
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
                <p className="text-gray-500 text-sm md:text-base">Configure produtos e preços da promoção</p>
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
                <div className="space-y-6">
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
                </div>
              </CardContent>
            </Card>

            {/* Seleção de Produtos */}
            <Card className="border-none shadow-md bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-blue-50 border-b border-blue-100 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
                    <Tag className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black text-gray-900">Produtos em Promoção</CardTitle>
                    <p className="text-sm text-gray-500">Selecione quais produtos terão preço reduzido</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Coluna de Batatas */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                      Batatas
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-4">
                      {getBatatas().map(product => (
                        <div 
                          key={product.id}
                          className="p-4 border-2 border-gray-100 rounded-2xl hover:border-yellow-300 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox 
                              checked={promoProducts.some(p => p.productId === product.id)}
                              onCheckedChange={() => {
                                if (promoProducts.some(p => p.productId === product.id)) {
                                  handleRemoveProduct(product.id)
                                } else {
                                  handleAddProduct(product)
                                }
                              }}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 text-sm">{product.name}</p>
                              <p className="text-xs text-gray-500">Preço original: R$ {product.price.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Coluna de Macarrão */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500"></div>
                      Macarrão
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-4">
                      {getMacarrao().map(product => (
                        <div 
                          key={product.id}
                          className="p-4 border-2 border-gray-100 rounded-2xl hover:border-red-300 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox 
                              checked={promoProducts.some(p => p.productId === product.id)}
                              onCheckedChange={() => {
                                if (promoProducts.some(p => p.productId === product.id)) {
                                  handleRemoveProduct(product.id)
                                } else {
                                  handleAddProduct(product)
                                }
                              }}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 text-sm">{product.name}</p>
                              <p className="text-xs text-gray-500">Preço original: R$ {product.price.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preços Promocionais */}
            {promoProducts.length > 0 && (
              <Card className="border-none shadow-md bg-white rounded-3xl overflow-hidden">
                <CardHeader className="bg-green-50 border-b border-green-100 p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-green-100 text-green-600">
                      <Tag className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black text-gray-900">Preços Promocionais</CardTitle>
                      <p className="text-sm text-gray-500">Configure o preço de cada produto em promoção</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="space-y-4">
                    {promoProducts.map(promo => (
                      <div 
                        key={promo.productId}
                        className="p-6 border-2 border-gray-100 rounded-2xl flex items-end gap-4"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-600 mb-2">{promo.productName}</p>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-400">R$</span>
                            <Input 
                              type="number" 
                              step="0.01"
                              value={promo.promoPrice} 
                              onChange={(e) => handleUpdatePromoPrice(promo.productId, parseFloat(e.target.value))}
                              className="w-32 h-12 rounded-xl border-2 border-gray-100 focus:border-green-400 font-bold text-lg"
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveProduct(promo.productId)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Botão de Salvar */}
            <Button 
              onClick={handleUpdatePromoSettings}
              disabled={isUpdatingPromo || promoProducts.length === 0}
              className="w-full h-16 bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900 text-white font-black rounded-2xl gap-2 shadow-lg transition-all text-lg"
            >
              <Save className="h-6 w-6" /> Salvar Configurações da Promoção
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
