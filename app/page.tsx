import { HeaderWrapper } from "@/components/header-wrapper"
import { Hero } from "@/components/hero"
import { FeaturedProducts } from "@/components/featured-products"
import { Footer } from "@/components/footer"
import { OrderSummary } from "@/components/order-summary"
import { productsManager } from "@/lib/products-db"

export default async function Home() {
  // Busca dados reais do Supabase
  const [batatas, macarrao, mostRequestedData, totalCustomers, topBatatasNames] = await Promise.all([
    productsManager.getBatatas(),
    productsManager.getMacarrao(),
    productsManager.getMostRequestedProduct(),
    productsManager.getTotalCustomers(),
    productsManager.getRealRankingByCategory("batata"),
  ])

  // Filtra os produtos para destaque (Batatas e Macarrão)
  // Pegamos as batatas e macarrões que estão no topo do ranking real
  const topBatatas = [...batatas].sort((a, b) => {
    const indexA = topBatatasNames.indexOf(a.name)
    const indexB = topBatatasNames.indexOf(b.name)
    if (indexA === -1 && indexB === -1) return 0
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    return indexA - indexB
  }).slice(0, 3)
  
  const topMacarraoNames = await productsManager.getRealRankingByCategory("macarrao")
  const topMacarrao = [...macarrao].sort((a, b) => {
    const indexA = topMacarraoNames.indexOf(a.name)
    const indexB = topMacarraoNames.indexOf(b.name)
    if (indexA === -1 && indexB === -1) return 0
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    return indexA - indexB
  }).slice(0, 3)

  const topProducts = [...topBatatas, ...topMacarrao]

  // Passa dados reais para os componentes
  return (
    <div className="min-h-screen flex flex-col">
      <HeaderWrapper />
      <main className="flex-1">
        {/* Hero com dados reais do produto mais pedido e total de clientes */}
        <Hero 
          mostRequestedProduct={mostRequestedData.product}
          totalOrders={mostRequestedData.totalOrders}
          customerPhotos={mostRequestedData.customerPhotos}
          totalCustomers={totalCustomers}
        />
        
        {/* FeaturedProducts com destaque para o mais pedido e ordenação por ranking */}
        <FeaturedProducts 
          products={topProducts}
          mostRequestedProductId={mostRequestedData.product.id}
          topBatatasNames={topBatatasNames}
        />
      </main>
      <Footer />
      <OrderSummary />
    </div>
  )
}
