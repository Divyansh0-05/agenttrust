import type { Metadata } from "next";

import LandingContent, {
  type LandingProduct,
} from "@/components/shared/LandingContent";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "AgentTrust - Verified trust for people and AI agents",
  description:
    "Collect reviews, verify revenue, and let AI agents query your trust data through the Trust API.",
};

function scoreProduct(product: LandingProduct): number {
  return (product.agentup_count ?? 0) * 0.6 + (product.trust_score ?? 0) * 0.4;
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(
      "id, slug, name, tagline, logo_url, avg_rating, review_count, trust_score, agentup_count, revenue_verified, category",
    )
    .eq("is_public", true);

  const products = ((data ?? []) as LandingProduct[])
    .sort((a, b) => scoreProduct(b) - scoreProduct(a))
    .slice(0, 20);

  return <LandingContent products={products} />;
}
