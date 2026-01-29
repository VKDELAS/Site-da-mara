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

  const batatas = items.filter((item) => item.category === "batata")
  const bebidas = items.filter((item) => item.category === "bebida")

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
        : addresses.find((a) => a.id === selectedAddressId)

      if (addr) {
        enderecoString = `${addr.street}, ${addr.number}${addr.complement ? " - " + addr.complement : ""} - ${addr.neighborhood}, ${addr.city}/${addr.state}`
      }
    }

    setIsSubmitting(true)
    try {
      // 1. Tentar salvar no banco de dados primeiro
      try {
        const orderData = {
          user_id: user?.id || null, // GARANTINDO VINCULAÇÃO DO USUÁRIO
          customerName: nome || "Cliente",
          customerPhone: telefone || "",
          customerAddress: deliveryType === "pickup" ? "Retirada no Local" : enderecoString,
          customerNeighborhood: deliveryType === "pickup" ? "" : (useNewAddress ? bairro : (addresses.find(a => a.id === selectedAddressId)?.neighborhood || "")),
          customerComplement: deliveryType === "pickup" ? "" : (useNewAddress ? complemento : (addresses.find(a => a.id === selectedAddressId)?.complement || "")),
          paymentMethod: formaPagamento,
          totalAmount: getFinalTotal(),
          discountAmount: getDiscountAmount(),
          couponCode: appliedCoupon?.code || null,
          notes: `${observacoes}${precisaTalheres ? `\nPrecisa de colher: ${precisaTalheres}` : ""}${formaPagamento === "dinheiro" && troco ? `\nTroco para: R$ ${troco}` : ""}`,
          deliveryType: deliveryType,
          items: items.map(item => ({
            product_id: item.id.split("-")[0],
            product_name: item.name,
            product_price: item.price,
            quantity: item.quantity,
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
          // REMOVIDO item.notes para evitar erro de tipo
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
      
      // 3. LIMPAR CARRINHO E REDIRECIONAR PARA MEUS PEDIDOS
      clearCart()
      window.open(whatsappUrl, "_blank")
      router.push("/pedidos")
      
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
                        <Truck className={`h-6 w-6 mb-2 ${deliveryType === "delivery" ? "text-yellow-500" : "text-gray-400"}`} />
                        <div className="text-center">
                          <p className="font-black text-gray-900">Entrega</p>
                          <p className="text-xs text-gray-500">Receba em casa</p>
                        </div>
                      </Label>
                    </div>

                    <div>
                      <RadioGroupItem value="pickup" id="pickup" className="peer sr-only" />
                      <Label
                        htmlFor="pickup"
                        className="flex flex-col items-center justify-between rounded-2xl border-2 border-gray-100 bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-yellow-500 [&:has([data-state=checked])]:border-yellow-500 cursor-pointer transition-all"
                      >
                        <Store className={`h-6 w-6 mb-2 ${deliveryType === "pickup" ? "text-yellow-500" : "text-gray-400"}`} />
                        <div className="text-center">
                          <p className="font-black text-gray-900">Retirada</p>
                          <p className="text-xs text-gray-500">Busque no local</p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>

                  {deliveryType === "delivery" && (
                    <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                      {isLoadingAddresses ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-8 w-8 text-yellow-500 animate-spin" />
                        </div>
                      ) : (
                        <>
                          {addresses.length > 0 && !useNewAddress ? (
                            <div className="space-y-4">
                              <div className="grid gap-3">
                                {addresses.map((addr) => (
                                  <div
                                    key={addr.id}
                                    onClick={() => setSelectedAddressId(addr.id)}
                                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                                      selectedAddressId === addr.id
                                        ? "border-yellow-500 bg-yellow-50/30"
                                        : "border-gray-100 hover:border-gray-200"
                                    }`}
                                  >
                                    <div className={`mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                                      selectedAddressId === addr.id ? "border-yellow-500 bg-yellow-500" : "border-gray-300"
                                    }`}>
                                      {selectedAddressId === addr.id && <Check className="h-3 w-3 text-white" />}
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-bold text-gray-900">{addr.street}, {addr.number}</p>
                                      <p className="text-sm text-gray-500">{addr.neighborhood} - {addr.city}/{addr.state}</p>
                                      {addr.complement && <p className="text-xs text-gray-400 mt-1 italic">{addr.complement}</p>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <Button
                                variant="ghost"
                                onClick={() => setUseNewAddress(true)}
                                className="w-full h-12 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 hover:text-yellow-600 hover:border-yellow-200 hover:bg-yellow-50 font-bold gap-2"
                              >
                                <Plus className="h-4 w-4" /> Usar outro endereço
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="grid md:grid-cols-3 gap-4">
                                <div className="md:col-span-1 space-y-2">
                                  <Label className="font-bold text-gray-600">CEP</Label>
                                  <Input
                                    value={cep}
                                    onChange={(e) => handleCepChange(e.target.value)}
                                    placeholder="00000-000"
                                    className="h-12 rounded-xl border-gray-100"
                                  />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                  <Label className="font-bold text-gray-600">Rua</Label>
                                  <Input
                                    value={rua}
                                    onChange={(e) => setRua(e.target.value)}
                                    placeholder="Nome da rua"
                                    className="h-12 rounded-xl border-gray-100"
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
                                    className="h-12 rounded-xl border-gray-100"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="font-bold text-gray-600">Bairro</Label>
                                  <Input
                                    value={bairro}
                                    onChange={(e) => setBairro(e.target.value)}
                                    placeholder="Seu bairro"
                                    className="h-12 rounded-xl border-gray-100"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="font-bold text-gray-600">Complemento</Label>
                                  <Input
                                    value={complemento}
                                    onChange={(e) => setComplemento(e.target.value)}
                                    placeholder="Apto, Bloco, etc."
                                    className="h-12 rounded-xl border-gray-100"
                                  />
                                </div>
                              </div>
                              {enderecoError && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-sm font-bold">
                                  <AlertCircle className="h-4 w-4" /> {enderecoError}
                                </div>
                              )}
                              {addresses.length > 0 && (
                                <Button
                                  variant="ghost"
                                  onClick={() => setUseNewAddress(false)}
                                  className="text-gray-500 hover:text-yellow-600 font-bold"
                                >
                                  Voltar para meus endereços
                                </Button>
                              )}
                            </div>
                          )}
                        </>
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
                        <DollarSign className={`h-6 w-6 mb-2 ${formaPagamento === "dinheiro" ? "text-yellow-500" : "text-gray-400"}`} />
                        <span className="font-black text-gray-900">Dinheiro</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="pix" id="pix" className="peer sr-only" />
                      <Label
                        htmlFor="pix"
                        className="flex flex-col items-center justify-between rounded-2xl border-2 border-gray-100 bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-yellow-500 [&:has([data-state=checked])]:border-yellow-500 cursor-pointer transition-all"
                      >
                        <CreditCard className={`h-6 w-6 mb-2 ${formaPagamento === "pix" ? "text-yellow-500" : "text-gray-400"}`} />
                        <span className="font-black text-gray-900">PIX</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="cartao" id="cartao" className="peer sr-only" />
                      <Label
                        htmlFor="cartao"
                        className="flex flex-col items-center justify-between rounded-2xl border-2 border-gray-100 bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-yellow-500 [&:has([data-state=checked])]:border-yellow-500 cursor-pointer transition-all"
                      >
                        <CreditCard className={`h-6 w-6 mb-2 ${formaPagamento === "cartao" ? "text-yellow-500" : "text-gray-400"}`} />
                        <span className="font-black text-gray-900">Cartão</span>
                      </Label>
                    </div>
                  </RadioGroup>

                  {formaPagamento === "dinheiro" && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <Label className="font-bold text-gray-600">Troco para quanto?</Label>
                      <Input
                        value={troco}
                        onChange={(e) => setTroco(e.target.value)}
                        placeholder="Ex: 50,00"
                        className="h-12 rounded-xl border-gray-100"
                      />
                    </div>
                  )}

                  <div className="space-y-4 pt-4 border-t border-gray-50">
                    <Label className="font-black text-gray-700 flex items-center gap-2">
                      <Utensils className="h-4 w-4 text-yellow-500" /> Precisa de colher?
                    </Label>
                    <RadioGroup value={precisaTalheres} onValueChange={setPrecisaTalheres} className="flex gap-6">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Sim" id="talher-sim" />
                        <Label htmlFor="talher-sim" className="font-bold text-gray-600 cursor-pointer">Sim, por favor</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Não" id="talher-nao" />
                        <Label htmlFor="talher-nao" className="font-bold text-gray-600 cursor-pointer">Não preciso</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-gray-50">
                    <Label className="font-black text-gray-700 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-yellow-500" /> Observações do Pedido
                    </Label>
                    <Textarea
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      placeholder="Ex: Tirar cebola, ponto da carne, etc."
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
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-yellow-500" /> Resumo do Pedido
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4 mb-6">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-800">{item.quantity}x {item.name}</p>
                          {item.adicionais && item.adicionais.length > 0 && (
                            <p className="text-[10px] text-gray-400 leading-tight mt-0.5">
                              + {item.adicionais.map(a => a.name).join(", ")}
                            </p>
                          )}
                        </div>
                        <p className="text-sm font-black text-gray-900">R$ {(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                      <Input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Cupom de desconto"
                        className="h-10 rounded-xl border-gray-100 text-sm"
                        disabled={!!appliedCoupon}
                      />
                      {appliedCoupon ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleRemoveCoupon}
                          className="h-10 w-10 rounded-xl text-red-500 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          onClick={handleApplyCoupon}
                          className="h-10 bg-gray-900 hover:bg-black text-white font-bold rounded-xl px-4 text-xs"
                        >
                          Aplicar
                        </Button>
                      )}
                    </div>

                    {couponError && <p className="text-xs text-red-500 font-bold px-1">{couponError}</p>}
                    {couponSuccess && <p className="text-xs text-green-600 font-bold px-1">Cupom aplicado!</p>}

                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Subtotal</span>
                      <span>R$ {getTotalPrice().toFixed(2)}</span>
                    </div>
                    
                    {appliedCoupon && (
                      <div className="flex justify-between text-sm text-green-600 font-bold">
                        <span className="flex items-center gap-1"><Ticket className="h-3 w-3" /> Desconto</span>
                        <span>-R$ {getDiscountAmount().toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Taxa de Entrega</span>
                      <span>{deliveryType === "pickup" ? "Grátis" : `R$ ${getCurrentDeliveryFee().toFixed(2)}`}</span>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                      <span className="text-lg font-black text-gray-900">Total</span>
                      <span className="text-2xl font-black text-yellow-600">R$ {getFinalTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleFinalizarPedido}
                    disabled={isSubmitting}
                    className="w-full mt-8 h-14 bg-yellow-500 hover:bg-yellow-600 text-white font-black text-lg rounded-2xl shadow-lg shadow-yellow-100 transition-all active:scale-95 disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Processando...</span>
                      </div>
                    ) : (
                      "FINALIZAR PEDIDO"
                    )}
                  </Button>
                  
                  <p className="text-[10px] text-center text-gray-400 mt-4 px-4">
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

const DollarSign = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
)

const MessageSquare = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)
