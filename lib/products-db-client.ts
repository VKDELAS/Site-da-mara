// Cliente-side product manager (não usa Supabase server client)

export interface Adicional {
  id: string
  name: string
  price: number
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: "batata" | "bebida" | "macarrao"
  available: boolean
  adicionais: Adicional[]
  createdAt: Date
  updatedAt: Date
}

// Gerenciador de adicionais usando localStorage (client-only)
class AdicionaisManager {
  private storageKey = "batatop-adicionais-global"

  getAdicionais(): Adicional[] {
    if (typeof window === "undefined") return []

    const stored = localStorage.getItem(this.storageKey)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return []
      }
    }
    return []
  }

  addAdicional(adicional: Omit<Adicional, "id">): Adicional {
    const adicionais = this.getAdicionais()
    const newAdicional: Adicional = {
      ...adicional,
      id: `add-${Date.now()}`,
    }
    adicionais.push(newAdicional)
    this.saveAdicionais(adicionais)
    return newAdicional
  }

  updateAdicional(id: string, updates: Partial<Adicional>): Adicional | null {
    const adicionais = this.getAdicionais()
    const index = adicionais.findIndex((a) => a.id === id)
    if (index === -1) return null

    adicionais[index] = {
      ...adicionais[index],
      ...updates,
    }
    this.saveAdicionais(adicionais)
    return adicionais[index]
  }

  deleteAdicional(id: string): boolean {
    const adicionais = this.getAdicionais()
    const filtered = adicionais.filter((a) => a.id !== id)
    if (filtered.length === adicionais.length) return false

    this.saveAdicionais(filtered)
    return true
  }

  private saveAdicionais(adicionais: Adicional[]): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.storageKey, JSON.stringify(adicionais))
    }
  }
}

export { adicionaisManager as adicionaisManager } from "./adicionais-manager"
