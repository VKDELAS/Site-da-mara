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
  imageUrl?: string
  useUrl?: boolean
}

interface ItemPromo {
  isActive: boolean
  imageId?: string
  imageUrl?: string
  useUrl?: boolean
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
    imageId: undefined,
    imageUrl: undefined,
    useUrl: false
  })
  
  // Promoção de itens específicos
  const [itemPromo, setItemPromo] = useState<ItemPromo>({
    isActive: false,
    imageId: undefined,
    imageUrl: undefined,
    useUrl: false
  })
  
  // Imagens disponíveis
  const [promoImages, setPromoImages] = useState<UploadedImage[]>([])
  const [loadingImages, setLoadingImages] = useState(true)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

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
    } catch (error) {
      console.error("Erro ao carregar produtos:", error)
    } finally {
      setLoadingProducts(false)
    }
  }

  const loadImages = async () => {
    try {
      setLoadingImages(true)
      console.log("[AdminPromocoes] Carregando imagens da categoria 'promo'...")
      const images = await imageUploadManager.getImagesByCategory("promo")
      console.log("[AdminPromocoes] Imagens carregadas:", images.length, images)
      setPromoImages(images)
    } catch (error) {
      console.error("Erro ao carregar imagens:", error)
    } finally {
      setLoadingImages(false)
    }
  }

  const loadPromoStatus = async () => {
    try {
      const status = await storeStatusManager.getStatus()
      console.log("Status carregado:", status)
      
      if (status.superPromo) {
        setSuperPromo({
          ...status.superPromo,
          useUrl: status.superPromo.useUrl ?? false
        })
      }
      if (status.itemPromo) {
        setItemPromo({
          ...status.itemPromo,
          useUrl: status.itemPromo.useUrl ?? false
        })
      }
    } catch (error) {
      console.error("Erro ao carregar status de promoção:", error)
    }
  }

  const handleToggleSuperPromo = async () => {
    const newSuperPromo = { ...superPromo, isActive: !superPromo.isActive }
    setSuperPromo(newSuperPromo)
    
    setIsUpdatingPromo(true)
    try {
      await storeStatusManager.updateSuperPromo(newSuperPromo)
      setSuccessMessage("Super Promoção atualizada!")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Erro ao atualizar Super Promoção:", error)
      alert("Erro ao atualizar Super Promoção")
    } finally {
      setIsUpdatingPromo(false)
    }
  }

  const handleToggleItemPromo = async () => {
    if (promoProducts.length === 0) {
      alert("Selecione pelo menos um produto para a promoção")
      return
    }

    const newItemPromo = { ...itemPromo, isActive: !itemPromo.isActive }
    setItemPromo(newItemPromo)
    
    setIsUpdatingPromo(true)
    try {
      await storeStatusManager.updateItemPromo(newItemPromo)
      await storeStatusManager.updatePromoProducts(promoProducts)
      setSuccessMessage("Promoção de itens atualizada!")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Erro ao atualizar Promoção de Itens:", error)
      alert("Erro ao atualizar Promoção de Itens")
    } finally {
      setIsUpdatingPromo(false)
    }
  }

  const handleSuperPromoPrice = async (newPrice: number) => {
    const newSuperPromo = { ...superPromo, price: newPrice }
    setSuperPromo(newSuperPromo)
    
    try {
      await storeStatusManager.updateSuperPromo(newSuperPromo)
      setSuccessMessage("Preço da Super Promoção atualizado!")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Erro ao atualizar preço:", error)
    }
  }

  const handleSuperPromoImageUpload = async (imageId: string) => {
    const newSuperPromo = { 
      ...superPromo, 
      imageId, 
      imageUrl: undefined,
      useUrl: false
    }
    setSuperPromo(newSuperPromo)
    
    try {
      await storeStatusManager.updateSuperPromo(newSuperPromo)
      setSuccessMessage("Imagem da Super Promoção atualizada!")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Erro ao atualizar imagem:", error)
    }
  }

  const handleSuperPromoImageUrl = async (imageUrl: string) => {
    const newSuperPromo = { 
      ...superPromo, 
      imageUrl, 
      imageId: undefined,
      useUrl: true
    }
    setSuperPromo(newSuperPromo)
    
    try {
      await storeStatusManager.updateSuperPromo(newSuperPromo)
      setSuccessMessage("URL da imagem atualizada!")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Erro ao atualizar URL:", error)
    }
  }

  const handleSuperPromoRemoveImage = async () => {
    const newSuperPromo = { 
      ...superPromo, 
      imageId: undefined,
      imageUrl: undefined,
      useUrl: false
    }
    setSuperPromo(newSuperPromo)
    
    try {
      await storeStatusManager.updateSuperPromo(newSuperPromo)
      setSuccessMessage("Imagem removida!")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Erro ao remover imagem:", error)
    }
  }

  const handleItemPromoImageUpload = async (imageId: string) => {
    const newItemPromo = { 
      ...itemPromo, 
      imageId, 
      imageUrl: undefined,
      useUrl: false
    }
    setItemPromo(newItemPromo)
    
    try {
      await storeStatusManager.updateItemPromo(newItemPromo)
      setSuccessMessage("Imagem da Promoção de Itens atualizada!")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Erro ao atualizar imagem:", error)
    }
  }

  const handleItemPromoImageUrl = async (imageUrl: string) => {
    const newItemPromo = { 
      ...itemPromo, 
      imageUrl, 
      imageId: undefined,
      useUrl: true
    }
    setItemPromo(newItemPromo)
    
    try {
      await storeStatusManager.updateItemPromo(newItemPromo)
      setSuccessMessage("URL da imagem atualizada!")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Erro ao atualizar URL:", error)
    }
  }

  const handleItemPromoRemoveImage = async () => {
    const newItemPromo = { 
      ...itemPromo, 
      imageId: undefined,
      imageUrl: undefined,
      useUrl: false
    }
    setItemPromo(newItemPromo)
    
    try {
      await storeStatusManager.updateItemPromo(newItemPromo)
      setSuccessMessage("Imagem removida!")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Erro ao remover imagem:", error)
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

  const handleSaveItemPromo = async () => {
    if (promoProducts.length === 0) {
      alert("Selecione pelo menos um produto para a promoção")
      return
    }

    setIsUpdatingPromo(true)
    try {
      await storeStatusManager.updatePromoProducts(promoProducts)
      setSuccessMessage("Produtos da promoção salvos com sucesso!")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Erro ao salvar produtos:", error)
      alert("Erro ao salvar produtos")
    } finally {
      setIsUpdatingPromo(false)
    }
  }

  const getBatatas = () => allProducts.filter(p => p.category === "batata")
  const getMacarrao = () => allProducts.filter(p => p.category === "macarrao")

  const getImageUrl = (imageId?: string) => {
    if (!imageId) return undefined;
    const image = promoImages.find(img => img.id === imageId);
    if (!image) return undefined;
    return `data:${image.mimeType};base64,${image.data}`;
  };

  const getImagePreview = (imageId?: string, imageUrl?: string) => {
    // Prioridade 1: URL personalizada
    if (imageUrl) {
      return imageUrl
    }
    
    // Prioridade 2: Imagem de upload
    return getImageUrl(imageId) || null
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

          {/* Mensagem de Sucesso */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
              <div className="h-5 w-5 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">✓</span>
              </div>
              <p className="text-green-700 font-semibold">{successMessage}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-8">
            {/* SUPER PROMOÇÃO - TODAS AS BATATAS */}
            <Card className="border-none shadow-md bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50 border-b border-orange-100 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl flex items-center justify-center">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl font-black text-gray-900">Super Promoção</CardTitle>
                  </div>
                  <Badge className={superPromo.isActive ? "bg-green-500" : "bg-gray-400"}>
                    {superPromo.isActive ? "ATIVA" : "INATIVA"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-700 font-medium">
                    A Super Promoção aplica o mesmo preço a <strong>TODAS as batatas</strong> do cardápio automaticamente. Não é necessário selecionar produtos individuais.
                  </p>
                </div>

                {/* Toggle Super Promoção */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border-2 border-gray-100">
                  <div>
                    <Label className="font-black text-gray-900">Ativar Super Promoção</Label>
                    <p className="text-sm text-gray-500 mt-1">Todos os produtos de batata receberão o preço promocional</p>
                  </div>
                  <Switch
                    checked={superPromo.isActive}
                    onCheckedChange={handleToggleSuperPromo}
                    disabled={isUpdatingPromo}
                  />
                </div>

                {/* Preço da Super Promoção */}
                <div className="space-y-2">
                  <Label className="font-black text-gray-900 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-orange-500" />
                    Preço Promocional (R$)
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-600">R$</span>
                    <Input 
                      type="number" 
                      step="0.01"
                      min="0"
                      value={superPromo.price} 
                      onChange={(e) => handleSuperPromoPrice(parseFloat(e.target.value) || 0)}
                      className="flex-1 h-12 rounded-xl border-2 border-gray-100 focus:border-orange-400 font-bold text-lg"
                    />
                  </div>
                </div>

                {/* Imagem da Super Promoção */}
                <div className="space-y-4">
                  <Label className="font-black text-gray-900 flex items-center gap-2">
                    <Image className="h-4 w-4 text-purple-500" />
                    Imagem do Banner (Opcional)
                  </Label>

                  {/* Abas para escolher tipo de imagem */}
                  <div className="flex gap-2 border-b border-gray-200">
                    <button
                      onClick={() => setSuperPromo({ ...superPromo, useUrl: false })}
                      className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${
                        !superPromo.useUrl
                          ? "border-orange-500 text-orange-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Upload
                    </button>
                    <button
                      onClick={() => setSuperPromo({ ...superPromo, useUrl: true })}
                      className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${
                        superPromo.useUrl
                          ? "border-orange-500 text-orange-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      URL
                    </button>
                  </div>

                  {/* Upload de Imagem */}
                  {!superPromo.useUrl ? (
                    <div className="space-y-3">
                      {loadingImages ? (
                        <p className="text-sm text-gray-500">Carregando imagens...</p>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          <button
                            onClick={() => handleSuperPromoRemoveImage()}
                            className={`p-3 rounded-xl border-2 transition-all ${
                              !superPromo.imageId
                                ? "border-orange-400 bg-orange-50"
                                : "border-gray-200 hover:border-gray-300"
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
                              onClick={() => handleSuperPromoImageUpload(image.id)}
                              className={`p-2 rounded-xl border-2 transition-all overflow-hidden ${
                                superPromo.imageId === image.id
                                  ? "border-orange-400 ring-2 ring-orange-300"
                                  : "border-gray-200 hover:border-gray-300"
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
                  ) : (
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-gray-600">URL da Imagem</Label>
                      <Input 
                        type="text"
                        placeholder="Ex: /images/promo-batatop.png ou https://..."
                        value={superPromo.imageUrl || ""}
                        onChange={(e) => handleSuperPromoImageUrl(e.target.value)}
                        className="w-full h-11 rounded-xl border-2 border-gray-100 focus:border-orange-400"
                      />
                      <p className="text-xs text-gray-500">Você pode usar URLs da pasta public (ex: /images/...) ou URLs externas</p>
                    </div>
                  )}

                  {/* Preview da imagem selecionada */}
                  {getImagePreview(superPromo.imageId, superPromo.imageUrl) && (
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-gray-600">Preview:</p>
                      <div className="w-full max-w-xs rounded-xl overflow-hidden border-2 border-gray-200">
                        <img
                          src={getImagePreview(superPromo.imageId, superPromo.imageUrl) || ""}
                          alt="Preview"
                          className="w-full h-auto"
                          onError={(e) => {
                            e.currentTarget.style.display = "none"
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* PROMOÇÃO DE ITENS ESPECÍFICOS */}
            <Card className="border-none shadow-md bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center">
                      <Tag className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl font-black text-gray-900">Promoção de Itens</CardTitle>
                  </div>
                  <Badge className={itemPromo.isActive ? "bg-green-500" : "bg-gray-400"}>
                    {itemPromo.isActive ? "ATIVA" : "INATIVA"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-700 font-medium">
                    Selecione produtos específicos para aplicar preços promocionais individuais. Você pode escolher quantos produtos quiser.
                  </p>
                </div>

                {/* Toggle Promoção de Itens */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border-2 border-gray-100">
                  <div>
                    <Label className="font-black text-gray-900">Ativar Promoção de Itens</Label>
                    <p className="text-sm text-gray-500 mt-1">Aplica preços especiais aos produtos selecionados</p>
                  </div>
                  <Switch
                    checked={itemPromo.isActive}
                    onCheckedChange={handleToggleItemPromo}
                    disabled={isUpdatingPromo || promoProducts.length === 0}
                  />
                </div>

                {/* Seleção de Produtos */}
                <div className="space-y-4">
                  <h3 className="text-lg font-black text-gray-900">Selecione Produtos</h3>
                  
                  {/* Batatas */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-700 text-sm">Batatas Recheadas</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {getBatatas().map(product => (
                        <div 
                          key={product.id}
                          className="p-4 border-2 border-gray-100 rounded-2xl hover:border-blue-300 transition-colors"
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

                  {/* Macarrão */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-700 text-sm">Macarrão</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {getMacarrao().map(product => (
                        <div 
                          key={product.id}
                          className="p-4 border-2 border-gray-100 rounded-2xl hover:border-blue-300 transition-colors"
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
                                min="0"
                                value={promo.promoPrice} 
                                onChange={(e) => handleUpdatePromoPrice(promo.productId, parseFloat(e.target.value) || 0)}
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
                <div className="space-y-4">
                  <Label className="font-black text-gray-900 flex items-center gap-2">
                    <Image className="h-4 w-4 text-blue-500" />
                    Imagem do Banner (Opcional)
                  </Label>

                  {/* Abas para escolher tipo de imagem */}
                  <div className="flex gap-2 border-b border-gray-200">
                    <button
                      onClick={() => setItemPromo({ ...itemPromo, useUrl: false })}
                      className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${
                        !itemPromo.useUrl
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Upload
                    </button>
                    <button
                      onClick={() => setItemPromo({ ...itemPromo, useUrl: true })}
                      className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${
                        itemPromo.useUrl
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      URL
                    </button>
                  </div>

                  {/* Upload de Imagem */}
                  {!itemPromo.useUrl ? (
                    <div className="space-y-3">
                      {loadingImages ? (
                        <p className="text-sm text-gray-500">Carregando imagens...</p>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          <button
                            onClick={() => handleItemPromoRemoveImage()}
                            className={`p-3 rounded-xl border-2 transition-all ${
                              !itemPromo.imageId
                                ? "border-blue-400 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
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
                              onClick={() => handleItemPromoImageUpload(image.id)}
                              className={`p-2 rounded-xl border-2 transition-all overflow-hidden ${
                                itemPromo.imageId === image.id
                                  ? "border-blue-400 ring-2 ring-blue-300"
                                  : "border-gray-200 hover:border-gray-300"
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
                  ) : (
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-gray-600">URL da Imagem</Label>
                      <Input 
                        type="text"
                        placeholder="Ex: /images/promo.png ou https://..."
                        value={itemPromo.imageUrl || ""}
                        onChange={(e) => handleItemPromoImageUrl(e.target.value)}
                        className="w-full h-11 rounded-xl border-2 border-gray-100 focus:border-blue-400"
                      />
                      <p className="text-xs text-gray-500">Você pode usar URLs da pasta public (ex: /images/...) ou URLs externas</p>
                    </div>
                  )}

                  {/* Preview da imagem selecionada */}
                  {getImagePreview(itemPromo.imageId, itemPromo.imageUrl) && (
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-gray-600">Preview:</p>
                      <div className="w-full max-w-xs rounded-xl overflow-hidden border-2 border-gray-200">
                        <img
                          src={getImagePreview(itemPromo.imageId, itemPromo.imageUrl) || ""}
                          alt="Preview"
                          className="w-full h-auto"
                          onError={(e) => {
                            e.currentTarget.style.display = "none"
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Botão de Salvar */}
                {promoProducts.length > 0 && (
                  <Button 
                    onClick={handleSaveItemPromo}
                    disabled={isUpdatingPromo}
                    className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-black rounded-2xl gap-2 shadow-lg transition-all"
                  >
                    <Save className="h-5 w-5" /> Salvar Configurações dos Itens
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
