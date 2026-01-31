"use client"

import { HeaderWrapper } from "@/components/header-wrapper"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { User, Mail, Phone, Calendar, ArrowLeft, Save } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { OrderSummary } from "@/components/order-summary"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export default function MeusDadosPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    birth_date: "",
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.user_metadata?.full_name || "",
        phone: user.user_metadata?.phone || "",
        birth_date: user.user_metadata?.birth_date || "",
      })
    }
  }, [user])

  const handleSave = async () => {
    if (!user) return

    if (formData.full_name.trim().length < 3) {
      alert("Por favor, insira seu nome completo.")
      return
    }

    const phoneDigits = formData.phone.replace(/\D/g, "")
    if (phoneDigits.length > 0 && phoneDigits.length < 10) {
      alert("Por favor, insira um telefone válido com DDD.")
      return
    }
    
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: formData.full_name.trim(),
          phone: formData.phone,
          birth_date: formData.birth_date,
        }
      })

      if (error) throw error
      
      alert("Dados atualizados com sucesso!")
    } catch (error) {
      console.error("Erro ao atualizar dados:", error)
      alert("Erro ao atualizar dados. Tente novamente.")
    } finally {
      setSaving(false)
    }
  }

  const handlePhoneChange = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 11) {
      let formatted = ""
      if (numbers.length > 0) formatted = `(${numbers.substring(0, 2)}`
      if (numbers.length > 2) formatted += `) ${numbers.substring(2, 7)}`
      if (numbers.length > 7) formatted += `-${numbers.substring(7, 11)}`
      setFormData({ ...formData, phone: formatted })
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <HeaderWrapper />
      <main className="flex-1 py-8 pb-24 lg:pb-8">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Cabeçalho */}
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.back()}
              className="h-10 w-10 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-black text-gray-800">Meus Dados</h1>
              <p className="text-sm text-gray-500">Gerencie suas informações pessoais</p>
            </div>
          </div>

          {/* Formulário */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
            {/* Nome Completo */}
            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <User className="h-4 w-4 text-yellow-500" />
                Nome Completo
              </Label>
              <Input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Digite seu nome completo"
                className="h-12 rounded-xl border-gray-200 focus:border-yellow-300"
              />
            </div>

            {/* Email (Somente leitura) */}
            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Mail className="h-4 w-4 text-yellow-500" />
                Email
              </Label>
              <Input
                type="email"
                value={user.email || ""}
                disabled
                className="h-12 rounded-xl border-gray-200 bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-400">O email não pode ser alterado</p>
            </div>

            {/* Telefone */}
            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Phone className="h-4 w-4 text-yellow-500" />
                Telefone
              </Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="(00) 00000-0000"
                maxLength={15}
                className="h-12 rounded-xl border-gray-200 focus:border-yellow-300"
              />
            </div>

            {/* Data de Nascimento */}
            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-yellow-500" />
                Data de Nascimento
              </Label>
              <Input
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                className="h-12 rounded-xl border-gray-200 focus:border-yellow-300"
              />
            </div>

            {/* Botão Salvar */}
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="w-full h-12 bg-yellow-500 hover:bg-yellow-600 text-white font-black rounded-xl text-base shadow-lg shadow-yellow-100 transition-all active:scale-95"
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Salvando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-5 w-5" />
                  Salvar Alterações
                </div>
              )}
            </Button>
          </div>

          {/* Informações Adicionais */}
          <div className="mt-6 bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <p className="text-sm text-blue-800 font-bold">💡 Dica</p>
            <p className="text-xs text-blue-600 mt-1">
              Mantenha seus dados atualizados para facilitar a entrega dos seus pedidos e receber promoções exclusivas!
            </p>
          </div>
        </div>
      </main>
      <Footer />
      <OrderSummary />
    </div>
  )
}
