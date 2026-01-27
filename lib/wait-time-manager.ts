import { getSupabaseBrowserClient } from "./supabase/client"

export interface WaitTimeState {
  baseTime: number
  additionalTime: number
  lastOrderTime: number
}

class WaitTimeManager {
  private supabase = getSupabaseBrowserClient()

  async getWaitTime(): Promise<WaitTimeState> {
    const { data, error } = await this.supabase.from("wait_time_state").select("*").limit(1).single()

    if (error || !data) {
      return { baseTime: 15, additionalTime: 0, lastOrderTime: Date.now() }
    }

    const state: WaitTimeState = {
      baseTime: data.base_time,
      additionalTime: data.additional_time,
      lastOrderTime: new Date(data.last_order_time).getTime(),
    }

    // Check if we need to decay (após 10 minutos, remove 5 minutos do tempo adicional)
    const timeSinceLastOrder = (Date.now() - state.lastOrderTime) / 1000 / 60
    if (timeSinceLastOrder >= 10 && state.additionalTime > 0) {
      const newAdditionalTime = Math.max(0, state.additionalTime - 5)
      // Atualizar no banco
      await this.supabase.from("wait_time_state").upsert({
        base_time: state.baseTime,
        additional_time: newAdditionalTime,
        last_order_time: new Date(Date.now()).toISOString(),
      })
      return { baseTime: state.baseTime, additionalTime: newAdditionalTime, lastOrderTime: Date.now() }
    }

    return state
  }

  async addOrder(): Promise<void> {
    const current = await this.getWaitTime()
    const newState: WaitTimeState = {
      baseTime: 15,
      additionalTime: current.additionalTime + 5,
      lastOrderTime: Date.now(),
    }

    await this.supabase.from("wait_time_state").upsert({
      base_time: newState.baseTime,
      additional_time: newState.additionalTime,
      last_order_time: new Date(newState.lastOrderTime).toISOString(),
    })
  }

  async getTotalMinutes(): Promise<number> {
    const state = await this.getWaitTime()
    return state.baseTime + state.additionalTime
  }

  async getTimeRange(): Promise<string> {
    const total = await this.getTotalMinutes()
    const max = Math.min(total + 7, total + 10)
    return `${total}-${max} min`
  }
}

export const waitTimeManager = new WaitTimeManager()
