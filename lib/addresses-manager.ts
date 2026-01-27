import { createBrowserClient } from "./supabase/client"

export interface Address {
  id: string
  user_id: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  cep: string
  is_default: boolean
  created_at?: string
  updated_at?: string
}

class AddressesManager {
  // Usamos um getter para garantir que o cliente do Supabase esteja sempre pronto
  private get supabase() {
    return createBrowserClient()
  }

  async getUserAddresses(userId: string): Promise<Address[]> {
    try {
      if (!userId) {
        console.warn("[AddressesManager] Tentativa de buscar endereços sem userId")
        return []
      }

      const { data, error } = await this.supabase
        .from("addresses")
        .select("*")
        .eq("user_id", userId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[AddressesManager] Erro ao buscar endereços:", error.message, error.details)
        throw error
      }
      
      return data || []
    } catch (error: any) {
      console.error("[AddressesManager] Erro crítico em getUserAddresses:", error.message || error)
      return []
    }
  }

  async addAddress(address: Omit<Address, "id" | "created_at" | "updated_at">): Promise<Address | null> {
    try {
      const { data, error } = await this.supabase
        .from("addresses")
        .insert([address])
        .select()
        .single()

      if (error) {
        console.error("[AddressesManager] Erro ao adicionar endereço:", error.message, error.details)
        throw error
      }
      
      return data
    } catch (error: any) {
      console.error("[AddressesManager] Erro crítico em addAddress:", error.message || error)
      return null
    }
  }

  async updateAddress(id: string, updates: Partial<Address>): Promise<Address | null> {
    try {
      const { data, error } = await this.supabase
        .from("addresses")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("[AddressesManager] Erro ao atualizar endereço:", error.message, error.details)
        throw error
      }
      
      return data
    } catch (error: any) {
      console.error("[AddressesManager] Erro crítico em updateAddress:", error.message || error)
      return null
    }
  }

  async deleteAddress(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from("addresses")
        .delete()
        .eq("id", id)

      if (error) {
        console.error("[AddressesManager] Erro ao deletar endereço:", error.message, error.details)
        throw error
      }
      
      return true
    } catch (error: any) {
      console.error("[AddressesManager] Erro crítico em deleteAddress:", error.message || error)
      return false
    }
  }

  async setDefaultAddress(userId: string, addressId: string): Promise<boolean> {
    try {
      // Primeiro, remove o padrão de todos os outros endereços do usuário
      const { error: updateError } = await this.supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", userId)

      if (updateError) throw updateError

      // Depois, define o novo endereço como padrão
      const { error } = await this.supabase
        .from("addresses")
        .update({ is_default: true })
        .eq("id", addressId)
        .eq("user_id", userId)

      if (error) {
        console.error("[AddressesManager] Erro ao definir endereço padrão:", error.message, error.details)
        throw error
      }
      
      return true
    } catch (error: any) {
      console.error("[AddressesManager] Erro crítico em setDefaultAddress:", error.message || error)
      return false
    }
  }
}

export const addressesManager = new AddressesManager()
