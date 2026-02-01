"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { HeaderWrapper } from "@/components/header-wrapper"
import { Footer } from "@/components/footer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Edit, Plus, Trash2, Package, Coffee, UtensilsCrossed, Zap, Eye, EyeOff, Tag, Megaphone, Settings2, Image } from "lucide-react"
import Link from "next/link"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { productsManager, type Product, type Adicional } from "@/lib/products-db"
import { adicionaisManager } from "@/lib/adicionais-manager"
import { storeStatusManager } from "@/lib/store-status-manager"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"

const ADMIN_EMAILS = ["enzzobaraldo2008@gmail.com", "maraysis9010@gmail.com"]

const categoryIcons = {
  batata: { icon: Package, color: "from-yellow-400 to-yellow-500", label: "Batatas Recheadas" },
  macarrao: { icon: UtensilsCrossed, color: "from-orange-400 to-orange-500", label: "Macarrão" },
  bebida: { icon: Coffee, color: "from-blue-400 to-blue-500", label: "Bebidas" },
}

export default function AdminProdutosPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [adicionais, setAdicionais] = useState<Adicional[]>([])
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingAdicional, setEditingAdicional] = useState<Adicional | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAdicionalDialogOpen, setIsAdicionalDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("batata")

  // Promo states
  const [isPromoActive, setIsPromoActive] = useState(false)
  const [promoPrice, setPromoPrice] = useState("24.99")
  const [promoImage, setPromoImage] = useState("/images/promo-batatop.png")
  const [isUpdatingPromo, setIsUpdatingPromo] = useState(false)

  // Form states for products
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formPrice, setFormPrice] = useState("")
  const [formImage, setFormImage] = useState("")
  const [formCategory, setFormCategory] = useState<"batata" | "bebida" | "macarrao">("batata")
  const [selectedAdicionais, setSelectedAdicionais] = useState<string[]>([])

  // Form states for adicionais
  const [formAdicionalName, setFormAdicionalName] = useState("")
  const [formAdicionalPrice, setFormAdicionalPrice] = useState("")

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
      } else if (user.email && ADMIN_EMAILS.includes(user.email)) {
        setIsAdmin(true)
        loadProducts()
        loadAdicionais()
        loadPromoStatus()
      } else {
        router.push("/")
      }
    }
  }, [user, loading, router])

  const loadProducts = async () => {
    const allProducts = await productsManager.getProducts()
    setProducts(allProducts)
  }

  const loadAdicionais = async () => {
    const allAdicionais = await adicionaisManager.getAllAdicionais()
    setAdicionais(allAdicionais)
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

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setFormName(product.name)
      setFormDescription(product.description)
      setFormPrice(product.price.toString())
      setFormImage(product.image)
      setFormCategory(product.category)
      setSelectedAdicionais(product.adicionais?.map((a) => a.id) || [])
    } else {
      setEditingProduct(null)
      setFormName("")
      setFormDescription("")
      setFormPrice("")
      setFormImage("")
      setFormCategory("batata")
      setSelectedAdicionais([])
    }
    setIsDialogOpen(true)
  }

  const handleOpenAdicionalDialog = (adicional?: Adicional) => {
    if (adicional) {
      setEditingAdicional(adicional)
      setFormAdicionalName(adicional.name)
      setFormAdicionalPrice(adicional.price.toString())
    } else {
      setEditingAdicional(null)
      setFormAdicionalName("")
      setFormAdicionalPrice("")
    }
    setIsAdicionalDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const price = Number.parseFloat(formPrice)
    if (Number.isNaN(price) || price <= 0) {
      alert("Preço inválido")
      return
    }

    const productAdicionais = adicionais.filter((a) => selectedAdicionais.includes(a.id))

    if (editingProduct) {
      const updated = await productsManager.updateProduct(editingProduct.id, {
        name: formName,
        description: formDescription,
        price,
        image: formImage || "/placeholder.svg?height=300&width=300&query=" + formName,
        category: formCategory,
      })
      
      if (updated) {
        await productsManager.setProductAdicionais(editingProduct.id, selectedAdicionais)
      }
    } else {
      const created = await productsManager.createProduct({
        name: formName,
        description: formDescription,
        price,
        image: formImage || "/placeholder.svg?height=300&width=300&query=" + formName,
        category: formCategory,
        available: true,
      })
      
      if (created) {
        await productsManager.setProductAdicionais(created.id, selectedAdicionais)
      }
    }

    loadProducts()
    setIsDialogOpen(false)
  }

  const handleSaveAdicional = async () => {
    if (!formAdicionalName || !formAdicionalPrice) {
      alert("Preencha todos os campos obrigatórios")
      return
    }

    const price = Number.parseFloat(formAdicionalPrice)
    if (isNaN(price) || price <= 0) {
      alert("Preço inválido")
      return
    }

    if (editingAdicional) {
      await adicionaisManager.updateAdicional(editingAdicional.id, {
        name: formAdicionalName,
        price,
      })
    } else {
      await adicionaisManager.addAdicional({
        name: formAdicionalName,
        price,
      })
    }

    await loadAdicionais()
    setIsAdicionalDialogOpen(false)
  }

  const handleDeleteProduct = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      await productsManager.deleteProduct(id)
      loadProducts()
    }
  }

  const handleDeleteAdicional = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este adicional?")) {
      await adicionaisManager.deleteAdicional(id)
      await loadAdicionais()
    }
  }

  const handleToggleAvailability = async (product: Product) => {
    await productsManager.updateProduct(product.id, {
      available: !product.available,
    })
    loadProducts()
  }

  const toggleAdicional = (adicionalId: string) => {
    setSelectedAdicionais((prev) =>
      prev.includes(adicionalId) ? prev.filter((id) => id !== adicionalId) : [...prev, adicionalId],
    )
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

  const batatas = products.filter((p) => p.category === "batata")
  const macarrao = products.filter((p) => p.category === "macarrao")
  const bebidas = products.filter((p) => p.category === "bebida")

  const renderProductGrid = (items: Product[]) => {
    if (items.length === 0) {
      return (
        <Card className="border-2 border-dashed border-gray-200 rounded-3xl">
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-semibold">Nenhum produto nesta categoria</p>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((product) => (
          <Card key={product.id} className="border-2 border-gray-100 rounded-2xl shadow-md hover:shadow-lg transition-all overflow-hidden">
            <div className="relative h-40 bg-gray-100 overflow-hidden">
              <img
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => handleToggleAvailability(product)}
                className={`absolute top-3 right-3 p-2 rounded-lg font-bold text-sm gap-1 flex items-center transition-all ${
                  product.available
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-red-100 text-red-700 hover:bg-red-200"
                }`}
              >
                {product.available ? (
                  <>
                    <Eye className="h-4 w-4" />
                    Ativo
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4" />
                    Inativo
                  </>
                )}
              </button>
            </div>

            <CardContent className="p-4">
              <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>

              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-black text-yellow-600">R$ {product.price.toFixed(2)}</span>
              </div>

              {product.adicionais && product.adicionais.length > 0 && (
                <div className="mb-4 pb-4 border-t border-gray-100 pt-3">
                  <p className="text-xs font-bold text-gray-600 mb-2">Adicionais vinculados:</p>
                  <div className="flex flex-wrap gap-1">
                    {product.adicionais.map((a) => (
                      <span key={a.id} className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-full font-medium">
                        {a.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl border-2 border-gray-100 hover:bg-gray-50 font-bold text-gray-700"
                  onClick={() => handleOpenDialog(product)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl border-2 border-red-50 hover:bg-red-50 text-red-500 hover:text-red-600"
                  onClick={() => handleDeleteProduct(product.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderWrapper />

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-yellow-600 transition-colors mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar ao Painel
            </Link>
            <h1 className="text-3xl font-black text-gray-900">Gerenciar Cardápio</h1>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => handleOpenAdicionalDialog()}
              variant="outline"
              className="bg-white border-2 border-yellow-100 hover:bg-yellow-50 text-yellow-700 font-bold rounded-2xl px-6 h-12"
            >
              <Plus className="h-5 w-5 mr-2" />
              Novo Adicional
            </Button>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-black rounded-2xl px-6 h-12 shadow-lg shadow-yellow-100"
            >
              <Plus className="h-5 w-5 mr-2" />
              Novo Produto
            </Button>
          </div>
        </div>

        {/* SEÇÃO DE PROMOÇÃO ESTILO IFOOD */}
        <Card className="mb-8 border-2 border-yellow-400 bg-yellow-50/50 overflow-hidden rounded-3xl shadow-xl shadow-yellow-100">
          <div className="bg-yellow-400 p-4 flex items-center gap-3">
            <Megaphone className="h-6 w-6 text-gray-900 animate-bounce" />
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Sistema de Promoção Relâmpago</h2>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white rounded-2xl border-2 border-yellow-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${isPromoActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      <Zap className={`h-6 w-6 ${isPromoActive ? 'fill-current' : ''}`} />
                    </div>
                    <div>
                      <p className="font-black text-gray-900">Status da Promoção</p>
                      <p className="text-sm text-gray-500">{isPromoActive ? 'Ativa no site agora!' : 'Desativada no momento'}</p>
                    </div>
                  </div>
                  <Switch 
                    checked={isPromoActive} 
                    onCheckedChange={handleTogglePromo}
                    disabled={isUpdatingPromo}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>

                <div className="flex flex-col gap-4 p-4 bg-white rounded-2xl border-2 border-yellow-100 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-black text-gray-900 flex items-center gap-2">
                        <Tag className="h-4 w-4 text-yellow-600" />
                        Preço Promocional (Batatas)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">R$</span>
                        <Input 
                          type="number" 
                          value={promoPrice} 
                          onChange={(e) => setPromoPrice(e.target.value)}
                          className="pl-12 h-12 rounded-xl border-2 border-gray-100 focus:border-yellow-400 font-bold text-lg"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black text-gray-900 flex items-center gap-2">
                        <Image className="h-4 w-4 text-yellow-600" />
                        Caminho da Imagem
                      </Label>
                      <Input 
                        value={promoImage} 
                        onChange={(e) => setPromoImage(e.target.value)}
                        placeholder="/images/promo-batatop.png"
                        className="h-12 rounded-xl border-2 border-gray-100 focus:border-yellow-400 font-bold"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleUpdatePromoSettings}
                    disabled={isUpdatingPromo}
                    className="h-12 bg-gray-900 hover:bg-black text-white font-black rounded-xl px-8"
                  >
                    Salvar Configurações da Promoção
                  </Button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border-2 border-yellow-100 shadow-sm flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Settings2 className="h-8 w-8 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-lg">Como funciona?</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mt-2">
                    Ao ativar a promoção, <strong>todas as batatas</strong> do cardápio passarão a custar o preço definido acima. 
                    Além disso, o banner promocional será exibido automaticamente na página inicial para atrair mais clientes!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="batata" className="space-y-6" onValueChange={setActiveTab}>
          <TabsList className="bg-white p-1 rounded-2xl border-2 border-gray-100 h-auto flex flex-wrap gap-1">
            {Object.entries(categoryIcons).map(([key, { icon: Icon, label, color }]) => (
              <TabsTrigger
                key={key}
                value={key}
                className={`flex-1 min-w-[140px] rounded-xl py-3 font-bold transition-all data-[state=active]:bg-yellow-500 data-[state=active]:text-gray-900`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {label}
              </TabsTrigger>
            ))}
            <TabsTrigger
              value="adicionais"
              className="flex-1 min-w-[140px] rounded-xl py-3 font-bold transition-all data-[state=active]:bg-gray-900 data-[state=active]:text-white"
            >
              <Plus className="h-5 w-5 mr-2" />
              Adicionais
            </TabsTrigger>
          </TabsList>

          <TabsContent value="batata" className="mt-0">
            {renderProductGrid(batatas)}
          </TabsContent>

          <TabsContent value="macarrao" className="mt-0">
            {renderProductGrid(macarrao)}
          </TabsContent>

          <TabsContent value="bebida" className="mt-0">
            {renderProductGrid(bebidas)}
          </TabsContent>

          <TabsContent value="adicionais" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {adicionais.map((adicional) => (
                <Card key={adicional.id} className="border-2 border-gray-100 rounded-2xl shadow-md">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-gray-900">{adicional.name}</h3>
                        <p className="text-lg font-black text-yellow-600">R$ {adicional.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 rounded-lg border-2 border-gray-100 font-bold"
                        onClick={() => handleOpenAdicionalDialog(adicional)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg border-2 border-red-50 text-red-500"
                        onClick={() => handleDeleteAdicional(adicional.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />

      {/* Dialog para Produtos */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">{editingProduct ? "Editar Produto" : "Novo Produto"}</DialogTitle>
            <DialogDescription>Preencha as informações do produto abaixo.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-bold">Nome do Produto</Label>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Strogonoff de Alcatra"
                    className="rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-bold">Categoria</Label>
                  <Select value={formCategory} onValueChange={(val: any) => setFormCategory(val)}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="batata">Batata Recheada</SelectItem>
                      <SelectItem value="macarrao">Macarrão</SelectItem>
                      <SelectItem value="bebida">Bebida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="font-bold">Preço Base (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="0.00"
                    className="rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-bold">URL da Imagem</Label>
                  <Input
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    placeholder="/products/nome-da-imagem.jpg"
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-bold">Descrição</Label>
                  <Textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Descreva os ingredientes..."
                    className="rounded-xl h-[120px]"
                  />
                </div>
              </div>
            </div>

            {formCategory !== "bebida" && (
              <div className="space-y-3">
                <Label className="font-bold">Adicionais Disponíveis</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-2xl border-2 border-gray-100">
                  {adicionais.map((adicional) => (
                    <div key={adicional.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`adicional-${adicional.id}`}
                        checked={selectedAdicionais.includes(adicional.id)}
                        onCheckedChange={() => toggleAdicional(adicional.id)}
                      />
                      <label
                        htmlFor={`adicional-${adicional.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {adicional.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl font-bold">
                Cancelar
              </Button>
              <Button type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-black rounded-xl px-8">
                {editingProduct ? "Salvar Alterações" : "Criar Produto"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para Adicionais */}
      <Dialog open={isAdicionalDialogOpen} onOpenChange={setIsAdicionalDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">{editingAdicional ? "Editar Adicional" : "Novo Adicional"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="font-bold">Nome do Adicional</Label>
              <Input
                value={formAdicionalName}
                onChange={(e) => setFormAdicionalName(e.target.value)}
                placeholder="Ex: Bacon Extra"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-bold">Preço (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={formAdicionalPrice}
                onChange={(e) => setFormAdicionalPrice(e.target.value)}
                placeholder="0.00"
                className="rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAdicionalDialogOpen(false)} className="rounded-xl font-bold">
                Cancelar
              </Button>
              <Button onClick={handleSaveAdicional} className="bg-gray-900 hover:bg-black text-white font-black rounded-xl px-8">
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
