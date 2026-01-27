"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { HeaderWrapper } from "@/components/header-wrapper"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Ticket, Plus, Edit, Trash2, Percent, DollarSign, ArrowLeft, Calendar as CalendarIcon, ToggleLeft, User } from "lucide-react"
import { couponsManager, type Coupon } from "@/lib/cupons-manager"
import { format } from "date-fns"
import Link from "next/link"

const ADMIN_EMAILS = ["enzzobaraldo2008@gmail.com", "maraysis9010@gmail.com"]

export default function AdminCuponsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)

  const [formCode, setFormCode] = useState("")
  const [formDiscount, setFormDiscount] = useState("")
  const [formType, setFormType] = useState<"percentage" | "fixed">("percentage")
  const [formExpiryDate, setFormExpiryDate] = useState("") // Usando string para input date nativo
  const [formPermanent, setFormPermanent] = useState(false)
  const [formMaxUsage, setFormMaxUsage] = useState("")
  const [formMaxUsagePerUser, setFormMaxUsagePerUser] = useState("")

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
      } else if (user.email && ADMIN_EMAILS.includes(user.email)) {
        setIsAdmin(true)
        loadCoupons()
      } else {
        alert("Você não tem permissão para acessar esta página")
        router.push("/")
      }
    }
  }, [user, loading, router])

  const loadCoupons = async () => {
    const allCoupons = await couponsManager.getCoupons()
    setCoupons(allCoupons)
  }

  const handleOpenDialog = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon)
      setFormCode(coupon.code)
      setFormDiscount(coupon.discount.toString())
      setFormType(coupon.type)
      setFormPermanent(!coupon.expiresAt)
      setFormMaxUsage(coupon.maxUsage?.toString() || "")
      setFormMaxUsagePerUser(coupon.maxUsagePerUser?.toString() || "")
      // Formatar data para YYYY-MM-DD (formato do input date)
      if (coupon.expiresAt) {
        const date = new Date(coupon.expiresAt)
        setFormExpiryDate(date.toISOString().split('T')[0])
      } else {
        setFormExpiryDate("")
      }
    } else {
      setEditingCoupon(null)
      setFormCode("")
      setFormDiscount("")
      setFormType("percentage")
      setFormExpiryDate("")
      setFormPermanent(false)
      setFormMaxUsage("")
      setFormMaxUsagePerUser("")
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const discount = Number.parseFloat(formDiscount)
    if (Number.isNaN(discount) || discount <= 0) {
      alert("Desconto inválido")
      return
    }

    // Converter string de data de volta para objeto Date
    const expiresAt = formPermanent || !formExpiryDate ? null : new Date(formExpiryDate + "T23:59:59")
    const maxUsage = formMaxUsage ? Number.parseInt(formMaxUsage) : undefined
    const maxUsagePerUser = formMaxUsagePerUser ? Number.parseInt(formMaxUsagePerUser) : undefined

    if (editingCoupon) {
      await couponsManager.updateCoupon(editingCoupon.id, {
        code: formCode.toUpperCase(),
        discount,
        type: formType,
        expiresAt,
        maxUsage,
        maxUsagePerUser,
      })
    } else {
      await couponsManager.addCoupon({
        code: formCode.toUpperCase(),
        discount,
        type: formType,
        expiresAt,
        isActive: true,
        maxUsage,
        maxUsagePerUser,
      })
    }

    loadCoupons()
    setIsDialogOpen(false)
  }

  const handleDeleteCoupon = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este cupom?")) {
      await couponsManager.deleteCoupon(id)
      loadCoupons()
    }
  }

  const handleToggleActive = async (coupon: Coupon) => {
    await couponsManager.updateCoupon(coupon.id, { isActive: !coupon.isActive })
    loadCoupons()
  }

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

  const activeCoupons = coupons.filter((c) => c.isActive)
  const inactiveCoupons = coupons.filter((c) => !c.isActive)

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-yellow-50 via-white to-yellow-50">
      <HeaderWrapper />
      <main className="flex-1 py-8 px-4 md:px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8">
            <Link href="/admin">
              <Button variant="ghost" className="mb-6 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 font-semibold gap-2">
                <ArrowLeft className="h-5 w-5" />
                Voltar ao Painel
              </Button>
            </Link>

            <div className="flex items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-gradient-to-br from-purple-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Ticket className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-black text-gray-900">Gerenciar Cupons</h1>
                  <p className="text-gray-500 text-sm md:text-base">Crie e controle cupons de desconto</p>
                </div>
              </div>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600 text-white font-bold h-12 rounded-xl shadow-lg gap-2">
                    <Plus className="h-5 w-5" />
                    Novo Cupom
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl">
                  <DialogHeader className="pb-6 border-b">
                    <DialogTitle className="text-2xl font-black flex items-center gap-2">
                      <Ticket className="h-6 w-6 text-purple-500" />
                      {editingCoupon ? "Editar Cupom" : "Criar Novo Cupom"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div>
                      <Label className="text-sm font-bold text-gray-700 mb-2 block">Código do Cupom</Label>
                      <Input
                        value={formCode}
                        onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                        maxLength={20}
                        placeholder="Ex: PRIMEIRACOMPRA"
                        className="h-12 text-base border-2 focus:border-purple-300 rounded-xl"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-bold text-gray-700 mb-2 block">Tipo</Label>
                        <Select value={formType} onValueChange={(v: "percentage" | "fixed") => setFormType(v)}>
                          <SelectTrigger className="h-12 border-2 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                            <SelectItem value="fixed">Fixo (R$)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-bold text-gray-700 mb-2 block">Valor</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formDiscount}
                          onChange={(e) => setFormDiscount(e.target.value)}
                          className="h-12 border-2 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-bold text-gray-700 mb-2 block">Limite Global</Label>
                        <Input
                          type="number"
                          value={formMaxUsage}
                          onChange={(e) => setFormMaxUsage(e.target.value)}
                          placeholder="Ilimitado"
                          className="h-12 border-2 rounded-xl"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-bold text-gray-700 mb-2 block">Limite por Pessoa</Label>
                        <Input
                          type="number"
                          value={formMaxUsagePerUser}
                          onChange={(e) => setFormMaxUsagePerUser(e.target.value)}
                          placeholder="Ilimitado"
                          className="h-12 border-2 rounded-xl"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-bold text-gray-700 mb-2 block">Validade</Label>
                      <div className="flex items-center gap-4 p-3 border-2 rounded-xl">
                        <input
                          type="checkbox"
                          id="permanent"
                          checked={formPermanent}
                          onChange={(e) => setFormPermanent(e.target.checked)}
                          className="w-5 h-5 accent-purple-500"
                        />
                        <Label htmlFor="permanent" className="cursor-pointer font-semibold">Cupom Permanente (Sem expiração)</Label>
                      </div>
                    </div>

                    {!formPermanent && (
                      <div>
                        <Label className="text-sm font-bold text-gray-700 mb-2 block">Data de Vencimento</Label>
                        <div className="relative">
                          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                          <input
                            type="date"
                            value={formExpiryDate}
                            onChange={(e) => setFormExpiryDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full h-12 pl-10 pr-4 border-2 rounded-xl outline-none focus:border-purple-300 transition-all"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1 h-12 rounded-xl font-bold">
                        Cancelar
                      </Button>
                      <Button type="submit" className="flex-1 bg-purple-500 hover:bg-purple-600 text-white h-12 rounded-xl font-bold">
                        {editingCoupon ? "Atualizar" : "Criar"} Cupom
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-black text-gray-900 mb-4">Cupons Ativos ({activeCoupons.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeCoupons.map((coupon) => (
                <Card key={coupon.id} className="border-2 border-purple-200 rounded-2xl shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-2xl font-black text-gray-900">{coupon.code}</h3>
                        <span className="text-sm font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">
                          {coupon.type === "percentage" ? `${coupon.discount}%` : `R$ ${coupon.discount.toFixed(2)}`}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600 mb-4">
                      <p>Usos Globais: <b>{coupon.usageCount}{coupon.maxUsage ? `/${coupon.maxUsage}` : " (Ilimitado)"}</b></p>
                      <p>Limite por Pessoa: <b>{coupon.maxUsagePerUser || "Ilimitado"}</b></p>
                      <p>Expira em: <b>{coupon.expiresAt ? format(new Date(coupon.expiresAt), "dd/MM/yyyy") : "Nunca"}</b></p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleOpenDialog(coupon)} variant="outline" size="sm" className="flex-1 rounded-lg"><Edit className="h-4 w-4 mr-1" /> Editar</Button>
                      <Button onClick={() => handleDeleteCoupon(coupon.id)} variant="outline" size="sm" className="flex-1 text-red-600 border-red-100 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4 mr-1" /> Excluir</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
