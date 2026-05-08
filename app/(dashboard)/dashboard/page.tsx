import Link from "next/link";
import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

function formatValue(value: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat("en-US", options).format(value);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, review_count, avg_rating, trust_score, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (productsError) {
    throw new Error(productsError.message);
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
    throw new Error(reviewsResult.error.message);
  }

  if (queriesResult.error) {
    throw new Error(queriesResult.error.message);
  }

  const totalReviewCount = productItems.reduce(
    (sum, product) => sum + (product.review_count ?? 0),
    0,
  );
  const weightedRatingTotal = productItems.reduce((sum, product) => {
    return sum + (product.avg_rating ?? 0) * (product.review_count ?? 0);
  }, 0);
  const averageRating =
    totalReviewCount > 0 ? weightedRatingTotal / totalReviewCount : 0;

  const stats = [
    {
      label: "Total reviews this month",
      value: formatValue(reviewsResult.count ?? 0),
      hint: "Approved reviews across your products",
    },
    {
      label: "Avg rating",
      value: averageRating.toFixed(1),
      hint: "Weighted average from all reviews",
    },
    {
      label: "Agent queries this month",
      value: formatValue(queriesResult.count ?? 0),
      hint: "Trust API requests logged this month",
    },
    {
      label: "Active products",
      value: formatValue(productItems.length),
      hint: "Public and private products you manage",
    },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Monitor trust, reviews, and engagement at a glance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-2xl">{stat.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{stat.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Product quick links</CardTitle>
            <CardDescription>
              Jump directly into each product workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {productItems.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-sm font-medium">No products yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add your first product to start collecting reviews and trust
                  data.
                </p>
                <Link
                  href="/dashboard/products/new"
                  className="mt-4 inline-flex rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Create your first product
                </Link>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {productItems.map((product) => (
                  <Link
                    key={product.id}
                    href={`/dashboard/products/${product.id}`}
                    className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <p className="truncate text-sm font-medium">{product.name}</p>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                      <span>{(product.avg_rating ?? 0).toFixed(1)} rating</span>
                      <span>{product.review_count ?? 0} reviews</span>
                      <span>{(product.trust_score ?? 0).toFixed(0)} trust</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
