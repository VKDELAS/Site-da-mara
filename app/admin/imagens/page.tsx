"use client"

import { useEffect, useState } from "react"
import { HeaderWrapper } from "@/components/header-wrapper"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { ArrowLeft, Image, Trash2, Copy, CheckCircle } from "lucide-react"
import { ImageUpload } from "@/components/image-upload"
import { imageUploadManager, UploadedImage } from "@/lib/image-upload-manager"
import Link from "next/link"

const ADMIN_EMAILS = ["enzzobaraldo2008@gmail.com", "maraysis9010@gmail.com"]

export default function AdminImagensPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [images, setImages] = useState<UploadedImage[]>([])
  const [loadingImages, setLoadingImages] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<"product" | "promo" | "general">("product")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
      } else if (user.email && ADMIN_EMAILS.includes(user.email)) {
        setIsAdmin(true)
        loadImages()
      } else {
        alert("Você não tem permissão para acessar esta página")
        router.push("/")
      }
    }
  }, [user, loading, router])

  const loadImages = async () => {
    try {
      setLoadingImages(true)
      const productImages = await imageUploadManager.getImagesByCategory("product")
      const promoImages = await imageUploadManager.getImagesByCategory("promo")
      const generalImages = await imageUploadManager.getImagesByCategory("general")
      
      // Combina todas as imagens
      const allImages = [...productImages, ...promoImages, ...generalImages]
      setImages(allImages)
    } catch (error) {
      console.error("Erro ao carregar imagens:", error)
    } finally {
      setLoadingImages(false)
    }
  }

  const handleImageUpload = (url: string, name: string) => {
    console.log("[AdminImagens] Upload concluído, recarregando lista...");
    loadImages() // Recarrega a lista de imagens
  }

  const handleDeleteImage = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar esta imagem?")) return

    try {
      const success = await imageUploadManager.deleteImage(id)
      if (success) {
        setImages(images.filter(img => img.id !== id))
        alert("Imagem deletada com sucesso!")
      } else {
        alert("Erro ao deletar imagem")
      }
    } catch (error) {
      alert("Erro ao deletar imagem")
    }
  }

  const handleCopyUrl = (id: string) => {
    const url = `/api/images/${id}`
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filteredImages = images.filter(img => img.category === selectedCategory)

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
              <div className="h-14 w-14 bg-gradient-to-br from-purple-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Image className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-black text-gray-900">Gerenciar Imagens</h1>
                <p className="text-gray-500 text-sm md:text-base">Faça upload e gerencie as imagens do seu site</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {/* Upload de Imagens */}
            <Card className="border-none shadow-md bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-purple-50 border-b border-purple-100 p-6">
                <CardTitle className="text-xl font-black text-gray-900">Fazer Upload de Imagem</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-900 mb-3">Categoria</label>
                  <div className="flex gap-3">
                    {(["product", "promo", "general"] as const).map(cat => (
                      <Button
                        key={cat}
                        variant={selectedCategory === cat ? "default" : "outline"}
                        onClick={() => setSelectedCategory(cat)}
                        className={selectedCategory === cat ? "bg-purple-500 hover:bg-purple-600" : ""}
                      >
                        {cat === "product" ? "Produtos" : cat === "promo" ? "Promoções" : "Geral"}
                      </Button>
                    ))}
                  </div>
                </div>
                <ImageUpload
                  onImageUpload={handleImageUpload}
                  category={selectedCategory}
                />
              </CardContent>
            </Card>

            {/* Lista de Imagens */}
            <Card className="border-none shadow-md bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-gray-50 border-b border-gray-100 p-6">
                <CardTitle className="text-xl font-black text-gray-900">
                  Imagens {selectedCategory === "product" ? "de Produtos" : selectedCategory === "promo" ? "de Promoções" : "Gerais"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                {loadingImages ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-semibold">Carregando imagens...</p>
                  </div>
                ) : filteredImages.length === 0 ? (
                  <div className="text-center py-12">
                    <Image className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Nenhuma imagem nesta categoria</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredImages.map(image => (
                      <div
                        key={image.id}
                        className="border-2 border-gray-100 rounded-2xl overflow-hidden hover:border-purple-300 transition-colors"
                      >
                        <img
                          src={`data:${image.mimeType};base64,${image.data}`}
                          alt={image.name}
                          className="w-full h-48 object-cover"
                        />
                        <div className="p-4 space-y-3">
                          <p className="text-sm font-bold text-gray-900 truncate">{image.name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(image.uploadedAt).toLocaleDateString("pt-BR")}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyUrl(image.id)}
                              className="flex-1 text-xs"
                            >
                              {copiedId === image.id ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" /> Copiado
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3 mr-1" /> Copiar URL
                                </>
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteImage(image.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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
