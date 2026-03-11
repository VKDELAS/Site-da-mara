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
import { imageUploadManager, UploadedImage } from "@/lib/image-upload-manager"

const ADMIN_EMAILS = ["enzzobaraldo2008@gmail.com", "maraysis9010@gmail.com"]

interface PromoProduct {
  productId: string
  productName: string
  promoPrice: number
}

interface SuperPromo {
  isActive: boolean
  price: number
  imageId?: string
}

export default function AdminPromocoesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [promoProducts, setPromoProducts] = useState<PromoProduct[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [isUpdatingPromo, setIsUpdatingPromo] = useState(false)
  
  // Super Promoção (todos os preços)
  const [superPromo, setSuperPromo] = useState<SuperPromo>({
    isActive: false,
    price: 26.00,
    imageId: undefined
  })
  
  // Promoção de itens específicos
  const [itemPromo, setItemPromo] = useState<{
    isActive: boolean
    imageId?: string
  }>({
    isActive: false,
    imageId: undefined
  })
  
  // Imagens disponíveis
  const [promoImages, setPromoImages] = useState<UploadedImage[]>([])
  const [loadingImages, setLoadingImages] = useState(true)
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
      } else if (user.email && ADMIN_EMAILS.includes(user.email)) {
        setIsAdmin(true)
        loadPromoStatus()
        loadProducts()
        loadImages()
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
      if (status.itemPromo) {
        setItemPromo(status.itemPromo)
      }
    } catch (error) {
      console.error("Erro ao carregar produtos:", error)
    } finally {
      setLoadingProducts(false)
    }
  }

  const loadImages = async () => {
    try {
      setLoadingImages(true)
      const images = await imageUploadManager.getImagesByCategory("promo")
      setPromoImages(images)
    } catch (error) {
      console.error("Erro ao carregar imagens:", error)
    } finally {
      setLoadingImages(false)
    }
  }

  const loadPromoStatus = async () => {
    const status = await storeStatusManager.getStatus()
    setSuperPromo({
      isActive: status.superPromo?.isActive ?? false,
      price: status.superPromo?.price ?? 26.00,
      imageId: status.superPromo?.imageId
    })
    setItemPromo({
      isActive: status.itemPromo?.isActive ?? false,
      imageId: status.itemPromo?.imageId
    })
  }

  const handleToggleSuperPromo = async () => {
    const newState = !superPromo.isActive
    setSuperPromo({ ...superPromo, isActive: newState })
  }

  const handleToggleItemPromo = async () => {
    const newState = !itemPromo.isActive
    setItemPromo({ ...itemPromo, isActive: newState })
  }

  const handleAddProduct = (product: Product) => {
    const exists = promoProducts.some(p => p.productId === product.id)
    if (!exists) {
      setPromoProducts([
        ...promoProducts,
        {
          productId: product.id,
          productName: product.name,
          promoPrice: product.price - 1.00
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

  const handleSaveSuperPromo = async () => {
    setIsUpdatingPromo(true)
    try {
      await storeStatusManager.updateSuperPromo(superPromo)
      alert("Super Promoção atualizada com sucesso!")
    } finally {
      setIsUpdatingPromo(false)
    }
  }

  const handleSaveItemPromo = async () => {
    if (promoProducts.length === 0) {
      alert("Selecione pelo menos um produto para a promoção")
      return
    }

    setIsUpdatingPromo(true)
    try {
      await storeStatusManager.updateItemPromo(itemPromo)
      await storeStatusManager.updatePromoProducts(promoProducts)
      alert("Promoção de itens atualizada com sucesso!")
    } finally {
      setIsUpdatingPromo(false)
    }
  }

  const getBatatas = () => allProducts.filter(p => p.category === "batata")
  const getMacarrao = () => allProducts.filter(p => p.category === "macarrao")

  const getImagePreview = (imageId?: string) => {
    if (!imageId) return null
    const image = promoImages.find(img => img.id === imageId)
    if (image) {
      return `data:${image.mimeType};base64,${image.data}`
    }
    return null
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
            {/* ========== SUPER PROMOÇÃO (TODOS OS PREÇOS) ========== */}
            <Card className="border-none shadow-md bg-white rounded-3xl overflow-hidden border-l-4 border-red-500">
              <CardHeader className="bg-red-50 border-b border-red-100 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${superPromo.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      <Zap className={`h-6 w-6 ${superPromo.isActive ? 'fill-current' : ''}`} />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black text-gray-900">Super Promoção</CardTitle>
                      <p className="text-sm text-gray-500">Todos os preços para um valor fixo</p>
                    </div>
                  </div>
                  <Switch 
                    checked={superPromo.isActive} 
                    onCheckedChange={handleToggleSuperPromo}
                    disabled={isUpdatingPromo}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6">
                  {/* Preço da Super Promoção */}
                  <div className="space-y-2">
                    <Label className="font-black text-gray-900">Preço Promocional (R$)</Label>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-600">R$</span>
                      <Input 
                        type="number"
                        step="0.01"
                        value={superPromo.price} 
                        onChange={(e) => setSuperPromo({ ...superPromo, price: parseFloat(e.target.value) })}
                        className="h-14 rounded-2xl border-2 border-gray-100 focus:border-red-400 font-bold"
                      />
                    </div>
                    <p className="text-xs text-gray-500">Todos os produtos de batata terão este preço quando a promoção estiver ativa.</p>
                  </div>

                  {/* Imagem da Super Promoção */}
                  <div className="space-y-2">
                    <Label className="font-black text-gray-900 flex items-center gap-2">
                      <Image className="h-4 w-4 text-red-500" />
                      Imagem do Banner
                    </Label>
                    <div className="space-y-3">
                      {loadingImages ? (
                        <p className="text-sm text-gray-500">Carregando imagens...</p>
                      ) : promoImages.length === 0 ? (
                        <p className="text-sm text-gray-500">Nenhuma imagem de promoção disponível. Faça upload na seção de imagens.</p>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          <button
                            onClick={() => setSuperPromo({ ...superPromo, imageId: undefined })}
                            className={`p-3 rounded-xl border-2 transition-all ${
                              !superPromo.imageId 
                                ? 'border-red-400 bg-red-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="text-center">
                              <p className="text-2xl mb-1">✕</p>
                              <p className="text-xs font-bold text-gray-600">Sem imagem</p>
                            </div>
                          </button>
                          {promoImages.map(image => (
                            <button
                              key={image.id}
                              onClick={() => setSuperPromo({ ...superPromo, imageId: image.id })}
                              className={`p-2 rounded-xl border-2 transition-all overflow-hidden ${
                                superPromo.imageId === image.id 
                                  ? 'border-red-400 ring-2 ring-red-300' 
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <img
                                src={`data:${image.mimeType};base64,${image.data}`}
                                alt={image.name}
                                className="w-full h-16 object-cover rounded"
                              />
                              <p className="text-xs font-bold text-gray-600 mt-1 truncate">{image.name}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Preview da imagem selecionada */}
                  {superPromo.imageId && (
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-gray-600">Preview:</p>
                      <div className="w-full max-w-xs rounded-xl overflow-hidden border-2 border-gray-200">
                        <img
                          src={getImagePreview(superPromo.imageId) || ""}
                          alt="Preview"
                          className="w-full h-auto"
                        />
                      </div>
                    </div>
                  )}

                  {/* Botão de Salvar */}
                  <Button 
                    onClick={handleSaveSuperPromo}
                    disabled={isUpdatingPromo}
                    className="w-full h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-black rounded-2xl gap-2 shadow-lg transition-all"
                  >
                    <Save className="h-5 w-5" /> Salvar Super Promoção
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* ========== PROMOÇÃO DE ITENS ESPECÍFICOS ========== */}
            <Card className="border-none shadow-md bg-white rounded-3xl overflow-hidden border-l-4 border-blue-500">
              <CardHeader className="bg-blue-50 border-b border-blue-100 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${itemPromo.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      <Tag className={`h-6 w-6 ${itemPromo.isActive ? 'fill-current' : ''}`} />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black text-gray-900">Promoção por Item</CardTitle>
                      <p className="text-sm text-gray-500">Selecione itens específicos com preços customizados</p>
                    </div>
                  </div>
                  <Switch 
                    checked={itemPromo.isActive} 
                    onCheckedChange={handleToggleItemPromo}
                    disabled={isUpdatingPromo}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6">
                  {/* Seleção de Produtos */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-black text-gray-900">Selecione os Produtos</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Coluna de Batatas */}
                      <div className="space-y-4">
                        <h4 className="text-base font-black text-gray-900 flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                          Batatas
                        </h4>
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
                        <h4 className="text-base font-black text-gray-900 flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-red-500"></div>
                          Macarrão
                        </h4>
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
                  </div>

                  {/* Preços Promocionais */}
                  {promoProducts.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-black text-gray-900">Preços Promocionais</h3>
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
                                  className="w-32 h-12 rounded-xl border-2 border-gray-100 focus:border-blue-400 font-bold text-lg"
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
                    </div>
                  )}

                  {/* Imagem da Promoção de Itens */}
                  <div className="space-y-2">
                    <Label className="font-black text-gray-900 flex items-center gap-2">
                      <Image className="h-4 w-4 text-blue-500" />
                      Imagem do Banner (Opcional)
                    </Label>
                    <div className="space-y-3">
                      {loadingImages ? (
                        <p className="text-sm text-gray-500">Carregando imagens...</p>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          <button
                            onClick={() => setItemPromo({ ...itemPromo, imageId: undefined })}
                            className={`p-3 rounded-xl border-2 transition-all ${
                              !itemPromo.imageId 
                                ? 'border-blue-400 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="text-center">
                              <p className="text-2xl mb-1">✕</p>
                              <p className="text-xs font-bold text-gray-600">Sem imagem</p>
                            </div>
                          </button>
                          {promoImages.map(image => (
                            <button
                              key={image.id}
                              onClick={() => setItemPromo({ ...itemPromo, imageId: image.id })}
                              className={`p-2 rounded-xl border-2 transition-all overflow-hidden ${
                                itemPromo.imageId === image.id 
                                  ? 'border-blue-400 ring-2 ring-blue-300' 
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <img
                                src={`data:${image.mimeType};base64,${image.data}`}
                                alt={image.name}
                                className="w-full h-16 object-cover rounded"
                              />
                              <p className="text-xs font-bold text-gray-600 mt-1 truncate">{image.name}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Preview da imagem selecionada */}
                  {itemPromo.imageId && (
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-gray-600">Preview:</p>
                      <div className="w-full max-w-xs rounded-xl overflow-hidden border-2 border-gray-200">
                        <img
                          src={getImagePreview(itemPromo.imageId) || ""}
                          alt="Preview"
                          className="w-full h-auto"
                        />
                      </div>
                    </div>
                  )}

                  {/* Botão de Salvar */}
                  <Button 
                    onClick={handleSaveItemPromo}
                    disabled={isUpdatingPromo || promoProducts.length === 0}
                    className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-black rounded-2xl gap-2 shadow-lg transition-all"
                  >
                    <Save className="h-5 w-5" /> Salvar Promoção de Itens
                  </Button>
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
