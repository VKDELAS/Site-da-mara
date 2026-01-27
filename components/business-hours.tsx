"use client"

import { Clock, Power } from "lucide-react"
import { useEffect, useState } from "react"
import { storeStatusManager } from "@/lib/store-status-manager"

interface BusinessHoursProps {
  showToggle?: boolean // Para mostrar botão de toggle no admin
}

export function BusinessHours({ showToggle = false }: BusinessHoursProps) {
  const [currentTime, setCurrentTime] = useState<string>("")
  const [isOpen, setIsOpen] = useState(true)
  const [waitTime, setWaitTime] = useState({ min: 15, max: 22 })

  const updateStatus = async () => {
    const status = await storeStatusManager.getStatus()
    setIsOpen(status.isOpen)
    setWaitTime({ min: status.waitTimeMin, max: status.waitTimeMax })
  }

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }))
    }

    updateTime()
    updateStatus()

    const timeInterval = setInterval(updateTime, 60000)
    const statusUpdateInterval = setInterval(updateStatus, 5000)

    // Escuta mudanças no status da loja
    const handleStatusChange = () => updateStatus()
    window.addEventListener("store-status-changed", handleStatusChange)

    return () => {
      clearInterval(timeInterval)
      clearInterval(statusUpdateInterval)
      window.removeEventListener("store-status-changed", handleStatusChange)
    }
  }, [])

  const handleToggle = () => {
    storeStatusManager.toggleStoreStatus()
    updateStatus()
  }

  return (
    <div className="flex items-center gap-4 text-sm flex-wrap">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        <span className="text-gray-600">Horário: {currentTime}</span>
      </div>

      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          isOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}
      >
        {isOpen ? "Aberto" : "Fechado"}
      </span>

      {isOpen && (
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
          <Clock className="h-3 w-3" />
          <span>
            Tempo de espera: {waitTime.min}-{waitTime.max} min
          </span>
        </div>
      )}

      {showToggle && (
        <button
          onClick={handleToggle}
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            isOpen ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-green-100 text-green-700 hover:bg-green-200"
          }`}
        >
          <Power className="h-3 w-3" />
          {isOpen ? "Fechar Loja" : "Abrir Loja"}
        </button>
      )}
    </div>
  )
}
