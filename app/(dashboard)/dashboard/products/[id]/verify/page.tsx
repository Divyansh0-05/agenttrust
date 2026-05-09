import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import type { ActiveConnectionView, RevenueVerifyPlatform } from "./verify-types";
import { VerifyPlatformCards } from "./verify-platform-cards";

export const metadata: Metadata = {
  title: "Verify revenue",
  description:
    "Connect payment platforms to verify your product revenue on AgentTrust.",
};

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    stripe_connected?: string;
    stripe_error?: string;
  }>;
};

export default async function ProductVerifyPage({ params, searchParams }: PageProps) {
  const [{ id: productId }, query] = await Promise.all([params, searchParams]);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .select("id, name")
    .eq("id", productId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (productError) {
    throw new Error(
      productError.message ||
        "Could not load product. Check SUPABASE_SERVICE_ROLE_KEY and database connectivity.",
    );
  }

  if (!product) {
    notFound();
  }

  const { data: connections, error: connError } = await supabaseAdmin
    .from("revenue_connections")
    .select(
      "id, platform, status, mrr, customer_count, last_synced_at, currency",
    )
    .eq("product_id", product.id)
    .eq("status", "active");

  if (connError) {
    throw new Error(connError.message);
  }

  const connectedMap: Partial<
    Record<RevenueVerifyPlatform, ActiveConnectionView>
  > = {};

  for (const row of connections ?? []) {
    const key = row.platform as RevenueVerifyPlatform | string;
    if (
      key !== "stripe" &&
      key !== "lemon_squeezy" &&
      key !== "revenuecat" &&
      key !== "dodo" &&
      key !== "paddle"
    ) {
      continue;
    }
    connectedMap[key] = {
      id: row.id,
      mrr: row.mrr,
      customer_count: row.customer_count,
      last_synced_at:
        row.last_synced_at == null
          ? null
          : typeof row.last_synced_at === "string"
            ? row.last_synced_at
            : new Date(row.last_synced_at).toISOString(),
      currency: row.currency,
    };
  }

  const stripeSuccess = query.stripe_connected === "true";
  const stripeErrored = query.stripe_error === "true";
  const stripeOAuthAvailable =
    Boolean(process.env.STRIPE_CONNECT_CLIENT_ID) &&
    Boolean(process.env.STRIPE_CONNECT_REDIRECT_URI);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <Link
        href={`/dashboard/products/${product.id}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Back to product
      </Link>

      <header className="mb-8 space-y-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {product.name}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Verify revenue
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Connect one or more platforms. We use read-only access to display
            totals on your trust profile. You can disconnect at any time.
          </p>
        </div>
        {stripeErrored ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Stripe connection failed or was cancelled. Please try again.
          </div>
        ) : stripeSuccess ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-50">
            Stripe connected successfully. Your revenue will sync shortly.
          </div>
        ) : null}
      </header>

      <VerifyPlatformCards
        productId={product.id}
        connectedMap={connectedMap}
        stripeOAuthAvailable={stripeOAuthAvailable}
      />

      <p className="mt-8 rounded-lg border border-muted-foreground/15 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Privacy: </span>
        Read-only access. We cannot charge you or move funds.
      </p>
    </main>
  );
}
