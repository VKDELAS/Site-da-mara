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
      const status = await storeStatusManager.getStatus()
      const deliveryActive = status.isDeliveryEnabled ?? true
      setIsDeliveryEnabled(deliveryActive)
      setDeliveryFee(status.deliveryFee ?? 3.00)
      setIsDeliveryFeeEnabled(status.isDeliveryFeeEnabled ?? true)
      
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

  const handleFinalizarPedido = async () => {
    if (nome.length < 3) {
      alert("Por favor, insira seu nome completo.")
      return
    }

    let enderecoString = ""
    let bairroFinal = ""
    let complementoFinal = ""

    if (deliveryType === "delivery") {
      if (useNewAddress) {
        if (!rua.trim() || !numero.trim() || !bairro.trim() || !cep.trim()) {
          alert("Preencha o endereço de entrega")
          return
        }
        enderecoString = `${rua}, ${numero}${complemento ? " - " + complemento : ""} - ${bairro}, Iacanga/SP`
        bairroFinal = bairro
        complementoFinal = complemento
      } else {
        const addr = addresses.find(a => a.id === selectedAddressId)
        if (!addr) {
          alert("Selecione um endereço")
          return
        }
        enderecoString = `${addr.street}, ${addr.number}${addr.complement ? " - " + addr.complement : ""} - ${addr.neighborhood}, ${addr.city}/${addr.state}`
        bairroFinal = addr.neighborhood
        complementoFinal = addr.complement || ""
      }
    } else {
      enderecoString = "Retirada no Local"
    }

    if (!precisaTalheres) {
      alert("Informe se precisa de colher")
      return
    }

    setIsSubmitting(true)
    try {
      const orderData = {
        user_id: user?.id || null,
        customerName: nome,
        customerPhone: telefone,
        customerAddress: enderecoString,
        customerNeighborhood: bairroFinal,
        customerComplement: complementoFinal,
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

      // 1. Salvar no banco
      await ordersManager.createOrder(orderData)
      
      // 2. Gerar mensagem WhatsApp
      const itemsList = items.map(i => `*${i.quantity}x ${i.name}* - R$ ${(i.price * i.quantity).toFixed(2)}`).join("\n")
      let mensagem = `*NOVO PEDIDO*\nCliente: ${nome}\nTipo: ${deliveryType === "delivery" ? "Entrega" : "Retirada"}\nEndereço: ${enderecoString}\n\n*ITENS:*\n${itemsList}\n\n*TOTAL: R$ ${getFinalTotal().toFixed(2)}*`
      
      const whatsappUrl = `https://api.whatsapp.com/send?phone=5514997361015&text=${encodeURIComponent(mensagem)}`
      
      // 3. LIMPAR CARRINHO E REDIRECIONAR
      clearCart()
      
      // 3. LIMPAR CARRINHO E REDIRECIONAR
      clearCart()
      
      // Abre o WhatsApp em uma nova aba e redireciona o site para a página de pedidos
      window.open(whatsappUrl, '_blank')
      router.push('/pedidos')

    } catch (error) {
      console.error(error)
      alert("Erro ao processar pedido")
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
            <h2 className="text-2xl font-black mb-2">Carrinho vazio</h2>
            <Link href="/cardapio"><Button className="w-full bg-yellow-500 text-white font-bold rounded-xl">Ver Cardápio</Button></Link>
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
          <h1 className="text-3xl font-black mb-8">Finalizar Pedido</h1>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="rounded-3xl p-6 space-y-4">
                <h3 className="font-black text-lg">Seus Dados</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome Completo</Label>
                    <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" />
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp</Label>
                    <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" />
                  </div>
                </div>
              </Card>

              <Card className="rounded-3xl p-6 space-y-4">
                <h3 className="font-black text-lg">Entrega</h3>
                <RadioGroup value={deliveryType} onValueChange={(v: any) => setDeliveryType(v)} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="delivery" id="delivery" />
                    <Label htmlFor="delivery">Entrega</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pickup" id="pickup" />
                    <Label htmlFor="pickup">Retirada</Label>
                  </div>
                </RadioGroup>

                {deliveryType === "delivery" && (
                  <div className="space-y-4 pt-4">
                    {addresses.length > 0 && !useNewAddress ? (
                      <div className="space-y-4">
                        <select value={selectedAddressId} onChange={(e) => setSelectedAddressId(e.target.value)} className="w-full p-3 border rounded-xl">
                          {addresses.map(a => <option key={a.id} value={a.id}>{a.street}, {a.number} - {a.neighborhood}</option>)}
                        </select>
                        <Button variant="link" onClick={() => setUseNewAddress(true)} className="text-yellow-600 p-0">Usar outro endereço</Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2"><Input placeholder="CEP" value={cep} onChange={(e) => handleCepChange(e.target.value)} /></div>
                        <div className="col-span-2"><Input placeholder="Rua" value={rua} onChange={(e) => setRua(e.target.value)} /></div>
                        <Input placeholder="Número" value={numero} onChange={(e) => setNumero(e.target.value)} />
                        <Input placeholder="Bairro" value={bairro} onChange={(e) => setBairro(e.target.value)} />
                        {addresses.length > 0 && <Button variant="link" onClick={() => setUseNewAddress(false)} className="col-span-2 text-yellow-600">Voltar aos meus endereços</Button>}
                      </div>
                    )}
                  </div>
                )}
              </Card>

              <Card className="rounded-3xl p-6 space-y-4">
                <h3 className="font-black text-lg">Pagamento</h3>
                <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)} className="w-full p-3 border rounded-xl">
                  <option value="dinheiro">Dinheiro</option>
                  <option value="pix">PIX</option>
                  <option value="cartao">Cartão</option>
                </select>
                {formaPagamento === "dinheiro" && <Input placeholder="Troco para quanto?" value={troco} onChange={(e) => setTroco(e.target.value)} />}
                
                <div className="pt-4 space-y-2">
                  <Label>Precisa de colher?</Label>
                  <RadioGroup value={precisaTalheres} onValueChange={setPrecisaTalheres} className="flex gap-4">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Sim" id="s" /><Label htmlFor="s">Sim</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Não" id="n" /><Label htmlFor="n">Não</Label></div>
                  </RadioGroup>
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="rounded-3xl p-6">
                <h3 className="font-black text-lg mb-4">Resumo</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Subtotal</span><span>R$ {getTotalPrice().toFixed(2)}</span></div>
                  {getDiscountAmount() > 0 && <div className="flex justify-between text-green-600"><span>Desconto</span><span>-R$ {getDiscountAmount().toFixed(2)}</span></div>}
                  {deliveryType === "delivery" && <div className="flex justify-between"><span>Taxa de Entrega</span><span>R$ {getCurrentDeliveryFee().toFixed(2)}</span></div>}
                  <div className="flex justify-between font-black text-lg pt-4 border-t"><span>Total</span><span>R$ {getFinalTotal().toFixed(2)}</span></div>
                </div>
                <Button onClick={handleFinalizarPedido} disabled={isSubmitting} className="w-full mt-6 bg-yellow-500 text-white font-black h-14 rounded-2xl shadow-lg">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "FINALIZAR PEDIDO"}
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
