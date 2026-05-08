import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  Bot,
  ExternalLink,
  GitBranch,
  ShieldCheck,
  Star,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type {
  Product,
  RevenueConnection,
  RevenueSnapshot,
  Review,
} from "@/lib/types";

import { RevenueSparkline } from "./profile-charts";

const REVIEWS_PER_PAGE = 10;

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

type PublicProduct = Pick<
  Product,
  | "id"
  | "slug"
  | "name"
  | "tagline"
  | "description"
  | "website_url"
  | "logo_url"
  | "category"
  | "trust_score"
  | "avg_rating"
  | "review_count"
  | "github_verified"
  | "github_stars"
  | "revenue_verified"
  | "revenue_mrr"
  | "revenue_arr"
  | "revenue_total"
  | "revenue_customer_count"
  | "revenue_mom_growth"
  | "revenue_currency"
  | "revenue_last_synced_at"
  | "revenue_is_public"
  | "agent_query_count"
>;

type PublicReview = Pick<
  Review,
  | "id"
  | "reviewer_name"
  | "reviewer_role"
  | "reviewer_company"
  | "rating"
  | "title"
  | "body"
  | "is_verified_customer"
  | "submitted_at"
  | "created_at"
>;

function trustGrade(score: number) {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

function formatMoney(cents: number | null, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format((cents ?? 0) / 100);
}

function formatNumber(value: number | null) {
  return new Intl.NumberFormat("en-US").format(value ?? 0);
}

function formatPercent(value: number | null) {
  const amount = value ?? 0;
  return `${amount > 0 ? "+" : ""}${amount.toFixed(1)}%`;
}

function formatDate(value: Date | string | null) {
  if (!value) return "Unknown date";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function hoursAgo(value: Date | string | null) {
  if (!value) return "not synced yet";
  const diffMs = Date.now() - new Date(value).getTime();
  const hours = Math.max(0, Math.round(diffMs / (1000 * 60 * 60)));

  if (hours < 1) return "less than 1 hour ago";
  if (hours === 1) return "1 hour ago";
  return `${hours} hours ago`;
}

function productInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

function platformName(platform: string) {
  const names: Record<string, string> = {
    stripe: "Stripe",
    revenuecat: "RevenueCat",
    lemon_squeezy: "Lemon Squeezy",
    dodo: "Dodo",
    paddle: "Paddle",
    gumroad: "Gumroad",
  };

  return names[platform] ?? platform.replace(/_/g, " ");
}

async function getProduct(slug: string) {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select(
      [
        "id",
        "slug",
        "name",
        "tagline",
        "description",
        "website_url",
        "logo_url",
        "category",
        "trust_score",
        "avg_rating",
        "review_count",
        "github_verified",
        "github_stars",
        "revenue_verified",
        "revenue_mrr",
        "revenue_arr",
        "revenue_total",
        "revenue_customer_count",
        "revenue_mom_growth",
        "revenue_currency",
        "revenue_last_synced_at",
        "revenue_is_public",
        "agent_query_count",
      ].join(", "),
    )
    .eq("slug", slug)
    .eq("is_public", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as PublicProduct | null;
}

export async function generateMetadata({
  params,
}: Pick<PageProps, "params">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: "Product not found | AgentTrust",
    };
  }

  const description =
    product.tagline ?? product.description ?? `${product.name} on AgentTrust`;

  return {
    title: `${product.name} trust profile | AgentTrust`,
    description,
    openGraph: {
      title: `${product.name} trust profile`,
      description,
      images: product.logo_url ? [product.logo_url] : undefined,
    },
  };
}

export default async function ProductProfilePage({
  params,
  searchParams,
}: PageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const page = Math.max(1, Number(query.page ?? "1") || 1);
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const reviewRangeStart = (page - 1) * REVIEWS_PER_PAGE;
  const reviewRangeEnd = reviewRangeStart + REVIEWS_PER_PAGE - 1;
  const showRevenue =
    product.revenue_verified === true && product.revenue_is_public === true;

  const [
    activeConnectionsResult,
    snapshotsResult,
    reviewsResult,
    distributionResults,
  ] = await Promise.all([
    showRevenue
      ? supabaseAdmin
          .from("revenue_connections")
          .select("platform, status, last_synced_at")
          .eq("product_id", product.id)
          .eq("status", "active")
      : Promise.resolve({ data: [], error: null }),
    showRevenue
      ? supabaseAdmin
          .from("revenue_snapshots")
          .select("mrr, recorded_at")
          .eq("product_id", product.id)
          .order("recorded_at", { ascending: false })
          .limit(12)
      : Promise.resolve({ data: [], error: null }),
    supabaseAdmin
      .from("reviews")
      .select(
        "id, reviewer_name, reviewer_role, reviewer_company, rating, title, body, is_verified_customer, submitted_at, created_at",
        { count: "exact" },
      )
      .eq("product_id", product.id)
      .eq("is_approved", true)
      .order("submitted_at", { ascending: false })
      .range(reviewRangeStart, reviewRangeEnd),
    Promise.all(
      [5, 4, 3, 2, 1].map((rating) =>
        supabaseAdmin
          .from("reviews")
          .select("id", { count: "exact", head: true })
          .eq("product_id", product.id)
          .eq("is_approved", true)
          .eq("rating", rating),
      ),
    ),
  ]);

  if (activeConnectionsResult.error) {
    throw new Error(activeConnectionsResult.error.message);
  }

  if (snapshotsResult.error) {
    throw new Error(snapshotsResult.error.message);
  }

  if (reviewsResult.error) {
    throw new Error(reviewsResult.error.message);
  }

  const distributionErrors = distributionResults
    .map((result) => result.error)
    .filter(Boolean);

  if (distributionErrors[0]) {
    throw new Error(distributionErrors[0].message);
  }

  const score = Math.round(product.trust_score ?? 0);
  const grade = trustGrade(score);
  const activeConnections =
    (activeConnectionsResult.data ?? []) as Pick<
      RevenueConnection,
      "platform" | "status" | "last_synced_at"
    >[];
  const snapshots = ((snapshotsResult.data ?? []) as Pick<
    RevenueSnapshot,
    "mrr" | "recorded_at"
  >[])
    .reverse()
    .map((snapshot) => ({
      label: snapshot.recorded_at
        ? new Intl.DateTimeFormat("en-US", { month: "short" }).format(
            new Date(snapshot.recorded_at),
          )
        : "",
      mrr: snapshot.mrr / 100,
    }));
  const reviews = (reviewsResult.data ?? []) as PublicReview[];
  const reviewTotal = reviewsResult.count ?? product.review_count ?? 0;
  const totalPages = Math.max(1, Math.ceil(reviewTotal / REVIEWS_PER_PAGE));
  const distribution = [5, 4, 3, 2, 1].map((rating, index) => ({
    rating,
    count: distributionResults[index].count ?? 0,
  }));
  const hasRevenueCat = activeConnections.some(
    (connection) => connection.platform === "revenuecat",
  );
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: product.name,
    description: product.description ?? product.tagline,
    url: product.website_url,
    image: product.logo_url,
    applicationCategory: product.category,
    aggregateRating:
      reviewTotal > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: product.avg_rating ?? 0,
            reviewCount: reviewTotal,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
    review: reviews.slice(0, 3).map((review) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: review.reviewer_name,
      },
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.rating,
        bestRating: 5,
        worstRating: 1,
      },
      name: review.title,
      reviewBody: review.body,
      datePublished: review.submitted_at ?? review.created_at,
    })),
  };

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <section className="flex flex-col gap-6 border-b pb-8 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 gap-4">
          {product.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.logo_url}
              alt=""
              className="size-16 rounded-xl border object-cover"
            />
          ) : (
            <div className="flex size-16 shrink-0 items-center justify-center rounded-xl border bg-muted text-lg font-semibold">
              {productInitials(product.name)}
            </div>
          )}
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold tracking-tight">
                {product.name}
              </h1>
              {product.category ? (
                <Badge variant="outline">{product.category}</Badge>
              ) : null}
            </div>
            {product.tagline ? (
              <p className="max-w-2xl text-lg text-muted-foreground">
                {product.tagline}
              </p>
            ) : null}
            {product.description ? (
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                {product.description}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {product.website_url ? (
            <Link
              href={product.website_url}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "outline" })}
            >
              Website <ExternalLink />
            </Link>
          ) : null}
          <Link
            href={`/review/${product.slug}`}
            className={buttonVariants()}
          >
            Leave a review
          </Link>
        </div>
      </section>

      <section className="grid gap-6 py-8 lg:grid-cols-[1fr_2fr]">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Trust score
          </p>
          <div className="mt-2 flex items-end gap-3">
            <span className="text-7xl font-semibold tracking-tight">
              {score}
            </span>
            <span className="mb-2 rounded-lg border px-3 py-1 text-2xl font-semibold">
              {grade}
            </span>
          </div>
        </div>
        <div className="grid content-start gap-3 sm:grid-cols-2">
          <Badge variant={showRevenue ? "default" : "outline"} className="h-auto justify-start rounded-lg px-3 py-2">
            <ShieldCheck /> Revenue {showRevenue ? "verified" : "not verified"}
          </Badge>
          <Badge
            variant={product.github_verified ? "default" : "outline"}
            className="h-auto justify-start rounded-lg px-3 py-2"
          >
            <GitBranch /> GitHub{" "}
            {product.github_verified
              ? `verified${product.github_stars ? `, ${formatNumber(product.github_stars)} stars` : ""}`
              : "not connected"}
          </Badge>
          <Badge variant="outline" className="h-auto justify-start rounded-lg px-3 py-2">
            <Star /> {formatNumber(product.review_count)} approved reviews
          </Badge>
          <Badge variant="outline" className="h-auto justify-start rounded-lg px-3 py-2">
            <BadgeCheck /> Avg rating {(product.avg_rating ?? 0).toFixed(1)}/5
          </Badge>
        </div>
      </section>

      {showRevenue ? (
        <section className="border-y py-8">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Verified revenue
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>Verified across:</span>
                {activeConnections.map((connection) => (
                  <Badge key={connection.platform} variant="outline">
                    {platformName(connection.platform)} ✓
                  </Badge>
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Last updated {hoursAgo(product.revenue_last_synced_at)}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card size="sm">
              <CardHeader>
                <CardTitle>MRR</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {formatMoney(product.revenue_mrr, product.revenue_currency ?? "usd")}
              </CardContent>
            </Card>
            <Card size="sm">
              <CardHeader>
                <CardTitle>ARR</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {formatMoney(product.revenue_arr, product.revenue_currency ?? "usd")}
              </CardContent>
            </Card>
            <Card size="sm">
              <CardHeader>
                <CardTitle>Customers</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {formatNumber(product.revenue_customer_count)}
              </CardContent>
            </Card>
            <Card size="sm">
              <CardHeader>
                <CardTitle>MoM Growth</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {formatPercent(product.revenue_mom_growth)}
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_2fr]">
            <div>
              <p className="text-sm text-muted-foreground">
                All-time total revenue
              </p>
              <p className="mt-1 text-3xl font-semibold">
                {formatMoney(product.revenue_total, product.revenue_currency ?? "usd")}
              </p>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Revenue pulled directly from platform APIs. Cannot be edited by
                the seller.
              </p>
              {hasRevenueCat ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  * RevenueCat data shows last 30 days only
                </p>
              ) : null}
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">MRR history</p>
              <RevenueSparkline data={snapshots} />
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-8 py-8 lg:grid-cols-[360px_1fr]">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Rating distribution
          </h2>
          <div className="mt-4 space-y-3">
            {distribution.map((item) => {
              const width =
                reviewTotal > 0 ? Math.round((item.count / reviewTotal) * 100) : 0;

              return (
                <div
                  key={item.rating}
                  className="grid grid-cols-[44px_1fr_40px] items-center gap-3 text-sm"
                >
                  <span>{item.rating} star</span>
                  <div className="h-3 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-foreground"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <span className="text-right text-muted-foreground">
                    {item.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold tracking-tight">Reviews</h2>
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
          </div>
          {reviews.length === 0 ? (
            <div className="rounded-lg border bg-muted/20 p-6 text-sm text-muted-foreground">
              No approved reviews yet.
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <Card key={review.id} size="sm">
                  <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <CardTitle>
                        {review.title ?? `${review.rating}/5 review`}
                      </CardTitle>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="size-4 fill-foreground" />
                        {review.rating}/5
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="leading-6">{review.body}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span>{review.reviewer_name}</span>
                      {review.reviewer_role ? <span>{review.reviewer_role}</span> : null}
                      {review.reviewer_company ? (
                        <span>{review.reviewer_company}</span>
                      ) : null}
                      {review.is_verified_customer ? (
                        <Badge variant="outline">Verified customer</Badge>
                      ) : null}
                      <span>{formatDate(review.submitted_at ?? review.created_at)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <div className="mt-5 flex justify-between gap-3">
            {page > 1 ? (
              <Link
                href={`/p/${product.slug}?page=${page - 1}`}
                className={buttonVariants({ variant: "outline" })}
              >
                Previous
              </Link>
            ) : (
              <span />
            )}
            {page < totalPages ? (
              <Link
                href={`/p/${product.slug}?page=${page + 1}`}
                className={buttonVariants({ variant: "outline" })}
              >
                Next
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="border-t py-8">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg border bg-muted">
            <Bot className="size-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Agent visibility
            </h2>
            <p className="text-sm text-muted-foreground">
              AI agents queried this profile{" "}
              {formatNumber(product.agent_query_count)} times.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
