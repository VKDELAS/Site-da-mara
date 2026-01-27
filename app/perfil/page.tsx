"use client"

import { HeaderWrapper } from "@/components/header-wrapper"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { addressesManager, type Address } from "@/lib/addresses-manager"
import { User, Mail, ShoppingBag, MapPin, Plus, Trash2, ShieldAlert, LogOut, ChevronRight, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { OrderSummary } from "@/components/order-summary"

const ADMIN_EMAILS = ["enzzobaraldo2008@gmail.com", "maraysis9010@gmail.com"]

export default function PerfilPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [newAddress, setNewAddress] = useState({
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "Iacanga",
    state: "SP",
    cep: "",
  })
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadAddresses()
    }
  }, [user])

  const loadAddresses = async () => {
    if (!user) return
    setIsLoadingAddresses(true)
    const userAddresses = await addressesManager.getUserAddresses(user.id)
    setAddresses(userAddresses)
    setIsLoadingAddresses(false)
  }

  const handleAddAddress = async () => {
    if (!newAddress.street || !newAddress.number || !newAddress.neighborhood || !newAddress.cep) {
      alert("Preencha todos os campos obrigatórios")
      return
    }

    if (!user) return

    const address = {
      user_id: user.id,
      ...newAddress,
      is_default: addresses.length === 0,
    }

    const result = await addressesManager.addAddress(address)
    if (result) {
      await loadAddresses()
      setNewAddress({
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "Iacanga",
        state: "SP",
        cep: "",
      })
      setShowAddressForm(false)
    } else {
      alert("Erro ao adicionar endereço. Tente novamente.")
    }
  }

  const handleDeleteAddress = async (id: string) => {
    const success = await addressesManager.deleteAddress(id)
    if (success) {
      await loadAddresses()
    } else {
      alert("Erro ao deletar endereço. Tente novamente.")
    }
  }

  const handleSetDefault = async (id: string) => {
    if (!user) return
    const success = await addressesManager.setDefaultAddress(user.id, id)
    if (success) {
      await loadAddresses()
    } else {
      alert("Erro ao definir endereço padrão. Tente novamente.")
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  const handleCepChange = async (value: string) => {
    const formatted = value
      .replace(/\D/g, "")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .substring(0, 9)
    setNewAddress({ ...newAddress, cep: formatted })

    if (formatted.replace(/\D/g, "").length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${formatted.replace(/\D/g, "")}/json/`)
        const data = await response.json()

        if (!data.erro) {
          setNewAddress({
            ...newAddress,
            cep: formatted,
            street: data.logradouro || "",
            neighborhood: data.bairro || "",
            city: data.localidade || "Iacanga",
            state: data.uf || "SP",
          })
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <HeaderWrapper />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </main>
        <Footer />
        <OrderSummary />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const isAdmin = user.email && ADMIN_EMAILS.includes(user.email)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <HeaderWrapper />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Cabeçalho do Perfil - Estilo iFood */}
          <div className="flex items-center gap-4 mb-8 bg-white p-6 rounded-2xl shadow-sm">
            <div className="h-20 w-20 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 border-2 border-yellow-50">
              {user.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt={user.user_metadata?.full_name || ""} className="h-full w-full rounded-full object-cover" />
              ) : (
                <User className="h-10 w-10" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-black text-gray-800">{user.user_metadata?.full_name || "Usuário"}</h1>
              <p className="text-gray-500 flex items-center gap-1 text-sm">
                <Mail className="h-3 w-3" /> {user.email}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-gray-400 hover:text-red-500">
              <LogOut className="h-6 w-6" />
            </Button>
          </div>

          <div className="space-y-4">
            {/* Menu de Opções */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <button 
                onClick={() => router.push("/cardapio")}
                className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors border-b border-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-800">Meus Pedidos</p>
                    <p className="text-xs text-gray-400">Histórico de compras</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-300" />
              </button>

              <div className="p-5 border-b border-gray-50">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-yellow-50 flex items-center justify-center text-yellow-500">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-bold text-gray-800">Meus Endereços</p>
                    <p className="text-xs text-gray-400">Onde entregamos suas batatas</p>
                  </div>
                  {!showAddressForm && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowAddressForm(true)}
                      className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 font-bold"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Adicionar
                    </Button>
                  )}
                </div>

                {/* Lista de Endereços */}
                <div className="space-y-3">
                  {isLoadingAddresses ? (
                    <div className="py-4 text-center text-sm text-gray-400">Carregando...</div>
                  ) : addresses.length === 0 && !showAddressForm ? (
                    <p className="text-sm text-gray-400 text-center py-2">Nenhum endereço cadastrado.</p>
                  ) : (
                    addresses.map((addr) => (
                      <div key={addr.id} className={`p-4 rounded-xl border-2 ${addr.is_default ? 'border-yellow-500 bg-yellow-50' : 'border-gray-100'} relative group`}>
                        <div className="pr-8">
                          <p className="font-bold text-gray-800 text-sm">{addr.street}, {addr.number}</p>
                          <p className="text-xs text-gray-500">{addr.neighborhood} - {addr.city}</p>
                          {addr.is_default && <span className="inline-block mt-1 text-[10px] font-black text-yellow-600 uppercase tracking-wider">Padrão</span>}
                        </div>
                        <div className="absolute right-2 top-2 flex gap-1">
                          {!addr.is_default && (
                            <Button variant="ghost" size="icon" onClick={() => handleSetDefault(addr.id)} className="h-8 w-8 text-gray-300 hover:text-blue-500">
                              <Settings className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteAddress(addr.id)} className="h-8 w-8 text-gray-300 hover:text-red-500">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Formulário de Endereço */}
                  {showAddressForm && (
                    <div className="mt-4 p-4 border-2 border-dashed border-gray-100 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <Label className="text-xs font-bold text-gray-500">CEP</Label>
                          <Input
                            placeholder="00000-000"
                            value={newAddress.cep}
                            onChange={(e) => handleCepChange(e.target.value)}
                            maxLength={9}
                            className="h-10 rounded-xl border-gray-100"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs font-bold text-gray-500">Rua</Label>
                          <Input
                            placeholder="Nome da rua"
                            value={newAddress.street}
                            onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                            className="h-10 rounded-xl border-gray-100"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-bold text-gray-500">Número</Label>
                          <Input
                            placeholder="123"
                            value={newAddress.number}
                            onChange={(e) => setNewAddress({ ...newAddress, number: e.target.value })}
                            className="h-10 rounded-xl border-gray-100"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-bold text-gray-500">Bairro</Label>
                          <Input
                            placeholder="Bairro"
                            value={newAddress.neighborhood}
                            onChange={(e) => setNewAddress({ ...newAddress, neighborhood: e.target.value })}
                            className="h-10 rounded-xl border-gray-100"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button onClick={handleAddAddress} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-bold">
                          Salvar
                        </Button>
                        <Button variant="ghost" onClick={() => setShowAddressForm(false)} className="rounded-xl text-gray-400">
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {isAdmin && (
                <button 
                  onClick={() => router.push("/admin")}
                  className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-yellow-50 flex items-center justify-center text-yellow-600">
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-gray-800">Painel Admin</p>
                      <p className="text-xs text-gray-400">Gerenciar loja e pedidos</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-300" />
                </button>
              )}
            </div>

            <p className="text-center text-[10px] text-gray-300 uppercase font-black tracking-widest pt-4">
              Batatop Iacanga • Versão 1.1
            </p>
          </div>
        </div>
      </main>
      <Footer />
      <OrderSummary />
    </div>
  )
}
