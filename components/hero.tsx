"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Star, Clock, Truck, MapPin, Search, Loader2, Trophy, Megaphone } from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { addressesManager } from "@/lib/addresses-manager"
import { storeStatusManager } from "@/lib/store-status-manager"

interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  category?: "batata" | "bebida" | "macarrao"
}

interface HeroProps {
  mostRequestedProduct?: Product
  totalOrders?: number
  customerPhotos?: string[]
  totalCustomers?: number
}

export function Hero({ 
  mostRequestedProduct, 
  totalOrders = 1258,
  customerPhotos = [],
  totalCustomers = 5234
}: HeroProps) {
  const { user } = useAuth()
  const [addressInput, setAddressInput] = useState("")
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [hasAddress, setHasAddress] = useState(false)
  const [isCheckingAddress, setIsCheckingAddress] = useState(true)
  const [waitTime, setWaitTime] = useState({ min: 15, max: 22 })
  const [isDeliveryFeeEnabled, setIsDeliveryFeeEnabled] = useState(true)
  const [deliveryFee, setDeliveryFee] = useState(3.00)
  const [isPromoActive, setIsPromoActive] = useState(false)
  const [promoPrice, setPromoPrice] = useState(24.99)
  const [promoImage, setPromoImage] = useState<string | undefined>()
  const [superPromoActive, setSuperPromoActive] = useState(false)
  const [superPromoImage, setSuperPromoImage] = useState<string | undefined>()
  const [itemPromoActive, setItemPromoActive] = useState(false)
  const [itemPromoImage, setItemPromoImage] = useState<string | undefined>()

  useEffect(() => {
    const checkUserAddress = async () => {
      if (user) {
        const addresses = await addressesManager.getUserAddresses(user.id)
        setHasAddress(addresses.length > 0)
      } else {
        setHasAddress(false)
      }
      setIsCheckingAddress(false)
    }
    checkUserAddress()
  }, [user])

  useEffect(() => {
    const updateStatus = async () => {
      const status = await storeStatusManager.getStatus()
      setWaitTime({ min: status.waitTimeMin, max: status.waitTimeMax })
      setIsDeliveryFeeEnabled(status.isDeliveryFeeEnabled ?? true)
      setDeliveryFee(status.deliveryFee ?? 3.00)
      setIsPromoActive(status.isPromoActive ?? false)
      setPromoPrice(status.promoPrice ?? 24.99)
      setPromoImage(status.promoImage)
      
      if (status.superPromo?.isActive) {
        setSuperPromoActive(true)
        let imgUrl: string | undefined
        if (status.superPromo.useUrl && status.superPromo.imageUrl) {
          imgUrl = status.superPromo.imageUrl
        } else if (status.superPromo.imageId) {
          imgUrl = `/api/images/${status.superPromo.imageId}`
        }
        setSuperPromoImage(imgUrl)
      } else {
        setSuperPromoActive(false)
      }
      
      if (status.itemPromo?.isActive) {
        setItemPromoActive(true)
        let imgUrl: string | undefined
        if (status.itemPromo.useUrl && status.itemPromo.imageUrl) {
          imgUrl = status.itemPromo.imageUrl
        } else if (status.itemPromo.imageId) {
          imgUrl = `/api/images/${status.itemPromo.imageId}`
        }
        setItemPromoImage(imgUrl)
      } else {
        setItemPromoActive(false)
      }
    }
    updateStatus()
    const interval = setInterval(updateStatus, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleAddressSearch = async (value: string) => {
    setAddressInput(value)
    if (value.length > 3) {
      setIsLoadingSuggestions(true)
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value + " Iacanga SP")}&addressdetails=1&limit=5`)
        const data = await response.json()
        setSuggestions(data)
        setShowSuggestions(true)
      } catch (error) {
        console.error("Erro ao buscar sugestões:", error)
      } finally {
        setIsLoadingSuggestions(false)
      }
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const selectSuggestion = (suggestion: any) => {
    setAddressInput(suggestion.display_name)
    setShowSuggestions(false)
  }

  if (isCheckingAddress) return null

  return (
    <section className="relative overflow-hidden bg-white pt-8 pb-20 md:pt-12 md:pb-32">
      {/* ELEMENTOS DE FUNDO DECORATIVOS (AMARELO) */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[500px] h-[500px] bg-yellow-100/50 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[400px] h-[400px] bg-orange-50/50 rounded-full blur-3xl -z-10" />

      <div className="container mx-auto px-4">
        
        {/* BANNER DE PROMOÇÃO ESTILO IFOOD */}
        {(superPromoActive || itemPromoActive) && (superPromoImage || itemPromoImage || promoImage) && (
          <div className="mb-12 animate-in fade-in slide-in-from-top-8 duration-1000">
            <Link href="/cardapio">
              <div className="relative group overflow-hidden rounded-[2rem] shadow-lg shadow-yellow-100 border-2 border-yellow-200 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]">
                <img 
                  src={superPromoImage || itemPromoImage || promoImage} 
                  alt="Promoção batata top" 
                  className="w-full h-auto object-contain md:object-cover max-h-[250px] md:max-h-[450px]"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {/* BOTÃO DE AÇÃO NO BANNER */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                  <Button className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-black px-8 py-4 rounded-2xl text-lg shadow-2xl">
                    APROVEITAR AGORA
                    <ArrowRight className="ml-2 h-6 w-6" />
                  </Button>
                </div>
              </div>
            </Link>
          </div>
        )}

        <div className="flex flex-col lg:flex-row items-center gap-12">
          
          {/* CONTEÚDO TEXTUAL */}
          <div className="flex-1 text-center lg:text-left space-y-8">
            {/* BADGE DE DESTAQUE COM DADOS REAIS */}
            <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full text-sm font-bold animate-bounce">
              <Star className="h-4 w-4 fill-current" />
              {totalOrders ? `${totalOrders.toLocaleString('pt-BR')} pedidos já feitos!` : "A Melhor Batata Recheada de Iacanga!"}
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-black tracking-tight text-gray-900 leading-[1.1]">
                Fome de <span className="text-yellow-500">batata top?</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Batatas gigantes, recheios generosos e aquele sabor que só a <span className="font-bold text-gray-800">batata top</span> tem. Peça agora e receba quentinho em minutos! 🚀
              </p>
            </div>

            {/* CTAs PRINCIPAIS (VISÍVEL EM TODOS OS DISPOSITIVOS PARA MAIOR CONVERSÃO) */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link href="/cardapio" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-black text-xl px-10 h-16 rounded-2xl shadow-xl shadow-yellow-200 hover:shadow-yellow-300 transition-all hover:-translate-y-1"
                >
                  VER CARDÁPIO
                  <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
              </Link>
              
              <div className="flex items-center gap-4 px-4 py-2">
                {/* AVATARES REAIS DOS CLIENTES */}
                <div className="flex -space-x-2">
                  {customerPhotos.slice(0, 3).map((photo, i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                      <img 
                        src={photo} 
                        alt={`Cliente ${i + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = `https://i.pravatar.cc/100?img=${i + 10}`
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="text-left">
                  <div className="flex items-center text-yellow-500">
                    {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="h-3 w-3 fill-current" />)}
                  </div>
                  <p className="text-xs font-bold text-gray-600">
                    +{totalCustomers ? totalCustomers.toLocaleString('pt-BR') : "500"} clientes felizes
                  </p>
                </div>
              </div>
            </div>

            {/* DIFERENCIAIS RÁPIDOS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
              <div className="flex items-center gap-2 text-gray-600 font-medium text-sm">
                <div className="bg-green-100 p-2 rounded-lg text-green-600">
                  <Clock className="h-4 w-4" />
                </div>
                {waitTime.min}-{waitTime.max} min
              </div>
              <div className="flex items-center gap-2 text-gray-600 font-medium text-sm">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                  <Truck className="h-4 w-4" />
                </div>
                {isDeliveryFeeEnabled ? `Frete R$ ${deliveryFee.toFixed(2).replace('.', ',')}` : "Frete Grátis*"}
              </div>
            </div>
          </div>

          {/* IMAGEM DE IMPACTO COM DADOS REAIS */}
          <div className="flex-1 relative w-full max-w-lg lg:max-w-none">
            <div className="relative z-10 animate-in fade-in zoom-in duration-1000">
              {mostRequestedProduct ? (
                <>
                  <img 
                    src={mostRequestedProduct.image || "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80"} 
                    alt={mostRequestedProduct.name} 
                    className="w-full h-auto rounded-[40px] drop-shadow-[0_35px_35px_rgba(250,204,21,0.3)] hover:rotate-2 transition-transform duration-500 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80"
                    }}
                  />
                  
                  {/* FLOATING BADGE COM DADOS REAIS DO PRODUTO MAIS PEDIDO - ESTILO IFOOD PROFISSIONAL */}
                  <div className="absolute -top-4 -right-2 sm:-right-4 bg-white p-3 sm:p-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] z-20 border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-yellow-400 rounded-xl shadow-inner">
                        <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-white fill-current" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-black text-yellow-600 uppercase tracking-widest">Mais Pedida</span>
                          <div className="h-1 w-1 rounded-full bg-yellow-400" />
                        </div>
                        <p className="text-sm sm:text-base font-black text-gray-900 line-clamp-1 tracking-tight">{mostRequestedProduct.name}</p>
                      </div>
                    </div>
                  </div>

                  {/* NOME DO PRODUTO EMBAIXO DA FOTO (MOBILE) - DESIGN CLEAN */}
                  <div className="mt-6 text-center lg:hidden">
                    <div className="inline-flex items-center gap-2 bg-yellow-50 px-4 py-1.5 rounded-full border border-yellow-100 mb-2">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      <span className="text-[10px] font-black text-yellow-700 uppercase tracking-widest">Destaque da Casa</span>
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter leading-none">{mostRequestedProduct.name}</h2>
                  </div>
                </>
              ) : (
                <img 
                  src="https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80" 
                  alt="Batata Recheada Deliciosa" 
                  className="w-full h-auto rounded-[40px] drop-shadow-[0_35px_35px_rgba(250,204,21,0.3)] hover:rotate-2 transition-transform duration-500"
                />
              )}
              
            </div>
            
            {/* CÍRCULO DE FUNDO */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-yellow-400 rounded-full -z-10 opacity-10 blur-2xl" />
          </div>

        </div>
      </div>
    </section>
  )
}
