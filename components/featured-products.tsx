"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/product-card"
import { Sparkles, ArrowRight } from "lucide-react"
import type { Product } from "@/lib/products-db"

interface FeaturedProductsProps {
  products: Product[]
  mostRequestedProductId?: string
  topBatatasNames?: string[]
}

export function FeaturedProducts({ products, mostRequestedProductId, topBatatasNames = [] }: FeaturedProductsProps) {
  // Ordenar os produtos: 
  // 1. Batatas do ranking (1º, 2º, 3º)
  // 2. Outros produtos
  const sortedProducts = [...products].sort((a, b) => {
    // Se topBatatasNames estiver vazio, mantém a ordem original
    if (topBatatasNames.length === 0) return 0;

    const indexA = topBatatasNames.findIndex(name => name.toLowerCase() === a.name.toLowerCase());
    const indexB = topBatatasNames.findIndex(name => name.toLowerCase() === b.name.toLowerCase());

    // Se ambos estão no ranking, ordena pela posição no ranking
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    
    // Se apenas A está no ranking, ele vem primeiro
    if (indexA !== -1) return -1;
    
    // Se apenas B está no ranking, ele vem primeiro
    if (indexB !== -1) return 1;

    // Se nenhum está no ranking, mantém a ordem original
    return 0;
  });

  return (
    <section className="py-20 md:py-28 bg-gray-50/50">
      <div className="container mx-auto px-4">
        
        {/* HEADER DA SEÇÃO */}
        <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-12">
          <div className="text-left space-y-3">
            <div className="inline-flex items-center gap-2 text-yellow-600 font-bold text-sm uppercase tracking-widest">
              <Sparkles className="h-4 w-4" />
              Favoritas da Galera
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
              As Mais <span className="text-yellow-500">Desejadas</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-xl">
              Selecionamos as combinações que fazem mais sucesso em Iacanga. Qual vai ser a sua hoje?
            </p>
          </div>
          
          <Link href="/cardapio" className="hidden md:block">
            <Button variant="link" className="text-yellow-600 font-bold text-lg hover:text-yellow-700 p-0 flex items-center gap-2">
              Ver cardápio completo
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        {/* GRID DE PRODUTOS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {sortedProducts.map((product) => {
            // Lógica de ranking baseada nos nomes do ranking real
            const rankIndex = topBatatasNames.findIndex(name => name.toLowerCase() === product.name.toLowerCase());
            let rank: 1 | 2 | 3 | null = null;
            
            if (rankIndex !== -1) {
              rank = (rankIndex + 1) as 1 | 2 | 3;
            }

            return (
              <div key={product.id} className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                <ProductCard 
                  product={product}
                  rank={rank}
                  isMostRequested={product.id === mostRequestedProductId}
                />
              </div>
            );
          })}
        </div>

        {/* CTA FINAL */}
        <div className="text-center">
          <Link href="/cardapio">
            <Button 
              size="lg" 
              className="w-full sm:w-auto bg-yellow-500 text-white hover:bg-yellow-600 font-black text-xl px-16 h-16 rounded-2xl shadow-2xl shadow-yellow-100 transition-all hover:-translate-y-1 flex items-center justify-center gap-3 border-b-4 border-yellow-700 active:border-b-0 active:translate-y-1"
            >
              CONFERIR CARDÁPIO COMPLETO
              <ArrowRight className="h-6 w-6" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
