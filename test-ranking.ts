import { productsManager } from "./lib/products-db.ts";
import { getSupabase } from "./lib/supabase-fix.ts";

async function test() {
  console.log("Testing getting ranking...");
  const ranking = await productsManager.getRealRankingByCategory("batata");
  console.log("Ranking:", ranking);

  console.log("Testing raw query...");
  const supabase = await getSupabase();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { data, error } = await supabase
    .from("order_items")
    .select("product_name, quantity, created_at")
    .gte("created_at", thirtyDaysAgo.toISOString());
  
  console.log("Data length:", data?.length);
  console.log("Error:", error);
  if (data) {
    console.log("Sample data:", data.slice(0, 3));
  }
}

test().catch(console.error);
