"use client"

import { Clock, Power, Truck, DollarSign, Calendar, Save, RotateCcw, AlertCircle, CheckCircle2 } from "lucide-react"
import { useEffect, useState } from "react"
import { storeStatusManager, StoreStatus } from "@/lib/store-status-manager"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"

interface BusinessHoursProps {
  showToggle?: boolean // Quando true, exibe a interface administrativa completa no painel
}

export function BusinessHours({ showToggle = false }: BusinessHoursProps) {
  const { toast } = useToast()
  const [currentTime, setCurrentTime] = useState<string>("")
  const [status, setStatus] = useState<StoreStatus | null>(null)
  const [openTimeInput, setOpenTimeInput] = useState<string>("10:00")
  const [closeTimeInput, setCloseTimeInput] = useState<string>("22:00")
  const [autoScheduleInput, setAutoScheduleInput] = useState<boolean>(true)
  const [isSaving, setIsSaving] = useState<boolean>(false)

  const updateStatus = async () => {
    const s = await storeStatusManager.getStatus()
    setStatus(s)
    if (s.openTime) setOpenTimeInput(s.openTime)
    if (s.closeTime) setCloseTimeInput(s.closeTime)
    if (s.autoSchedule !== undefined) setAutoScheduleInput(s.autoSchedule)
  }

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString("pt-BR", {
          timeZone: "America/Sao_Paulo",
          hour: "2-digit",
          minute: "2-digit",
        })
      )
    }

    updateTime()
    updateStatus()

    const timeInterval = setInterval(updateTime, 30000)
    const statusUpdateInterval = setInterval(updateStatus, 5000)

    // Escuta mudanças no status da loja (disparadas no navegador)
    const handleStatusChange = () => updateStatus()
    window.addEventListener("store-status-changed", handleStatusChange)

    return () => {
      clearInterval(timeInterval)
      clearInterval(statusUpdateInterval)
      window.removeEventListener("store-status-changed", handleStatusChange)
    }
  }, [])

  const handleToggleStoreManual = async () => {
    const newOpenState = await storeStatusManager.toggleStoreStatus()
    await updateStatus()
    toast({
      title: newOpenState ? "Loja Aberta Manualmente" : "Loja Fechada Manualmente",
      description: `Sobreposição manual ativa. O status retornará ao agendamento automático no próximo ciclo (${newOpenState ? status?.closeTime || "22:00" : status?.openTime || "10:00"}).`,
    })
  }

  const handleResetToAuto = async () => {
    await storeStatusManager.resetToAutoSchedule()
    await updateStatus()
    toast({
      title: "Modo Automático Restaurado",
      description: "A loja voltou a seguir estritamente o horário programado de funcionamento.",
    })
  }

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await storeStatusManager.updateSchedule(openTimeInput, closeTimeInput, autoScheduleInput)
      await updateStatus()
      toast({
        title: "Horários Salvos com Sucesso!",
        description: `Abertura programada: ${openTimeInput} | Fechamento programado: ${closeTimeInput}`,
      })
    } catch (err) {
      toast({
        title: "Erro ao salvar horários",
        description: "Não foi possível persistir os novos horários no banco.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleDelivery = async () => {
    await storeStatusManager.toggleDeliveryStatus()
    await updateStatus()
  }

  const handleToggleDeliveryFee = async () => {
    await storeStatusManager.toggleDeliveryFeeStatus()
    await updateStatus()
  }

  const isOpen = status?.isOpen ?? true
  const isDeliveryEnabled = status?.isDeliveryEnabled ?? true
  const isDeliveryFeeEnabled = status?.isDeliveryFeeEnabled ?? true
  const deliveryFee = status?.deliveryFee ?? 3.0
  const waitTime = { min: status?.waitTimeMin ?? 15, max: status?.waitTimeMax ?? 22 }
  const isManualOverride = status?.manualOverride ?? false
  const autoSchedule = status?.autoSchedule ?? true
  const openTime = status?.openTime || "10:00"
  const closeTime = status?.closeTime || "22:00"

  // Se for apenas visualização simples (ex: cabeçalhos ou rodapés não-admin)
  if (!showToggle) {
    return (
      <div className="flex items-center gap-4 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-yellow-600" />
          <span className="text-gray-600 font-medium">Horário: {currentTime}</span>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-bold ${
            isOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {isOpen ? "Aberto" : "Fechado"}
        </span>

        {isOpen && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-50 text-yellow-700 text-xs font-bold">
            <Clock className="h-3.5 w-3.5" />
            <span>
              Espera: {waitTime.min}-{waitTime.max} min
            </span>
          </div>
        )}
      </div>
    )
  }

  // Visualização Administrativa Completa no Painel
  return (
    <div className="space-y-6">
      {/* Linha 1: Status Atual e Indicador de Modo */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-gray-700 font-bold bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-xs">
            <Clock className="h-4 w-4 text-yellow-500" />
            <span>Iacanga-SP: {currentTime}</span>
          </div>

          <span
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-black tracking-wide shadow-xs ${
              isOpen
                ? "bg-emerald-500 text-white shadow-emerald-100"
                : "bg-red-500 text-white shadow-red-100"
            }`}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOpen ? "bg-emerald-200" : "bg-red-200"}`} />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
            </span>
            {isOpen ? "LOJA ABERTA" : "LOJA FECHADA"}
          </span>

          <span
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${
              isManualOverride
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-blue-50 text-blue-700 border-blue-200"
            }`}
          >
            {isManualOverride ? (
              <>
                <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                <span>Sobreposição Manual Ativa (retorna no próximo ciclo)</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                <span>Modo Automático Ativo ({openTime} às {closeTime})</span>
              </>
            )}
          </span>

          {isOpen && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-100/70 text-yellow-800 text-xs font-bold">
              <Clock className="h-3.5 w-3.5 text-yellow-600" />
              <span>Fila: {waitTime.min}-{waitTime.max} min</span>
            </div>
          )}
        </div>

        {/* Botões de Ação Imediata */}
        <div className="flex items-center gap-2 flex-wrap">
          {isManualOverride && (
            <Button
              onClick={handleResetToAuto}
              variant="outline"
              size="sm"
              className="rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 font-bold text-xs h-9 gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5 text-blue-600" />
              Voltar ao Automático
            </Button>
          )}

          <Button
            onClick={handleToggleStoreManual}
            size="sm"
            className={`rounded-xl font-black text-xs h-9 gap-1.5 shadow-sm transition-transform active:scale-95 ${
              isOpen
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            <Power className="h-3.5 w-3.5" />
            {isOpen ? "Forçar Fechar Loja" : "Forçar Abrir Loja"}
          </Button>
        </div>
      </div>

      {/* Linha 2: Configuração de Horários Automáticos (Editável) */}
      <div className="bg-white p-5 rounded-2xl border border-yellow-100 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-yellow-600" />
          <h3 className="font-extrabold text-gray-900 text-sm md:text-base">
            Configurar Horários Automáticos de Funcionamento
          </h3>
        </div>

        <form onSubmit={handleSaveSchedule} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">
              Horário de Abertura:
            </label>
            <input
              type="time"
              value={openTimeInput}
              onChange={(e) => setOpenTimeInput(e.target.value)}
              required
              className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-yellow-400 focus:outline-hidden text-sm font-bold text-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">
              Horário de Fechamento:
            </label>
            <input
              type="time"
              value={closeTimeInput}
              onChange={(e) => setCloseTimeInput(e.target.value)}
              required
              className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-yellow-400 focus:outline-hidden text-sm font-bold text-gray-900"
            />
          </div>

          <div className="flex items-center gap-2 h-10">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-gray-700">
              <input
                type="checkbox"
                checked={autoScheduleInput}
                onChange={(e) => setAutoScheduleInput(e.target.checked)}
                className="w-4 h-4 rounded-sm text-yellow-500 border-gray-300 focus:ring-yellow-400"
              />
              Ativar ciclo automático
            </label>
          </div>

          <div>
            <Button
              type="submit"
              disabled={isSaving}
              className="w-full h-10 bg-yellow-500 hover:bg-yellow-600 text-white font-black rounded-xl text-xs gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Salvando..." : "Salvar Horários"}
            </Button>
          </div>
        </form>

        <p className="text-[11px] text-gray-400 mt-3">
          * A abertura e fechamento ocorrem autonomamente no Supabase às {openTime} e {closeTime}. Caso alguém force abrir/fechar manualmente, a loja respeitará a escolha até o próximo horário programado ser atingido.
        </p>
      </div>

      {/* Linha 3: Controles de Entregas e Taxa de Entrega (Preservados) */}
      <div className="flex items-center gap-2 flex-wrap pt-1">
        <Button
          onClick={handleToggleDelivery}
          variant="outline"
          size="sm"
          className={`rounded-xl text-xs font-bold h-9 gap-1.5 transition-colors ${
            isDeliveryEnabled
              ? "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
              : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
          }`}
        >
          <Truck className="h-3.5 w-3.5" />
          {isDeliveryEnabled ? "Pausar Entregas" : "Ativar Entregas"}
        </Button>

        <Button
          onClick={handleToggleDeliveryFee}
          variant="outline"
          size="sm"
          className={`rounded-xl text-xs font-bold h-9 gap-1.5 transition-colors ${
            isDeliveryFeeEnabled
              ? "border-yellow-200 bg-yellow-50 text-yellow-800 hover:bg-yellow-100"
              : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <DollarSign className="h-3.5 w-3.5" />
          {isDeliveryFeeEnabled ? `Taxa Ativa (R$ ${deliveryFee.toFixed(2)})` : "Taxa Desativada"}
        </Button>
      </div>
    </div>
  )
}
