// Sistema de gerenciamento de status da loja e tempo de espera com FILA INDEPENDENTE
import { getSupabaseBrowserClient } from "./supabase/client"

export interface StoreStatus {
  isOpen: boolean
  isDeliveryEnabled: boolean // Novo campo para controle de entregas
  waitTimeMin: number
  waitTimeMax: number
  activeOrders?: number[] // Lista de timestamps (ms) de cada pedido realizado
  manualOverride?: boolean // Se true, ignora horário automático
  lastManualChange?: string // Timestamp da última mudança manual
}

class StoreStatusManager {
  private get supabase() {
    return getSupabaseBrowserClient()
  }
  private settingKey = "store_status"
  private defaultWaitTime = { min: 15, max: 22 }
  private cachedStatus: StoreStatus | null = null

  // Constantes de horário
  private readonly OPENING_HOUR = 10 // 10:00
  private readonly CLOSING_HOUR = 23 // 23:30
  private readonly CLOSING_MINUTE = 30

  // Métodos síncronos para UI rápida
  isStoreOpenSync(): boolean {
    return this.cachedStatus?.isOpen ?? true
  }

  getWaitTimeSync(): { min: number; max: number } {
    return {
      min: this.cachedStatus?.waitTimeMin ?? this.defaultWaitTime.min,
      max: this.cachedStatus?.waitTimeMax ?? this.defaultWaitTime.max
    }
  }

  /**
   * Verifica se a loja deve estar aberta baseado no horário automático
   * Retorna true se está dentro do horário de funcionamento
   */
  private shouldBeOpenBySchedule(): boolean {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()

    // Abre às 10:00 e fecha às 23:30
    const openingTime = this.OPENING_HOUR * 60 // 600 minutos
    const closingTime = this.CLOSING_HOUR * 60 + this.CLOSING_MINUTE // 1410 minutos
    const currentTime = currentHour * 60 + currentMinute

    return currentTime >= openingTime && currentTime < closingTime
  }

  private processActiveOrders(status: StoreStatus): StoreStatus {
    const now = Date.now()
    const tenMinutesInMs = 10 * 60 * 1000
    const orders = status.activeOrders || []
    
    // Filtra apenas pedidos feitos nos últimos 10 minutos
    const validOrders = orders.filter(timestamp => (now - timestamp) < tenMinutesInMs)
    const additionalTime = validOrders.length * 5

    return {
      ...status,
      activeOrders: validOrders,
      waitTimeMin: this.defaultWaitTime.min + additionalTime,
      waitTimeMax: this.defaultWaitTime.max + additionalTime
    }
  }

  async getStatus(): Promise<StoreStatus> {
    try {
      const { data, error } = await this.supabase
        .from("store_settings")
        .select("setting_value")
        .eq("setting_key", this.settingKey)
        .maybeSingle()

      if (error) {
        // Silenciamos erros de conexão no localhost para não travar a interface
        return this.cachedStatus || this.getDefaultStatus()
      }

      let status: StoreStatus
      if (!data) {
        status = this.getDefaultStatus()
        await this.saveStatus(status)
      } else {
        status = data.setting_value as StoreStatus
      }

      // Aplica horário automático se não houver override manual
      if (!status.manualOverride) {
        const shouldBeOpen = this.shouldBeOpenBySchedule()
        if (status.isOpen !== shouldBeOpen) {
          status.isOpen = shouldBeOpen
          await this.saveStatus(status)
        }
      }

      const adjustedStatus = this.processActiveOrders(status)
      
      if (JSON.stringify(status.activeOrders) !== JSON.stringify(adjustedStatus.activeOrders)) {
        await this.saveStatus(adjustedStatus)
      }

      this.cachedStatus = adjustedStatus
      return adjustedStatus
    } catch (err) {
      return this.cachedStatus || this.getDefaultStatus()
    }
  }

  private getDefaultStatus(): StoreStatus {
    return {
      isOpen: this.shouldBeOpenBySchedule(),
      isDeliveryEnabled: true, // Padrão: entregas ativas
      waitTimeMin: this.defaultWaitTime.min,
      waitTimeMax: this.defaultWaitTime.max,
      activeOrders: [],
      manualOverride: false,
      lastManualChange: undefined
    }
  }

  async toggleStoreStatus(): Promise<boolean> {
    const status = await this.getStatus()
    const newStatus = {
      ...status,
      isOpen: !status.isOpen,
      manualOverride: true, // Marca como override manual
      lastManualChange: new Date().toISOString()
    }
    await this.saveStatus(newStatus)
    return newStatus.isOpen
  }

  async toggleDeliveryStatus(): Promise<boolean> {
    const status = await this.getStatus()
    const newStatus = {
      ...status,
      isDeliveryEnabled: !status.isDeliveryEnabled
    }
    await this.saveStatus(newStatus)
    return newStatus.isDeliveryEnabled
  }

  /**
   * Remove o override manual e volta a usar o horário automático
   */
  async resetToAutoSchedule(): Promise<StoreStatus> {
    const status = await this.getStatus()
    const shouldBeOpen = this.shouldBeOpenBySchedule()
    const newStatus = {
      ...status,
      isOpen: shouldBeOpen,
      manualOverride: false,
      lastManualChange: undefined
    }
    await this.saveStatus(newStatus)
    return newStatus
  }

  /**
   * Retorna informações sobre o status de agendamento
   */
  getScheduleInfo(): {
    openingTime: string
    closingTime: string
    isManualOverride: boolean
    shouldBeOpenNow: boolean
  } {
    return {
      openingTime: `${String(this.OPENING_HOUR).padStart(2, '0')}:00`,
      closingTime: `${String(this.CLOSING_HOUR).padStart(2, '0')}:${String(this.CLOSING_MINUTE).padStart(2, '0')}`,
      isManualOverride: this.cachedStatus?.manualOverride ?? false,
      shouldBeOpenNow: this.shouldBeOpenBySchedule()
    }
  }

  /**
   * ADICIONA UM NOVO PEDIDO À FILA (Incrementa 5 minutos)
   */
  async addOrderIncrement(): Promise<StoreStatus> {
    const currentStatus = await this.getStatus()
    const newOrders = [...(currentStatus.activeOrders || []), Date.now()]
    const additionalTime = newOrders.length * 5
    
    const newStatus = {
      ...currentStatus,
      activeOrders: newOrders,
      waitTimeMin: this.defaultWaitTime.min + additionalTime,
      waitTimeMax: this.defaultWaitTime.max + additionalTime
    }
    
    await this.saveStatus(newStatus)
    return newStatus
  }

  /**
   * ALIAS PARA COMPATIBILIDADE: incrementWaitTime
   * Mantido para evitar erros caso o checkout chame este nome.
   */
  async incrementWaitTime(minutes: number = 5): Promise<StoreStatus> {
    // Ignoramos o parâmetro 'minutes' e usamos sempre 5 para manter a lógica da fila
    return this.addOrderIncrement()
  }

  /**
   * ALIAS PARA COMPATIBILIDADE: decrementWaitTime
   */
  async decrementWaitTime(minutes: number = 5): Promise<StoreStatus> {
    const status = await this.getStatus()
    const orders = status.activeOrders || []
    // Remove o pedido mais antigo se houver
    const newOrders = orders.length > 0 ? orders.slice(1) : []
    const additionalTime = newOrders.length * 5
    
    const newStatus = {
      ...status,
      activeOrders: newOrders,
      waitTimeMin: this.defaultWaitTime.min + additionalTime,
      waitTimeMax: this.defaultWaitTime.max + additionalTime
    }
    await this.saveStatus(newStatus)
    return newStatus
  }

  /**
   * ALIAS PARA COMPATIBILIDADE: removeOrderDecrement
   */
  async removeOrderDecrement(): Promise<StoreStatus> {
    return this.decrementWaitTime()
  }

  async resetWaitTime(): Promise<StoreStatus> {
    const newStatus = {
      ...this.getDefaultStatus(),
      activeOrders: []
    }
    await this.saveStatus(newStatus)
    return newStatus
  }

  private async saveStatus(status: StoreStatus): Promise<void> {
    try {
      const { error } = await this.supabase
        .from("store_settings")
        .upsert(
          {
            setting_key: this.settingKey,
            setting_value: status,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "setting_key" }
        )

      if (error) throw error

      this.cachedStatus = status

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("store-status-changed", { detail: status }))
      }
    } catch (err) {
      console.error("[StoreStatusManager] Error in saveStatus:", err)
    }
  }

  /**
   * Inicia verificação periódica do horário automático
   * Deve ser chamado uma vez quando a aplicação inicia
   */
  startAutoScheduleCheck(): void {
    // Verifica a cada minuto se o status deve mudar
    setInterval(async () => {
      const status = await this.getStatus()
      // O método getStatus já aplica a lógica de horário automático
    }, 60000) // A cada 60 segundos
  }
}

export const storeStatusManager = new StoreStatusManager()