"use client"

import { Suspense } from "react"
import { CardapioContent } from "./cardapio-content"

interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  category?: "batata" | "bebida" | "macarrao"
}

interface CardapioContentProps {
  batatas: Product[]
  macarrao: Product[]
  bebidas: Product[]
  topBatatasNames?: string[]
  topMacarraoNames?: string[]
}

function CardapioContentFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
    </div>
  )
}

export function CardapioContentWrapper(props: CardapioContentProps) {
  return (
    <Suspense fallback={<CardapioContentFallback />}>
      <CardapioContent {...props} />
    </Suspense>
  )
}
