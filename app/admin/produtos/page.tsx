"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { HeaderWrapper } from "@/components/header-wrapper"
import { Footer } from "@/components/footer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Edit, Plus, Trash2, Package, Coffee, UtensilsCrossed, Zap, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { productsManager, type Product, type Adicional } from "@/lib/products-db"
import { adicionaisManager } from "@/lib/adicionais-manager"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

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
                      <span key={a.id} className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-yellow-200">
                        {a.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => handleOpenDialog(product)}
                  variant="outline"
                  size="sm"
                  className="flex-1 border-2 border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg gap-1"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
                <Button
                  onClick={() => handleDeleteProduct(product.id)}
                  variant="outline"
                  size="sm"
                  className="flex-1 border-2 border-red-200 text-red-600 hover:bg-red-50 rounded-lg gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
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

            <div className="flex items-center gap-4 mb-8">
              <div className="h-14 w-14 bg-gradient-to-br from-red-400 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Package className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-gray-900">Gerenciar Produtos</h1>
                <p className="text-gray-500 text-sm md:text-base">Adicione, edite ou remova itens do cardápio</p>
              </div>
            </div>
          </div>

          {/* Adicionais Globais */}
          <Card className="mb-8 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white rounded-3xl shadow-md">
            <CardHeader className="pb-4 border-b border-purple-100">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl font-black">
                    <Zap className="h-5 w-5 text-purple-600" />
                    Adicionais Globais ({adicionais.length})
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Gerenciar adicionais disponíveis para todos os produtos</p>
                </div>
                <Dialog open={isAdicionalDialogOpen} onOpenChange={setIsAdicionalDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => handleOpenAdicionalDialog()} className="bg-gradient-to-r from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600 text-white font-bold rounded-xl gap-2">
                      <Plus className="h-4 w-4" />
                      Novo Adicional
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md rounded-3xl">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black">{editingAdicional ? "Editar Adicional" : "Novo Adicional"}</DialogTitle>
                      <DialogDescription>
                        {editingAdicional ? "Edite as informações do adicional" : "Adicione um novo adicional ao catálogo"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="adicional-name" className="font-bold">Nome</Label>
                        <Input
                          id="adicional-name"
                          value={formAdicionalName}
                          onChange={(e) => setFormAdicionalName(e.target.value)}
                          placeholder="Ex: Catupiry"
                          className="h-11 border-2 rounded-xl"
                        />
                      </div>
                      <div>
                        <Label htmlFor="adicional-price" className="font-bold">Preço (R$)</Label>
                        <Input
                          id="adicional-price"
                          type="number"
                          step="0.01"
                          value={formAdicionalPrice}
                          onChange={(e) => setFormAdicionalPrice(e.target.value)}
                          placeholder="Ex: 3.00"
                          className="h-11 border-2 rounded-xl"
                        />
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={handleSaveAdicional}
                          className="flex-1 bg-gradient-to-r from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600 text-white font-bold rounded-xl h-11"
                        >
                          {editingAdicional ? "Atualizar" : "Adicionar"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsAdicionalDialogOpen(false)}
                          className="flex-1 border-2 rounded-xl font-bold"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {adicionais.length === 0 ? (
                <p className="text-gray-600 text-center py-8">Nenhum adicional cadastrado</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {adicionais.map((adicional) => (
                    <div key={adicional.id} className="flex items-center justify-between p-3 bg-white border-2 border-purple-100 rounded-xl">
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">{adicional.name}</p>
                        <p className="text-sm text-purple-600 font-semibold">R$ {adicional.price.toFixed(2)}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          onClick={() => handleOpenAdicionalDialog(adicional)}
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteAdicional(adicional.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Produtos por Categoria */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-white border-2 border-gray-200 rounded-2xl p-1">
              <TabsTrigger
                value="batata"
                className="rounded-xl font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-400 data-[state=active]:to-yellow-500 data-[state=active]:text-white"
              >
                Batatas ({batatas.length})
              </TabsTrigger>
              <TabsTrigger
                value="macarrao"
                className="rounded-xl font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:to-orange-500 data-[state=active]:text-white"
              >
                Macarrão ({macarrao.length})
              </TabsTrigger>
              <TabsTrigger
                value="bebida"
                className="rounded-xl font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-400 data-[state=active]:to-blue-500 data-[state=active]:text-white"
              >
                Bebidas ({bebidas.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="batata" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-black text-gray-900">Batatas Recheadas</h2>
                <Dialog open={isDialogOpen && formCategory === "batata"} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setFormCategory("batata")
                        handleOpenDialog()
                      }}
                      className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-bold rounded-xl gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Novo Produto
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black">{editingProduct ? "Editar Produto" : "Novo Produto"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <Label className="font-bold">Nome do Produto</Label>
                          <Input
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            placeholder="Ex: Batata Recheada Premium"
                            className="h-11 border-2 rounded-xl"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="font-bold">Descrição</Label>
                          <Textarea
                            value={formDescription}
                            onChange={(e) => setFormDescription(e.target.value)}
                            placeholder="Descreva o produto..."
                            className="border-2 rounded-xl"
                          />
                        </div>
                        <div>
                          <Label className="font-bold">Preço (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formPrice}
                            onChange={(e) => setFormPrice(e.target.value)}
                            placeholder="0.00"
                            className="h-11 border-2 rounded-xl"
                          />
                        </div>
                        <div>
                          <Label className="font-bold">URL da Imagem</Label>
                          <Input
                            value={formImage}
                            onChange={(e) => setFormImage(e.target.value)}
                            placeholder="https://..."
                            className="h-11 border-2 rounded-xl"
                          />
                        </div>
                      </div>

                      {adicionais.length > 0 && (
                        <div className="border-t pt-4">
                          <Label className="font-bold mb-3 block">Adicionais Disponíveis</Label>
                          <div className="space-y-2">
                            {adicionais.map((adicional) => (
                              <div key={adicional.id} className="flex items-center gap-3">
                                <Checkbox
                                  checked={selectedAdicionais.includes(adicional.id)}
                                  onCheckedChange={() => toggleAdicional(adicional.id)}
                                  className="w-5 h-5 rounded"
                                />
                                <label className="flex-1 cursor-pointer">
                                  <span className="font-semibold text-gray-900">{adicional.name}</span>
                                  <span className="text-sm text-gray-600 ml-2">R$ {adicional.price.toFixed(2)}</span>
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-4 border-t">
                        <Button
                          type="submit"
                          className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-bold rounded-xl h-11"
                        >
                          {editingProduct ? "Atualizar" : "Criar"} Produto
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                          className="flex-1 border-2 rounded-xl font-bold"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              {renderProductGrid(batatas)}
            </TabsContent>

            <TabsContent value="macarrao" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-black text-gray-900">Macarrão</h2>
                <Dialog open={isDialogOpen && formCategory === "macarrao"} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setFormCategory("macarrao")
                        handleOpenDialog()
                      }}
                      className="bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-bold rounded-xl gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Novo Produto
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black">{editingProduct ? "Editar Produto" : "Novo Produto"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <Label className="font-bold">Nome do Produto</Label>
                          <Input
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            placeholder="Ex: Macarrão Premium"
                            className="h-11 border-2 rounded-xl"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="font-bold">Descrição</Label>
                          <Textarea
                            value={formDescription}
                            onChange={(e) => setFormDescription(e.target.value)}
                            placeholder="Descreva o produto..."
                            className="border-2 rounded-xl"
                          />
                        </div>
                        <div>
                          <Label className="font-bold">Preço (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formPrice}
                            onChange={(e) => setFormPrice(e.target.value)}
                            placeholder="0.00"
                            className="h-11 border-2 rounded-xl"
                          />
                        </div>
                        <div>
                          <Label className="font-bold">URL da Imagem</Label>
                          <Input
                            value={formImage}
                            onChange={(e) => setFormImage(e.target.value)}
                            placeholder="https://..."
                            className="h-11 border-2 rounded-xl"
                          />
                        </div>
                      </div>

                      {adicionais.length > 0 && (
                        <div className="border-t pt-4">
                          <Label className="font-bold mb-3 block">Adicionais Disponíveis</Label>
                          <div className="space-y-2">
                            {adicionais.map((adicional) => (
                              <div key={adicional.id} className="flex items-center gap-3">
                                <Checkbox
                                  checked={selectedAdicionais.includes(adicional.id)}
                                  onCheckedChange={() => toggleAdicional(adicional.id)}
                                  className="w-5 h-5 rounded"
                                />
                                <label className="flex-1 cursor-pointer">
                                  <span className="font-semibold text-gray-900">{adicional.name}</span>
                                  <span className="text-sm text-gray-600 ml-2">R$ {adicional.price.toFixed(2)}</span>
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-4 border-t">
                        <Button
                          type="submit"
                          className="flex-1 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-bold rounded-xl h-11"
                        >
                          {editingProduct ? "Atualizar" : "Criar"} Produto
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                          className="flex-1 border-2 rounded-xl font-bold"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              {renderProductGrid(macarrao)}
            </TabsContent>

            <TabsContent value="bebida" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-black text-gray-900">Bebidas</h2>
                <Dialog open={isDialogOpen && formCategory === "bebida"} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setFormCategory("bebida")
                        handleOpenDialog()
                      }}
                      className="bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-xl gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Nova Bebida
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black">{editingProduct ? "Editar Bebida" : "Nova Bebida"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <Label className="font-bold">Nome da Bebida</Label>
                          <Input
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            placeholder="Ex: Refrigerante 2L"
                            className="h-11 border-2 rounded-xl"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="font-bold">Descrição</Label>
                          <Textarea
                            value={formDescription}
                            onChange={(e) => setFormDescription(e.target.value)}
                            placeholder="Descreva a bebida..."
                            className="border-2 rounded-xl"
                          />
                        </div>
                        <div>
                          <Label className="font-bold">Preço (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formPrice}
                            onChange={(e) => setFormPrice(e.target.value)}
                            placeholder="0.00"
                            className="h-11 border-2 rounded-xl"
                          />
                        </div>
                        <div>
                          <Label className="font-bold">URL da Imagem</Label>
                          <Input
                            value={formImage}
                            onChange={(e) => setFormImage(e.target.value)}
                            placeholder="https://..."
                            className="h-11 border-2 rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4 border-t">
                        <Button
                          type="submit"
                          className="flex-1 bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-xl h-11"
                        >
                          {editingProduct ? "Atualizar" : "Criar"} Bebida
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                          className="flex-1 border-2 rounded-xl font-bold"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              {renderProductGrid(bebidas)}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  )
}
