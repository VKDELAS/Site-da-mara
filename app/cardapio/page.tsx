import { HeaderWrapper } from "@/components/header-wrapper"
import { Footer } from "@/components/footer"
import { OrderSummary } from "@/components/order-summary"
import { CardapioContentWrapper } from "@/components/cardapio-content-wrapper"
import { productsManager } from "@/lib/products-db"

// Força a revalidação da página para ser dinâmica (sempre atualizada)
export const revalidate = 0

export default async function CardapioPage() {
  const batatas = await productsManager.getBatatasSortedByPopularity()
  const macarrao = await productsManager.getMacarraoSortedByPopularity()
  const bebidas = await productsManager.getBebidasSortedByPopularity()
  
  // Pegar os 3 mais populares baseados no localStorage (simulando pedidos reais)
  // Se não houver dados, usamos os IDs 1, 2 e 3 como padrão (Strogonoff Alcatra, Frango e Calabresa)
  // Rankings REAIS baseados nas vendas do banco de dados
  const topBatatasNames = await productsManager.getRealRankingByCategory("batata")
  const topMacarraoNames = await productsManager.getRealRankingByCategory("macarrao")

  return (
    <div className="min-h-screen flex flex-col">
      <HeaderWrapper />
      <CardapioContentWrapper 
        batatas={batatas} 
        macarrao={macarrao} 
        bebidas={bebidas} 
        topBatatasNames={topBatatasNames}
        topMacarraoNames={topMacarraoNames}
      />
      <Footer />
      <OrderSummary />
    </div>
  )
}
