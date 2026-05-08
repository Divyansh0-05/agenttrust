import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

function productInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

function formatNumber(value: number | null) {
  return value ?? 0;
}

export default async function ProductsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select(
      "id, name, logo_url, category, avg_rating, review_count, trust_score, created_at",
    )
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const items = (products ?? []) as Pick<
    Product,
    | "id"
    | "name"
    | "logo_url"
    | "category"
    | "avg_rating"
    | "review_count"
    | "trust_score"
    | "created_at"
  >[];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage the products collecting reviews and trust signals.
          </p>
        </div>
        <Link
          href="/dashboard/products/new"
          className={buttonVariants({ className: "shrink-0" })}
        >
          Add product
        </Link>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No products yet</CardTitle>
            <CardDescription>
              Add your first product to create its AgentTrust profile.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((product) => (
            <Link key={product.id} href={`/dashboard/products/${product.id}`}>
              <Card className="h-full transition-colors hover:bg-muted/40">
                <CardHeader>
                  <div className="mb-2 flex items-center gap-3">
                    {product.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.logo_url}
                        alt=""
                        className="size-10 rounded-lg border object-cover"
                      />
                    ) : (
                      <div className="flex size-10 items-center justify-center rounded-lg border bg-muted text-sm font-medium">
                        {productInitials(product.name)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <CardTitle className="truncate">{product.name}</CardTitle>
                      <CardDescription className="truncate">
                        {product.category ?? "Uncategorized"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Rating</dt>
                      <dd className="font-medium">
                        {formatNumber(product.avg_rating).toFixed(1)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Reviews</dt>
                      <dd className="font-medium">
                        {formatNumber(product.review_count)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Trust</dt>
                      <dd className="font-medium">
                        {formatNumber(product.trust_score).toFixed(0)}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
