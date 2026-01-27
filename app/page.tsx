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
  // Pegamos as batatas que estão no ranking e os macarrões iniciais
  const topBatatas = batatas.filter(p => 
    topBatatasNames.some(name => name.toLowerCase() === p.name.toLowerCase())
  ).slice(0, 3)
  
  const topMacarrao = macarrao.slice(0, 3)
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
