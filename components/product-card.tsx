"use client"

import { useState } from "react"
import { Plus, Trophy, Medal, Star } from "lucide-react"
import { AddToCartDialog } from "@/components/add-to-cart-dialog"
import { useCart } from "@/lib/cart-context"
import { useToast } from "@/hooks/use-toast"

interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  category?: "batata" | "bebida" | "macarrao"
}

interface ProductCardProps {
  product: Product
  rank?: 1 | 2 | 3 | null
  isMostRequested?: boolean
}

export function ProductCard({ product, rank = null, isMostRequested = false }: ProductCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [imageError, setImageError] = useState(false)
  const { addItem } = useCart()
  const { toast } = useToast()

  const handleAddClick = () => {
    if (product.category === "bebida") {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1,
        category: "bebida",
        adicionais: [],
      })
      toast({
        title: "Adicionado ao carrinho!",
        description: `${product.name} foi adicionado ao seu carrinho.`,
      })
      
      // Redirecionar para o cardápio se estiver na home
      if (window.location.pathname === "/") {
        window.location.href = "/cardapio"
      }
    } else {
      setDialogOpen(true)
    }
  }

  const getImageUrl = () => {
    if (!product.image) return ""
    if (product.image.startsWith("http")) return product.image
    if (product.image.startsWith("/")) return product.image
    return `/${product.image}`
  }

  const imageUrl = imageError ? "" : getImageUrl()

  // Configurações visuais do ranking (TROFÉUS RESTAURADOS)
  const rankConfig = {
    1: { 
      icon: <Trophy className="h-6 w-6 text-gray-900" />, 
      label: "Nº1", 
      color: "bg-yellow-500", 
      shadow: "shadow-yellow-200",
      border: "border-yellow-400"
    },
    2: { 
      icon: <Medal className="h-6 w-6 text-gray-700" />, 
      label: "Nº2", 
      color: "bg-gray-200", 
      shadow: "shadow-gray-100",
      border: "border-gray-300"
    },
    3: { 
      icon: <Star className="h-6 w-6 text-orange-700" />, 
      label: "Nº3", 
      color: "bg-orange-200", 
      shadow: "shadow-orange-100",
      border: "border-orange-300"
    }
  }

  const currentRank = rank ? rankConfig[rank] : null

  return (
    <>
      <div 
        onClick={handleAddClick}
        className={`relative bg-white rounded-3xl overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group border ${
          currentRank ? `${currentRank.border} shadow-lg ${currentRank.shadow}` : "border-gray-100 hover:border-yellow-200"
        }`}
      >
        {/* SELO DE RANKING (TROFÉU) */}
        {currentRank && (
          <div className={`absolute top-3 left-3 z-20 flex items-center justify-center w-14 h-14 ${currentRank.color} rounded-full shadow-lg ${rank === 1 ? 'animate-pulse ring-4 ring-yellow-400/50' : ''}`}>
            <div className="text-center">
              <div className="flex justify-center">{currentRank.icon}</div>
              <div className="text-[10px] font-black text-gray-900 leading-none mt-0.5">{currentRank.label}</div>
            </div>
          </div>
        )}

        {/* DESTAQUE "MAIS PEDIDA" EM DOURADO */}
        {rank === 1 && (
          <div className="absolute top-3 right-3 z-20">
            <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-gray-900 text-[10px] font-black px-3 py-1.5 rounded-full shadow-xl border border-yellow-300 flex items-center gap-1 animate-bounce">
              <Star className="h-3 w-3 fill-current" />
              <span>MAIS PEDIDA</span>
              <Trophy className="h-3 w-3 fill-current" />
            </div>
          </div>
        )}

        {/* IMAGEM DO PRODUTO */}
        <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-yellow-50 to-orange-50">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 rounded-t-3xl"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-gray-300 text-4xl">🍽️</div>
            </div>
          )}
          
          {product.category && !rank && (
            <div className="absolute top-3 left-3">
              <span className="bg-white/95 backdrop-blur-sm text-gray-700 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                {product.category === "batata"
                  ? "Batata"
                  : product.category === "macarrao"
                    ? "Macarrão"
                    : "Bebida"}
              </span>
            </div>
          )}
        </div>

        {/* CONTEÚDO DO CARD */}
        <div className="p-4">
          <h3 className="font-bold text-base text-gray-800 mb-1 line-clamp-2 leading-tight">
            {product.name}
          </h3>

          <p className="text-sm text-gray-500 mb-3 line-clamp-2 leading-snug">
            {product.description}
          </p>

          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <div className="text-xl font-black text-gray-800">
                R$ {product.price.toFixed(2).replace('.', ',')}
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation()
                handleAddClick()
              }}
              className={`${
                rank === 1 
                  ? "bg-yellow-500 hover:bg-yellow-600" 
                  : "bg-yellow-400 hover:bg-yellow-500"
              } text-gray-900 font-bold px-4 py-2.5 rounded-full shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 group-hover:scale-105`}
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm">Adicionar</span>
            </button>
          </div>
        </div>
      </div>

      {(product.category === "batata" || product.category === "macarrao") && (
        <AddToCartDialog product={product} open={dialogOpen} onOpenChange={setDialogOpen} />
      )}
    </>
  )
}
