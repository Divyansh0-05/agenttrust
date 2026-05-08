import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

function formatAverageRating(products: Pick<Product, "avg_rating" | "review_count">[]) {
  const totalReviews = products.reduce(
    (sum, product) => sum + (product.review_count ?? 0),
    0,
  );
  const weightedTotal = products.reduce(
    (sum, product) =>
      sum + (product.avg_rating ?? 0) * (product.review_count ?? 0),
    0,
  );

  return totalReviews > 0 ? Number((weightedTotal / totalReviews).toFixed(2)) : 0;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, review_count, avg_rating, trust_score, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (productsError) {
    return NextResponse.json({ error: productsError.message }, { status: 500 });
  }

  const productItems = (products ?? []) as Pick<
    Product,
    "id" | "name" | "review_count" | "avg_rating" | "trust_score"
  >[];
  const productIds = productItems.map((product) => product.id);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [reviewsResult, queriesResult] = await Promise.all([
    productIds.length
      ? supabase
          .from("reviews")
          .select("id", { count: "exact", head: true })
          .in("product_id", productIds)
          .eq("is_approved", true)
          .gte("created_at", monthStart.toISOString())
      : Promise.resolve({ count: 0, error: null }),
    productIds.length
      ? supabase
          .from("agent_queries")
          .select("id", { count: "exact", head: true })
          .in("product_id", productIds)
          .gte("created_at", monthStart.toISOString())
      : Promise.resolve({ count: 0, error: null }),
  ]);

  if (reviewsResult.error) {
    return NextResponse.json({ error: reviewsResult.error.message }, { status: 500 });
  }

  if (queriesResult.error) {
    return NextResponse.json({ error: queriesResult.error.message }, { status: 500 });
  }

  return NextResponse.json({
    stats: {
      total_reviews_month: reviewsResult.count ?? 0,
      avg_rating: formatAverageRating(productItems),
      agent_queries_month: queriesResult.count ?? 0,
      active_products: productItems.length,
    },
    products: productItems.map((product) => ({
      id: product.id,
      name: product.name,
      review_count: product.review_count ?? 0,
      avg_rating: Number((product.avg_rating ?? 0).toFixed(2)),
      trust_score: Number((product.trust_score ?? 0).toFixed(2)),
    })),
  });
}
