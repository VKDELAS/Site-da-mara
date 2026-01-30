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
import { ShoppingBag, MapPin, CreditCard, AlertCircle, Plus, Store, Ticket, Check, X, User, Loader2, Utensils } from "lucide-react"
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

  // Sincronizar dados do usuário e carregar endereços
  useEffect(() => {
    const loadData = async () => {
      const status = await storeStatusManager.getStatus()
      const deliveryActive = status.isDeliveryEnabled ?? true
      setIsDeliveryEnabled(deliveryActive)
      
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
      setCouponError("Erro ao validar cupom")
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

  const getFinalTotal = () => {
    return getTotalPrice() - getDiscountAmount()
  }

  const handleCepChange = async (value: string) => {
    const formatted = value.replace(/\D/g, "").replace(/(\d{5})(\d)/, "$1-$2").substring(0, 9)
    setCep(formatted)
    if (formatted.replace(/\D/g, "").length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${formatted.replace(/\D/g, "")}/json/`)
        const data = await response.json()
        if (!data.erro) {
          setRua(data.logradouro || "")
          setBairro(data.bairro || "")
          if ((data.localidade || "").toLowerCase().trim() !== "iacanga") {
            setEnderecoError("Entregamos apenas em Iacanga, SP.")
          } else {
            setEnderecoError("")
          }
        }
      } catch (error) {}
    }
  }

  const handleNomeChange = (value: string) => {
    if (!value) { setNome(""); return; }
    const preposicoes = ["de", "do", "da", "dos", "das", "e"]
    const capitalized = value.toLowerCase().split(" ").map((word, index) => {
      if (word.length === 0) return word
      if (preposicoes.includes(word) && index !== 0) return word
      return word.charAt(0).toUpperCase() + word.slice(1)
    }).join(" ")
    setNome(capitalized)
  }

  const handleTelefoneChange = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 11) {
      let formatted = numbers
      if (numbers.length > 0) formatted = `(${numbers.substring(0, 2)}`
      if (numbers.length >= 3) formatted += `) ${numbers.substring(2, 7)}`
      if (numbers.length >= 8) formatted += `-${numbers.substring(7, 11)}`
      setTelefone(formatted)
    }
  }

  const handleFinalizarPedido = async () => {
    if (nome.length < 3) {
      alert("Por favor, insira seu nome completo.")
      return
    }

    let enderecoString = ""
    if (deliveryType === "delivery") {
      const addr = useNewAddress
        ? { street: rua, number: numero, complement: complemento, neighborhood: bairro, city: "Iacanga", state: "SP", cep }
        : addresses.find((a) => a.id === selectedAddressId)

      if (addr) {
        enderecoString = `${addr.street}, ${addr.number}${addr.complement ? " - " + addr.complement : ""} - ${addr.neighborhood}, ${addr.city}/${addr.state}`
      }
    }

    if (!precisaTalheres) {
      alert("Por favor, informe se você precisa de colher.")
      return
    }

    setIsSubmitting(true)
    try {
      const orderData = {
        user_id: user?.id || null,
        customerName: nome,
        customerPhone: telefone,
        customerAddress: deliveryType === "pickup" ? "Retirada no Local" : enderecoString,
        customerNeighborhood: deliveryType === "pickup" ? "" : (useNewAddress ? bairro : (addresses.find(a => a.id === selectedAddressId)?.neighborhood || "")),
        customerComplement: deliveryType === "pickup" ? "" : (useNewAddress ? complemento : (addresses.find(a => a.id === selectedAddressId)?.complement || "")),
        paymentMethod: formaPagamento,
        totalAmount: getFinalTotal(),
        discountAmount: getDiscountAmount(),
        couponCode: appliedCoupon?.code || null,
        notes: `${observacoes}${precisaTalheres ? `\nPrecisa de colher: ${precisaTalheres === "sim" ? "SIM" : "NÃO"}` : ""}${formaPagamento === "dinheiro" && troco ? `\nTroco para: R$ ${troco}` : ""}`,
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
      
      // Gerar mensagem do WhatsApp
      let message = "*NOVO PEDIDO - BATATOP*\n"
      message += "------------------------------------------\n\n"
      message += "*CLIENTE*\n"
      message += `* Nome: ${nome}\n`
      message += `* WhatsApp: ${telefone}\n\n`
      message += `*ENTREGA: ${deliveryType === "delivery" ? "DELIVERY" : "RETIRADA NO LOCAL"}*\n`
      if (deliveryType === "delivery") {
        message += `* Endereço: ${enderecoString}\n\n`
      } else {
        message += "* Retirada: Rua Carlos Roberto Crepaldi, 120 - Jardim Alvorada\n\n"
      }
      message += "------------------------------------------\n"
      message += "*ITENS DO PEDIDO*\n\n"
      items.forEach((item) => {
        const itemPrice = item.price || 0
        const itemQty = item.quantity || 1
        const itemAdicionais = item.adicionais || []
        const itemAdicionaisTotal = itemAdicionais.reduce((sum, a) => sum + ((a.price || 0) * (a.quantity || 1)), 0)
        const itemTotal = (itemPrice + itemAdicionaisTotal) * itemQty
        message += `*${itemQty}x ${(item.name || "Produto").toUpperCase()}*\n`
        message += `  Preço un: R$ ${itemPrice.toFixed(2).replace('.', ',')}\n`
        if (itemAdicionais.length > 0) {
          message += `  + ${itemAdicionais.length} adicionais\n`
          itemAdicionais.forEach(a => {
            message += `    - ${a.quantity || 1}x ${a.name || "Adicional"} (R$ ${((a.price || 0) * (a.quantity || 1)).toFixed(2).replace('.', ',')})\n`
          })
        }
        message += `  *Subtotal item: R$ ${itemTotal.toFixed(2).replace('.', ',')}*\n\n`
      })
      message += "------------------------------------------\n"
      message += `Subtotal: R$ ${getTotalPrice().toFixed(2).replace('.', ',')}\n`
      if (appliedCoupon) {
        message += `Cupom (${appliedCoupon.code}): -R$ ${getDiscountAmount().toFixed(2).replace('.', ',')}\n`
      }
      message += `*TOTAL A PAGAR: R$ ${getFinalTotal().toFixed(2).replace('.', ',')}*\n\n`
      message += "*PAGAMENTO*\n"
      message += `* Método: ${formaPagamento.toUpperCase()}\n`
      if (formaPagamento === "dinheiro" && troco) message += `* Troco para: R$ ${troco}\n`
      message += `* Precisa de colher: ${precisaTalheres === "sim" ? "SIM" : "NÃO"}\n`
      if (observacoes) message += `\n*OBSERVAÇÕES:*\n${observacoes}\n`
      message += "\n------------------------------------------\n"
      message += "Pedido enviado pelo site Batatop"

      const whatsappUrl = `https://wa.me/5514997361015?text=${encodeURIComponent(message)}`
      
      clearCart()
      window.open(whatsappUrl, "_blank")
      router.push("/pedidos")

    } catch (error) {
      console.error(error)
      alert("Erro ao processar pedido")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <HeaderWrapper />
        <main className="flex-1 flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
              <ShoppingBag className="h-10 w-10 text-gray-300" />
            </div>
            <h2 className="text-2xl font-black text-gray-800">Seu carrinho está vazio</h2>
            <Button asChild className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-2xl px-8">
              <Link href="/cardapio">Ver Cardápio</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <HeaderWrapper />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 bg-yellow-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-yellow-100">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-800">Finalizar Pedido</h1>
              <p className="text-gray-500 text-sm">Quase lá! Só precisamos de mais alguns detalhes.</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-white border-b border-gray-50">
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                    <User className="h-5 w-5 text-yellow-500" /> Seus Dados
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold text-gray-600">Nome Completo</Label>
                    <Input value={nome} onChange={(e) => handleNomeChange(e.target.value)} placeholder="Como quer ser chamado?" className="h-12 rounded-xl border-gray-100" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-gray-600">WhatsApp</Label>
                    <Input value={telefone} onChange={(e) => handleTelefoneChange(e.target.value)} placeholder="(00) 00000-0000" className="h-12 rounded-xl border-gray-100" />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-white border-b border-gray-50">
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-yellow-500" /> Como quer receber?
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {!isDeliveryEnabled && (
                    <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-start gap-3 text-orange-800">
                      <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-orange-600" />
                      <div>
                        <p className="text-sm font-bold">Entregas Temporariamente Indisponíveis</p>
                        <p className="text-xs opacity-90">No momento estamos trabalhando apenas com **retirada no local**.</p>
                      </div>
                    </div>
                  )}
                  <RadioGroup value={deliveryType} onValueChange={(v: any) => { if (!isDeliveryEnabled && v === "delivery") return; setDeliveryType(v); }} className="grid md:grid-cols-2 gap-4">
                    <div className={!isDeliveryEnabled ? "opacity-50 cursor-not-allowed" : ""}>
                      <RadioGroupItem value="delivery" id="delivery" className="peer sr-only" disabled={!isDeliveryEnabled} />
                      <Label htmlFor="delivery" className={`flex flex-col items-center justify-between rounded-2xl border-2 border-gray-100 bg-white p-4 transition-all ${isDeliveryEnabled ? "hover:bg-gray-50 peer-data-[state=checked]:border-yellow-500 cursor-pointer" : "cursor-not-allowed"}`}>
                        <MapPin className={`h-6 w-6 mb-2 ${isDeliveryEnabled ? "text-gray-400 peer-data-[state=checked]:text-yellow-500" : "text-gray-300"}`} />
                        <span className="font-bold text-gray-600">Entrega</span>
                        <span className="text-xs text-gray-400">{isDeliveryEnabled ? "Receba em casa" : "Indisponível"}</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="pickup" id="pickup" className="peer sr-only" />
                      <Label htmlFor="pickup" className="flex flex-col items-center justify-between rounded-2xl border-2 border-gray-100 bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-yellow-500 cursor-pointer transition-all">
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
                              <div key={addr.id} onClick={() => { setSelectedAddressId(addr.id); setUseNewAddress(false); }} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${selectedAddressId === addr.id && !useNewAddress ? "border-yellow-500 bg-yellow-50" : "border-gray-100 hover:border-yellow-200"}`}>
                                <div className={`mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center ${selectedAddressId === addr.id && !useNewAddress ? "border-yellow-500" : "border-gray-300"}`}>
                                  {selectedAddressId === addr.id && !useNewAddress && <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />}
                                </div>
                                <div className="flex-1">
                                  <p className="font-bold text-gray-800">{addr.street}, {addr.number}</p>
                                  <p className="text-sm text-gray-500">{addr.neighborhood} - {addr.city}/{addr.state}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <Button variant="ghost" onClick={() => setUseNewAddress(true)} className="w-full rounded-xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-yellow-500 h-12">
                            <Plus className="h-4 w-4 mr-2" /> Usar outro endereço
                          </Button>
                        </div>
                      )}
                      {(useNewAddress || addresses.length === 0) && (
                        <div className="space-y-4">
                          <div className="grid md:grid-cols-3 gap-4">
                            <div className="space-y-2"><Label className="font-bold text-gray-600">CEP</Label><Input value={cep} onChange={(e) => handleCepChange(e.target.value)} placeholder="00000-000" className="h-12 rounded-xl border-gray-100" /></div>
                            <div className="md:col-span-2 space-y-2"><Label className="font-bold text-gray-600">Rua</Label><Input value={rua} onChange={(e) => setRua(e.target.value)} placeholder="Nome da rua" className="h-12 rounded-xl border-gray-100" /></div>
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2"><Label className="font-bold text-gray-600">Número</Label><Input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Nº" className="h-12 rounded-xl border-gray-100" /></div>
                            <div className="space-y-2"><Label className="font-bold text-gray-600">Bairro</Label><Input value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Seu bairro" className="h-12 rounded-xl border-gray-100" /></div>
                          </div>
                          <div className="space-y-2"><Label className="font-bold text-gray-600">Complemento (Opcional)</Label><Input value={complemento} onChange={(e) => setComplemento(e.target.value)} placeholder="Apto, bloco..." className="h-12 rounded-xl border-gray-100" /></div>
                          {enderecoError && <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600"><AlertCircle className="h-5 w-5 shrink-0 mt-0.5" /><p className="text-sm font-medium">{enderecoError}</p></div>}
                        </div>
                      )}
                    </div>
                  )}
                  {deliveryType === "pickup" && (
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-100 rounded-2xl flex items-start gap-3">
                      <Store className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                      <div><p className="text-sm font-bold text-yellow-800">Endereço para retirada:</p><p className="text-sm text-yellow-700">Rua Carlos Roberto Crepaldi, 120 - Jardim Alvorada, Iacanga/SP</p></div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-white border-b border-gray-50">
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-yellow-500" /> Forma de Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <RadioGroup value={formaPagamento} onValueChange={setFormaPagamento} className="grid md:grid-cols-3 gap-4">
                    <div><RadioGroupItem value="dinheiro" id="dinheiro" className="peer sr-only" /><Label htmlFor="dinheiro" className="flex flex-col items-center justify-center rounded-2xl border-2 border-gray-100 bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-yellow-500 cursor-pointer transition-all h-full"><span className="font-bold text-gray-600">Dinheiro</span></Label></div>
                    <div><RadioGroupItem value="pix" id="pix" className="peer sr-only" /><Label htmlFor="pix" className="flex flex-col items-center justify-center rounded-2xl border-2 border-gray-100 bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-yellow-500 cursor-pointer transition-all h-full"><span className="font-bold text-gray-600">PIX</span></Label></div>
                    <div><RadioGroupItem value="cartao" id="cartao" className="peer sr-only" /><Label htmlFor="cartao" className="flex flex-col items-center justify-center rounded-2xl border-2 border-gray-100 bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-yellow-500 cursor-pointer transition-all h-full"><span className="font-bold text-gray-600">Cartão</span></Label></div>
                  </RadioGroup>
                  {formaPagamento === "dinheiro" && <div className="mt-4 space-y-2"><Label className="font-bold text-gray-600">Troco para quanto? (Opcional)</Label><Input value={troco} onChange={(e) => setTroco(e.target.value)} placeholder="Ex: 50,00" className="h-12 rounded-xl border-gray-100" /></div>}
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-white border-b border-gray-50">
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                    <Utensils className="h-5 w-5 text-yellow-500" /> Precisa de colher?
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <RadioGroup value={precisaTalheres} onValueChange={setPrecisaTalheres} className="grid md:grid-cols-2 gap-4">
                    <div><RadioGroupItem value="sim" id="talheres-sim" className="peer sr-only" /><Label htmlFor="talheres-sim" className="flex items-center justify-center gap-3 rounded-2xl border-2 border-gray-100 bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-yellow-500 cursor-pointer transition-all"><div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${precisaTalheres === "sim" ? "border-yellow-500" : "border-gray-300"}`}>{precisaTalheres === "sim" && <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />}</div><span className="font-bold text-gray-600">Sim, por favor</span></Label></div>
                    <div><RadioGroupItem value="nao" id="talheres-nao" className="peer sr-only" /><Label htmlFor="talheres-nao" className="flex items-center justify-center gap-3 rounded-2xl border-2 border-gray-100 bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-yellow-500 cursor-pointer transition-all"><div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${precisaTalheres === "nao" ? "border-yellow-500" : "border-gray-300"}`}>{precisaTalheres === "nao" && <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />}</div><span className="font-bold text-gray-600">Não preciso</span></Label></div>
                  </RadioGroup>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-white border-b border-gray-50">
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-500" /> Observações
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Alguma observação especial?" className="min-h-[100px] rounded-2xl border-gray-100 resize-none" />
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                <Card className="rounded-[32px] border-none shadow-2xl overflow-hidden bg-white">
                  <CardHeader className="bg-yellow-500 p-6">
                    <CardTitle className="text-xl font-black flex items-center gap-2 text-white">
                      <ShoppingBag className="h-6 w-6" /> Resumo do Pedido
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4 mb-8">
                      {items.map((item) => (
                        <div key={item.id} className="group">
                          <div className="flex justify-between gap-4 items-start">
                            <div className="flex-1">
                              <p className="text-base font-black text-gray-900 leading-tight"><span className="text-yellow-600 mr-1">{item.quantity}x</span> {item.name}</p>
                              {item.adicionais && item.adicionais.length > 0 && (
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  {item.adicionais.map((a, idx) => (
                                    <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-50 text-yellow-700 border border-yellow-100">+ {a.name}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <p className="text-sm font-black text-gray-900 whitespace-nowrap">R$ {((item.price + (item.adicionais?.reduce((sum, a) => sum + (a.price * a.quantity), 0) || 0)) * item.quantity).toFixed(2).replace(".", ",")}</p>
                          </div>
                          <div className="h-px w-full bg-gray-50 mt-4 group-last:hidden" />
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4 pt-6 border-t-2 border-dashed border-gray-100">
                      <div className="bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus-within:border-yellow-500 focus-within:bg-white transition-all">
                        <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Cupom de Desconto</Label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Ticket className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${appliedCoupon ? "text-yellow-500" : "text-gray-400"}`} />
                            <Input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="CÓDIGO" disabled={!!appliedCoupon} className="h-12 pl-10 rounded-xl border-none bg-transparent focus-visible:ring-0 font-black text-gray-900" />
                          </div>
                          {appliedCoupon ? (
                            <Button variant="ghost" onClick={handleRemoveCoupon} className="h-12 px-4 rounded-xl text-red-500 font-black text-xs">REMOVER</Button>
                          ) : (
                            <Button onClick={handleApplyCoupon} className="h-12 px-6 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white font-black shadow-md shadow-yellow-100">APLICAR</Button>
                          )}
                        </div>
                        {couponError && <p className="text-[10px] font-bold text-red-500 mt-2 ml-1">{couponError}</p>}
                        {couponSuccess && <p className="text-[10px] font-bold text-green-600 mt-2 ml-1 flex items-center gap-1"><Check className="h-3 w-3" /> Cupom aplicado!</p>}
                      </div>

                      <div className="space-y-2 px-1">
                        <div className="flex justify-between text-sm font-bold text-gray-500"><span>Subtotal</span><span>R$ {getTotalPrice().toFixed(2).replace(".", ",")}</span></div>
                        {appliedCoupon && <div className="flex justify-between text-sm font-black text-green-600 bg-green-50 p-2 rounded-lg border border-green-100"><span className="flex items-center gap-1"><Ticket className="h-4 w-4" /> Desconto aplicado</span><span>- R$ {getDiscountAmount().toFixed(2).replace(".", ",")}</span></div>}
                        <div className="flex justify-between items-end pt-4">
                          <div className="flex flex-col"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total a pagar</span><span className="text-3xl font-black text-gray-900 leading-none">R$ {getFinalTotal().toFixed(2).replace(".", ",")}</span></div>
                          <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-1">{items.length} {items.length === 1 ? 'item' : 'itens'}</div>
                        </div>
                      </div>
                    </div>

                    <Button onClick={handleFinalizarPedido} disabled={isSubmitting} className="w-full h-14 mt-8 bg-yellow-500 hover:bg-yellow-600 text-white font-black text-lg rounded-2xl shadow-lg shadow-yellow-100 transition-all active:scale-95">
                      {isSubmitting ? <div className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Processando...</div> : "Finalizar Pedido"}
                    </Button>
                    <p className="text-[10px] text-center text-gray-400 mt-4 font-bold uppercase tracking-widest">Você será redirecionado para o WhatsApp</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
