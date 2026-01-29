"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { HeaderWrapper } from "@/components/header-wrapper"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useCart } from "@/lib/cart-context"
import { useAuth } from "@/lib/auth-context"
import { ShoppingBag, MapPin, CreditCard, AlertCircle, Plus, Store, Ticket, Check, X, User, Loader2, Utensils, Truck } from "lucide-react"
import Link from "next/link"
import { couponsManager, type Coupon } from "@/lib/cupons-manager"
import { storeStatusManager } from "@/lib/store-status-manager"
import { addressesManager, type Address } from "@/lib/addresses-manager"
import { ordersManager } from "@/lib/orders-manager"

export default function CheckoutPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { items, getTotalPrice, clearCart } = useCart()

  // Estados
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>("")
  const [useNewAddress, setUseNewAddress] = useState(false)
  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">("delivery")

  // Dados pessoais
  const [nome, setNome] = useState("")
  const [telefone, setTelefone] = useState("")

  // Novo endereço
  const [rua, setRua] = useState("")
  const [numero, setNumero] = useState("")
  const [complemento, setComplemento] = useState("")
  const [bairro, setBairro] = useState("")
  const [cep, setCep] = useState("")

  const [observacoes, setObservacoes] = useState("")
  const [formaPagamento, setFormaPagamento] = useState("dinheiro")
  const [troco, setTroco] = useState("")
  const [enderecoError, setEnderecoError] = useState("")

  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [couponError, setCouponError] = useState("")
  const [couponSuccess, setCouponSuccess] = useState(false)
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [precisaTalheres, setPrecisaTalheres] = useState<string>("")
  const [isDeliveryEnabled, setIsDeliveryEnabled] = useState(true)
  const [deliveryFee, setDeliveryFee] = useState(0)
  const [isDeliveryFeeEnabled, setIsDeliveryFeeEnabled] = useState(false)

  // Sincronizar dados do usuário e carregar endereços
  useEffect(() => {
    const loadData = async () => {
      // Carregar status da entrega
      const status = await storeStatusManager.getStatus()
      const deliveryActive = status.isDeliveryEnabled ?? true
      setIsDeliveryEnabled(deliveryActive)
      setDeliveryFee(status.deliveryFee ?? 3.00)
      setIsDeliveryFeeEnabled(status.isDeliveryFeeEnabled ?? true)
      
      // Se entrega estiver desativada, força retirada
      if (!deliveryActive) {
        setDeliveryType("pickup")
      }

      if (user) {
        setNome(user.user_metadata?.full_name || "")
        setTelefone(user.user_metadata?.phone || "")
        setIsLoadingAddresses(true)
        try {
          const userAddresses = await addressesManager.getUserAddresses(user.id)
          setAddresses(userAddresses)
          
          const defaultAddr = userAddresses.find((a) => a.is_default)
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id)
            setUseNewAddress(false)
          } else if (userAddresses.length > 0) {
            setSelectedAddressId(userAddresses[0].id)
            setUseNewAddress(false)
          } else {
            setUseNewAddress(true)
          }
        } catch (error) {
          console.error("Erro ao carregar endereços:", error)
        } finally {
          setIsLoadingAddresses(false)
        }
      }
    }
    loadData()
  }, [user])

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Digite um código de cupom")
      return
    }

    if (appliedCoupon) {
      setCouponError("Remova o cupom atual antes de aplicar outro")
      return
    }

    try {
      const validation = await couponsManager.validateCoupon(couponCode, user?.id)

      if (validation.valid && validation.coupon) {
        setAppliedCoupon(validation.coupon)
        setCouponError("")
        setCouponSuccess(true)
        setTimeout(() => setCouponSuccess(false), 3000)
      } else {
        setCouponError(validation.message || "Cupom inválido")
        setAppliedCoupon(null)
      }
    } catch (error) {
      console.error("Erro ao validar cupom:", error)
      setCouponError("Erro ao validar cupom")
      setAppliedCoupon(null)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode("")
    setCouponError("")
  }

  const getDiscountAmount = () => {
    if (!appliedCoupon) return 0
    return couponsManager.calculateDiscount(getTotalPrice(), appliedCoupon)
  }

  const getCurrentDeliveryFee = () => {
    if (deliveryType === "pickup") return 0
    return isDeliveryFeeEnabled ? deliveryFee : 0
  }

  const getFinalTotal = () => {
    return getTotalPrice() - getDiscountAmount() + getCurrentDeliveryFee()
  }

  const handleCepChange = async (value: string) => {
    const formatted = value
      .replace(/\D/g, "")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .substring(0, 9)
    setCep(formatted)

    if (formatted.replace(/\D/g, "").length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${formatted.replace(/\D/g, "")}/json/`)
        const data = await response.json()

        if (!data.erro) {
          setRua(data.logradouro || "")
          setBairro(data.bairro || "")

          const cidadeNormalizada = (data.localidade || "").toLowerCase().trim()
          if (cidadeNormalizada && cidadeNormalizada !== "iacanga") {
            setEnderecoError("Desculpe, no momento entregamos apenas em Iacanga, SP.")
          } else {
            setEnderecoError("")
          }
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error)
      }
    }
  }

  const handleNomeChange = (value: string) => {
    if (!value) {
      setNome("")
      return
    }

    const preposicoes = ["de", "do", "da", "dos", "das", "e"]
    
    const capitalized = value
      .toLowerCase()
      .split(" ")
      .map((word, index) => {
        if (word.length === 0) return word
        if (preposicoes.includes(word) && index !== 0) {
          return word
        }
        return word.charAt(0).toUpperCase() + word.slice(1)
      })
      .join(" ")
    setNome(capitalized)
  }

  const handleTelefoneChange = (value: string) => {
    const numbers = value.replace(/\D/g, "")

    if (numbers.length <= 11) {
      let formatted = numbers

      if (numbers.length > 0) {
        formatted = `(${numbers.substring(0, 2)}`
      }
      if (numbers.length >= 3) {
        formatted += `) ${numbers.substring(2, 7)}`
      }
      if (numbers.length >= 8) {
        formatted += `-${numbers.substring(7, 11)}`
      }

      setTelefone(formatted)
    }
  }

  const registrarPedido = () => {
    const orders = JSON.parse(localStorage.getItem("product-orders") || "{}")

    items.forEach((item) => {
      const productId = item.id.split("-")[0]
      orders[productId] = (orders[productId] || 0) + item.quantity
    })

    localStorage.setItem("product-orders", JSON.stringify(orders))
  }

  const handleFinalizarPedido = async () => {
    if (nome.length < 3) {
      alert("Por favor, insira seu nome completo.")
      return
    }

    if (deliveryType === "pickup") {
      if (!nome.trim() || !telefone.trim()) {
        alert("Por favor, preencha seu nome e telefone")
        return
      }
    } else {
      let enderecoFinal: Address | null = null

      if (useNewAddress) {
        if (!nome.trim() || !telefone.trim() || !rua.trim() || !numero.trim() || !bairro.trim() || !cep.trim()) {
          alert("Por favor, preencha todos os campos obrigatórios do endereço")
          return
        }

        if (enderecoError) {
          alert("Corrija o endereço antes de continuar. Entregamos apenas em Iacanga, SP.")
          return
        }

        enderecoFinal = {
          id: "temp",
          street: rua,
          number: numero,
          complement: complemento,
          neighborhood: bairro,
          city: "Iacanga",
          state: "SP",
          cep,
          is_default: false,
          user_id: user?.id || ""
        }
      } else {
        if (!selectedAddressId) {
          alert("Por favor, selecione um endereço de entrega")
          return
        }

        enderecoFinal = addresses.find((a) => a.id === selectedAddressId) || null
        if (!enderecoFinal) {
          alert("Endereço não encontrado")
          return
        }

        if (!nome.trim() || !telefone.trim()) {
          alert("Por favor, preencha seu nome e telefone")
          return
        }
      }
    }

    if (!formaPagamento) {
      alert("Por favor, selecione a forma de pagamento")
      return
    }

    if (!precisaTalheres) {
      alert("Por favor, informe se você precisa de colher.")
      return
    }

    registrarPedido()

    let enderecoString = ""
    let bairroFinal = ""
    let complementoFinal = ""

    if (deliveryType === "delivery") {
      const addr = useNewAddress
        ? {
            street: rua,
            number: numero,
            complement: complemento,
            neighborhood: bairro,
            city: "Iacanga",
            state: "SP",
            cep,
          }
        : addresses.find(a => a.id === selectedAddressId)

      if (addr) {
        enderecoString = `${addr.street}, ${addr.number}${addr.complement ? " - " + addr.complement : ""} - ${addr.neighborhood}, ${addr.city}/${addr.state}`
        bairroFinal = addr.neighborhood
        complementoFinal = addr.complement || ""
      }
    }

    setIsSubmitting(true)
    try {
      // 1. Tentar salvar no banco de dados primeiro
      try {
        const orderData = {
          customerName: nome || "Cliente",
          customerPhone: telefone || "",
          customerAddress: deliveryType === "pickup" ? "Retirada no Local" : enderecoString,
          customerNeighborhood: deliveryType === "pickup" ? "" : bairroFinal,
          customerComplement: deliveryType === "pickup" ? "" : complementoFinal,
          paymentMethod: formaPagamento,
          totalAmount: getFinalTotal(),
          discountAmount: getDiscountAmount(),
          couponCode: appliedCoupon?.code || null,
          notes: `${observacoes}${precisaTalheres ? `\nPrecisa de colher: ${precisaTalheres}` : ""}${formaPagamento === "dinheiro" && troco ? `\nTroco para: R$ ${troco}` : ""}`,
          user_id: user?.id || null,
          deliveryType: deliveryType,
          items: items.map(item => ({
            product_id: item.id.split("-")[0],
            product_name: item.name,
            product_price: item.price,
            quantity: item.quantity,
            notes: item.notes || null,
            adicionais: item.adicionais || []
          }))
        }

        await ordersManager.createOrder(orderData)
        // Incrementa o tempo de espera após pedido bem sucedido
        await storeStatusManager.incrementWaitTime()
      } catch (dbError) {
        console.error("Erro ao salvar pedido no banco:", dbError)
        // Continuamos para o WhatsApp mesmo se falhar no banco
      }

      // 2. Gerar mensagem do WhatsApp
      const itemsList = items
        .map((item) => {
          let itemText = `*${item.quantity}x ${item.name}* - R$ ${(item.price * item.quantity).toFixed(2)}`
          if (item.pastaType) {
            itemText += `\n  _Massa: ${item.pastaType}_`
          }
          if (item.adicionais && item.adicionais.length > 0) {
            item.adicionais.forEach(a => {
              itemText += `\n  _+ ${a.name} (R$ ${a.price.toFixed(2)})_`
            })
          }
          if (item.notes) {
            itemText += `\n  _Obs: ${item.notes}_`
          }
          return itemText
        })
        .join("\n\n")

      const subtotal = getTotalPrice()
      const desconto = getDiscountAmount()
      const taxaEntrega = getCurrentDeliveryFee()
      const total = getFinalTotal()

      let mensagem = `*NOVO PEDIDO - SITE DA MARA*\n`
      mensagem += `------------------------------\n`
      mensagem += `*Cliente:* ${nome}\n`
      mensagem += `*Telefone:* ${telefone}\n`
      mensagem += `*Tipo:* ${deliveryType === "delivery" ? "🚀 Entrega" : "🛍️ Retirada"}\n`
      
      if (deliveryType === "delivery") {
        mensagem += `*Endereço:* ${enderecoString}\n`
      }
      
      mensagem += `------------------------------\n`
      mensagem += `*ITENS:*\n\n${itemsList}\n`
      mensagem += `------------------------------\n`
      
      if (observacoes) {
        mensagem += `*Observações:* ${observacoes}\n`
      }
      
      mensagem += `*Precisa de colher?* ${precisaTalheres}\n`
      mensagem += `*Pagamento:* ${formaPagamento.toUpperCase()}${formaPagamento === "dinheiro" && troco ? ` (Troco para R$ ${troco})` : ""}\n`
      
      if (appliedCoupon) {
        mensagem += `*Cupom:* ${appliedCoupon.code} (-R$ ${desconto.toFixed(2)})\n`
      }
      
      mensagem += `------------------------------\n`
      mensagem += `*Subtotal:* R$ ${subtotal.toFixed(2)}\n`
      if (desconto > 0) mensagem += `*Desconto:* -R$ ${desconto.toFixed(2)}\n`
      if (taxaEntrega > 0) mensagem += `*Taxa de Entrega:* R$ ${taxaEntrega.toFixed(2)}\n`
      mensagem += `*TOTAL: R$ ${total.toFixed(2)}*\n`

      const whatsappUrl = `https://api.whatsapp.com/send?phone=5514997361015&text=${encodeURIComponent(mensagem)}`
      
      clearCart()
      router.push(whatsappUrl)
    } catch (error) {
      console.error("Erro ao finalizar pedido:", error)
      alert("Ocorreu um erro ao processar seu pedido. Por favor, tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <HeaderWrapper />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center p-8 rounded-3xl border-none shadow-sm">
            <div className="h-20 w-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="h-10 w-10 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Seu carrinho está vazio</h2>
            <p className="text-gray-500 mb-8">Adicione alguns itens deliciosos antes de finalizar seu pedido.</p>
            <Link href="/cardapio">
              <Button className="w-full h-12 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl">
                Ver Cardápio
              </Button>
            </Link>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <HeaderWrapper />
      <main className="flex-1 py-8 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 bg-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-100">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-3xl font-black text-gray-900">Finalizar Pedido</h1>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* DADOS PESSOAIS */}
              <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-white border-b border-gray-50">
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                    <User className="h-5 w-5 text-yellow-500" /> Seus Dados
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-bold text-gray-600">Nome Completo</Label>
                      <Input
                        value={nome}
                        onChange={(e) => handleNomeChange(e.target.value)}
                        placeholder="Como devemos te chamar?"
                        className="h-12 rounded-xl border-gray-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-gray-600">WhatsApp</Label>
                      <Input
                        value={telefone}
                        onChange={(e) => handleTelefoneChange(e.target.value)}
                        placeholder="(00) 00000-0000"
                        className="h-12 rounded-xl border-gray-100"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* TIPO DE ENTREGA */}
              <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-white border-b border-gray-50">
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-yellow-500" /> Como quer receber?
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {!isDeliveryEnabled && (
                    <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-start gap-3 text-orange-800 animate-in fade-in slide-in-from-top-2 duration-300">
                      <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-orange-600" />
                      <div>
                        <p className="text-sm font-bold">Entregas Temporariamente Indisponíveis</p>
                        <p className="text-xs opacity-90">No momento estamos trabalhando apenas com **retirada no local**. Desculpe o transtorno!</p>
                      </div>
                    </div>
                  )}

                  <RadioGroup
                    value={deliveryType}
                    onValueChange={(v: "delivery" | "pickup") => {
                      if (!isDeliveryEnabled && v === "delivery") return
                      setDeliveryType(v)
                    }}
                    className="grid md:grid-cols-2 gap-4"
                  >
                    <div className={!isDeliveryEnabled ? "opacity-50 cursor-not-allowed" : ""}>
                      <RadioGroupItem value="delivery" id="delivery" className="peer sr-only" disabled={!isDeliveryEnabled} />
                      <Label
                        htmlFor="delivery"
                        className={`flex flex-col items-center justify-between rounded-2xl border-2 border-gray-100 bg-white p-4 transition-all ${
                          isDeliveryEnabled 
                            ? "hover:bg-gray-50 peer-data-[state=checked]:border-yellow-500 [&:has([data-state=checked])]:border-yellow-500 cursor-pointer" 
                            : "cursor-not-allowed"
                        }`}
                      >
                        <MapPin className={`h-6 w-6 mb-2 ${isDeliveryEnabled ? "text-gray-400 peer-data-[state=checked]:text-yellow-500" : "text-gray-300"}`} />
                        <span className="font-bold text-gray-600">Entrega</span>
                        <span className="text-xs text-gray-400">{isDeliveryEnabled ? "Receba em casa" : "Indisponível"}</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="pickup" id="pickup" className="peer sr-only" />
                      <Label
                        htmlFor="pickup"
                        className="flex flex-col items-center justify-between rounded-2xl border-2 border-gray-100 bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-yellow-500 [&:has([data-state=checked])]:border-yellow-500 cursor-pointer transition-all"
                      >
                        <Store className="h-6 w-6 mb-2 text-gray-400 peer-data-[state=checked]:text-yellow-500" />
                        <span className="font-bold text-gray-600">Retirada</span>
                        <span className="text-xs text-gray-400">Busque no local</span>
                      </Label>
                    </div>
                  </RadioGroup>

                  {deliveryType === "delivery" && (
                    <div className="mt-6 space-y-6">
                      {addresses.length > 0 && (
                        <div className="space-y-3">
                          <Label className="font-bold text-gray-600">Seus Endereços Salvos</Label>
                          <div className="grid gap-3">
                            {addresses.map((addr) => (
                              <div
                                key={addr.id}
                                onClick={() => {
                                  setSelectedAddressId(addr.id)
                                  setUseNewAddress(false)
                                }}
                                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                                  selectedAddressId === addr.id && !useNewAddress
                                    ? "border-yellow-500 bg-yellow-50"
                                    : "border-gray-100 hover:border-yellow-200"
                                }`}
                              >
                                <div className={`h-5 w-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${selectedAddressId === addr.id && !useNewAddress ? "border-yellow-500 bg-yellow-500" : "border-gray-300"}`}>
                                  {selectedAddressId === addr.id && !useNewAddress && <Check className="h-3 w-3 text-white" />}
                                </div>
                                <div className="flex-1">
                                  <p className="font-bold text-gray-800">{addr.street}, {addr.number}</p>
                                  <p className="text-sm text-gray-500">{addr.neighborhood} - {addr.city}/{addr.state}</p>
                                  {addr.complement && <p className="text-xs text-gray-400 mt-1">Obs: {addr.complement}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setUseNewAddress(!useNewAddress)
                          if (!useNewAddress) setSelectedAddressId("")
                        }}
                        className="w-full h-12 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 gap-2"
                      >
                        {useNewAddress ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        {useNewAddress ? "Cancelar novo endereço" : "Usar outro endereço"}
                      </Button>

                      {useNewAddress && (
                        <div className="space-y-4 p-6 bg-gray-50 rounded-2xl border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300">
                          <div className="grid md:grid-cols-3 gap-4">
                            <div className="md:col-span-1 space-y-2">
                              <Label className="font-bold text-gray-600">CEP</Label>
                              <Input
                                value={cep}
                                onChange={(e) => handleCepChange(e.target.value)}
                                placeholder="00000-000"
                                className="h-12 rounded-xl border-gray-200 bg-white"
                              />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                              <Label className="font-bold text-gray-600">Rua</Label>
                              <Input
                                value={rua}
                                onChange={(e) => setRua(e.target.value)}
                                placeholder="Nome da rua"
                                className="h-12 rounded-xl border-gray-200 bg-white"
                              />
                            </div>
                          </div>

                          <div className="grid md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label className="font-bold text-gray-600">Número</Label>
                              <Input
                                value={numero}
                                onChange={(e) => setNumero(e.target.value)}
                                placeholder="Ex: 123"
                                className="h-12 rounded-xl border-gray-200 bg-white"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="font-bold text-gray-600">Bairro</Label>
                              <Input
                                value={bairro}
                                onChange={(e) => setBairro(e.target.value)}
                                placeholder="Seu bairro"
                                className="h-12 rounded-xl border-gray-200 bg-white"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="font-bold text-gray-600">Complemento</Label>
                              <Input
                                value={complemento}
                                onChange={(e) => setComplemento(e.target.value)}
                                placeholder="Apto, bloco, etc"
                                className="h-12 rounded-xl border-gray-200 bg-white"
                              />
                            </div>
                          </div>

                          {enderecoError && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-sm font-bold">
                              <AlertCircle className="h-4 w-4" />
                              {enderecoError}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* PAGAMENTO */}
              <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-white border-b border-gray-50">
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-yellow-500" /> Forma de Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <RadioGroup value={formaPagamento} onValueChange={setFormaPagamento} className="grid md:grid-cols-3 gap-4">
                    <div>
                      <RadioGroupItem value="dinheiro" id="dinheiro" className="peer sr-only" />
                      <Label
                        htmlFor="dinheiro"
                        className="flex flex-col items-center justify-between rounded-2xl border-2 border-gray-100 bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-yellow-500 [&:has([data-state=checked])]:border-yellow-500 cursor-pointer transition-all"
                      >
                        <span className="font-bold text-gray-600">Dinheiro</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="pix" id="pix" className="peer sr-only" />
                      <Label
                        htmlFor="pix"
                        className="flex flex-col items-center justify-between rounded-2xl border-2 border-gray-100 bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-yellow-500 [&:has([data-state=checked])]:border-yellow-500 cursor-pointer transition-all"
                      >
                        <span className="font-bold text-gray-600">PIX</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="cartao" id="cartao" className="peer sr-only" />
                      <Label
                        htmlFor="cartao"
                        className="flex flex-col items-center justify-between rounded-2xl border-2 border-gray-100 bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-yellow-500 [&:has([data-state=checked])]:border-yellow-500 cursor-pointer transition-all"
                      >
                        <span className="font-bold text-gray-600">Cartão</span>
                      </Label>
                    </div>
                  </RadioGroup>

                  {formaPagamento === "dinheiro" && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <Label className="font-bold text-gray-600">Troco para quanto?</Label>
                      <Input
                        value={troco}
                        onChange={(e) => setTroco(e.target.value)}
                        placeholder="Ex: 50,00 (Deixe em branco se não precisar)"
                        className="h-12 rounded-xl border-gray-100"
                      />
                    </div>
                  )}

                  <div className="space-y-4 pt-4 border-t border-gray-50">
                    <Label className="font-bold text-gray-600 flex items-center gap-2">
                      <Utensils className="h-4 w-4 text-yellow-500" /> Precisa de colher?
                    </Label>
                    <RadioGroup value={precisaTalheres} onValueChange={setPrecisaTalheres} className="grid grid-cols-2 gap-4">
                      <div>
                        <RadioGroupItem value="Sim" id="talheres-sim" className="peer sr-only" />
                        <Label
                          htmlFor="talheres-sim"
                          className="flex items-center justify-center rounded-xl border-2 border-gray-100 bg-white p-3 hover:bg-gray-50 peer-data-[state=checked]:border-yellow-500 [&:has([data-state=checked])]:border-yellow-500 cursor-pointer transition-all font-bold text-gray-600"
                        >
                          Sim
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem value="Não" id="talheres-nao" className="peer sr-only" />
                        <Label
                          htmlFor="talheres-nao"
                          className="flex items-center justify-center rounded-xl border-2 border-gray-100 bg-white p-3 hover:bg-gray-50 peer-data-[state=checked]:border-yellow-500 [&:has([data-state=checked])]:border-yellow-500 cursor-pointer transition-all font-bold text-gray-600"
                        >
                          Não
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-gray-50">
                    <Label className="font-bold text-gray-600">Observações do Pedido</Label>
                    <Textarea
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      placeholder="Ex: Tirar cebola, ponto da carne, etc..."
                      className="min-h-[100px] rounded-2xl border-gray-100 resize-none"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* RESUMO DO PEDIDO */}
            <div className="space-y-6">
              <Card className="rounded-3xl border-none shadow-sm overflow-hidden sticky top-8">
                <CardHeader className="bg-white border-b border-gray-50">
                  <CardTitle className="text-lg font-black">Resumo do Pedido</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4 mb-6">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-800">
                            {item.quantity}x {item.name}
                          </p>
                          {item.adicionais && item.adicionais.length > 0 && (
                            <p className="text-xs text-gray-400">
                              + {item.adicionais.map((a) => a.name).join(", ")}
                            </p>
                          )}
                        </div>
                        <p className="text-sm font-bold text-gray-800">
                          R$ {(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* CUPOM */}
                  <div className="pt-4 border-t border-gray-50 mb-6">
                    {!appliedCoupon ? (
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Possui um cupom?</Label>
                        <div className="flex gap-2">
                          <Input
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            placeholder="CÓDIGO"
                            className="h-10 rounded-xl border-gray-100 uppercase font-bold"
                          />
                          <Button
                            onClick={handleApplyCoupon}
                            variant="outline"
                            className="h-10 rounded-xl border-yellow-500 text-yellow-600 hover:bg-yellow-50 font-bold"
                          >
                            Aplicar
                          </Button>
                        </div>
                        {couponError && <p className="text-xs text-red-500 font-bold">{couponError}</p>}
                        {couponSuccess && <p className="text-xs text-green-500 font-bold">Cupom aplicado!</p>}
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-100 p-3 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Ticket className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="text-xs font-bold text-green-800">{appliedCoupon.code}</p>
                            <p className="text-[10px] text-green-600">Cupom aplicado com sucesso</p>
                          </div>
                        </div>
                        <button onClick={handleRemoveCoupon} className="p-1 hover:bg-green-100 rounded-full text-green-600">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 pt-4 border-t border-gray-50">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Subtotal</span>
                      <span>R$ {getTotalPrice().toFixed(2)}</span>
                    </div>
                    {appliedCoupon && (
                      <div className="flex justify-between text-sm text-green-600 font-bold">
                        <span>Desconto</span>
                        <span>- R$ {getDiscountAmount().toFixed(2)}</span>
                      </div>
                    )}
                    {deliveryType === "delivery" && (
                      <div className="flex justify-between text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          Taxa de Entrega
                          {!isDeliveryFeeEnabled && <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none text-[10px]">Grátis</Badge>}
                        </span>
                        <span>R$ {getCurrentDeliveryFee().toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xl font-black text-gray-900 pt-2">
                      <span>Total</span>
                      <span>R$ {getFinalTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleFinalizarPedido}
                    disabled={isSubmitting}
                    className="w-full h-14 bg-yellow-500 hover:bg-yellow-600 text-white font-black text-lg rounded-2xl mt-8 shadow-lg shadow-yellow-100 transition-all active:scale-95 gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        Finalizar Pedido
                        <Check className="h-5 w-5" />
                      </>
                    )}
                  </Button>
                  <p className="text-[10px] text-gray-400 text-center mt-4 px-4">
                    Ao finalizar, você será redirecionado para o WhatsApp para confirmar seu pedido.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${className}`}>
      {children}
    </span>
  )
}
