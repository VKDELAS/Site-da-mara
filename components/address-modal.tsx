"use client"

import { useState, useEffect } from "react"
import { X, MapPin, Plus, Search, Check, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addressesManager, type Address } from "@/lib/addresses-manager"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

interface AddressModalProps {
  isOpen: boolean
  onClose: () => void
  onAddressSelect?: (address: Address) => void
}

export function AddressModal({ isOpen, onClose, onAddressSelect }: AddressModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  
  // Estados do formulário
  const [cep, setCep] = useState("")
  const [rua, setRua] = useState("")
  const [numero, setNumero] = useState("")
  const [complemento, setComplemento] = useState("")
  const [bairro, setBairro] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen && user) {
      loadAddresses()
    }
  }, [isOpen, user])

  const loadAddresses = async () => {
    if (!user) return
    setLoading(true)
    const data = await addressesManager.getUserAddresses(user.id)
    setAddresses(data)
    setLoading(false)
  }

  const handleCepChange = async (value: string) => {
    const formatted = value.replace(/\D/g, "").replace(/(\d{5})(\d)/, "$1-$2").substring(0, 9)
    setCep(formatted)

    if (formatted.replace(/\D/g, "").length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${formatted.replace(/\D/g, "")}/json/`)
        const data = await response.json()
        
        if (data.erro) {
          toast({
            title: "CEP não encontrado",
            description: "Por favor, verifique o número digitado.",
            variant: "destructive",
          })
          return
        }

        // Validação de cidade (Iacanga)
        if (data.localidade.toLowerCase() !== "iacanga") {
          toast({
            title: "Fora da área de entrega",
            description: `Desculpe, entregamos apenas em Iacanga. O CEP informado pertence a ${data.localidade}/${data.uf}.`,
            variant: "destructive",
          })
          resetForm()
          return
        }

        setRua(data.logradouro || "")
        setBairro(data.bairro || "")
      } catch (error) {
        console.error("Erro ao buscar CEP:", error)
      }
    }
  }

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    setIsSubmitting(true)
    const newAddress = await addressesManager.addAddress({
      user_id: user.id,
      street: rua,
      number: numero,
      complement: complemento,
      neighborhood: bairro,
      city: "Iacanga",
      state: "SP",
      cep: cep,
      is_default: addresses.length === 0 // Primeiro endereço vira padrão
    })

    if (newAddress) {
      await loadAddresses()
      setShowAddForm(false)
      resetForm()
    }
    setIsSubmitting(false)
  }

  const resetForm = () => {
    setCep("")
    setRua("")
    setNumero("")
    setComplemento("")
    setBairro("")
  }

  const handleSelectDefault = async (addressId: string) => {
    if (!user) return
    await addressesManager.setDefaultAddress(user.id, addressId)
    await loadAddresses()
    // Dispara evento para o Header atualizar
    window.dispatchEvent(new Event("address-changed"))
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    // Usando um confirm simples, mas poderíamos usar um modal customizado se necessário.
    // Para manter a agilidade, vamos manter o confirm mas adicionar um toast após a exclusão.
    if (confirm("Deseja excluir este endereço?")) {
      await addressesManager.deleteAddress(id)
      await loadAddresses()
      window.dispatchEvent(new Event("address-changed"))
      toast({
        title: "Endereço excluído",
        description: "O endereço foi removido com sucesso.",
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* HEADER DO MODAL */}
        <div className="p-6 border-b flex items-center justify-between bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-yellow-600" />
            Onde você quer receber seu pedido?
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!showAddForm ? (
            <div className="space-y-4">
              {/* LISTA DE ENDEREÇOS */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Loader2 className="h-8 w-8 animate-spin mb-2" />
                  <p>Carregando seus endereços...</p>
                </div>
              ) : addresses.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Meus Endereços</p>
                  {addresses.map((addr) => (
                    <div 
                      key={addr.id}
                      onClick={() => handleSelectDefault(addr.id)}
                      className={`group relative p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        addr.is_default 
                        ? "border-yellow-600 bg-yellow-50/30" 
                        : "border-gray-100 hover:border-yellow-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 p-2 rounded-full ${addr.is_default ? "bg-yellow-600 text-white" : "bg-gray-100 text-gray-400"}`}>
                          <MapPin className="h-4 w-4" />
                        </div>
                        <div className="flex-1 pr-8">
                          <p className="font-bold text-gray-800">{addr.street}, {addr.number}</p>
                          <p className="text-sm text-gray-500">{addr.neighborhood} - {addr.city}/{addr.state}</p>
                          {addr.complement && <p className="text-xs text-gray-400 mt-1 italic">{addr.complement}</p>}
                        </div>
                        {addr.is_default && (
                          <div className="absolute top-4 right-4">
                            <Check className="h-5 w-5 text-yellow-600" />
                          </div>
                        )}
                        <button 
                          onClick={(e) => handleDelete(e, addr.id)}
                          className="absolute bottom-4 right-4 p-2 text-gray-300 hover:text-yellow-600 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="h-8 w-8 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium">Você ainda não tem endereços cadastrados.</p>
                </div>
              )}

              {/* BOTÃO ADICIONAR NOVO */}
              <Button 
                onClick={() => setShowAddForm(true)}
                variant="outline" 
                className="w-full h-14 border-dashed border-2 border-gray-200 hover:border-yellow-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-xl flex items-center justify-center gap-2 font-bold transition-all"
              >
                <Plus className="h-5 w-5" />
                Adicionar novo endereço
              </Button>
            </div>
          ) : (
            /* FORMULÁRIO DE ADIÇÃO */
            <form onSubmit={handleAddAddress} className="space-y-4 animate-in slide-in-from-right-4 duration-200">
              <div className="flex items-center gap-2 mb-6">
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)}
                  className="text-sm font-bold text-yellow-600 hover:underline"
                >
                  ← Voltar para a lista
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>CEP</Label>
                  <Input 
                    value={cep} 
                    onChange={(e) => handleCepChange(e.target.value)}
                    placeholder="00000-000" 
                    maxLength={9}
                    required
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Rua</Label>
                  <Input value={rua} onChange={(e) => setRua(e.target.value)} placeholder="Nome da rua" required />
                </div>
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Ex: 123" required />
                </div>
                <div className="space-y-2">
                  <Label>Complemento</Label>
                  <Input value={complemento} onChange={(e) => setComplemento(e.target.value)} placeholder="Apto, bloco..." />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Bairro</Label>
                  <Input value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Nome do bairro" required />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full h-12 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-xl mt-6"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Salvar Endereço"}
              </Button>
            </form>
          )}
        </div>

        <div className="p-4 bg-gray-50 text-center">
          <p className="text-[11px] text-gray-400 font-medium uppercase tracking-widest">
            Entregamos apenas em Iacanga, SP
          </p>
        </div>
      </div>
    </div>
  )
}
