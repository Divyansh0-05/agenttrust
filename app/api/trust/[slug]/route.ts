import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  calculateTrustBreakdown,
  calculateTrustScore,
  getTrustGrade,
} from "@/lib/trust-score";
import type { Product, RevenueConnection, Review } from "@/lib/types";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

type TrustProduct = Pick<
  Product,
  | "id"
  | "slug"
  | "name"
  | "description"
  | "website_url"
  | "category"
  | "logo_url"
  | "github_verified"
  | "github_stars"
  | "revenue_verified"
  | "revenue_mrr"
  | "revenue_arr"
  | "revenue_total"
  | "revenue_customer_count"
  | "revenue_mom_growth"
  | "revenue_last_synced_at"
  | "agent_query_count"
  | "agent_query_count_30d"
>;

type TrustReview = Pick<
  Review,
  | "rating"
  | "body"
  | "reviewer_role"
  | "is_verified_customer"
  | "is_approved"
  | "submitted_at"
  | "created_at"
>;

type ActiveConnection = Pick<RevenueConnection, "platform">;

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function centsToUsd(cents: number | null) {
  return Math.round((cents ?? 0) / 100);
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(value: number | null) {
  return new Intl.NumberFormat("en-US").format(value ?? 0);
}

function platformName(platform: string) {
  const names: Record<string, string> = {
    stripe: "Stripe",
    lemon_squeezy: "Lemon Squeezy",
    revenuecat: "RevenueCat",
    dodo: "Dodo",
    paddle: "Paddle",
    gumroad: "Gumroad",
  };

  return names[platform] ?? platform.replace(/_/g, " ");
}

function listNames(names: string[]) {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

function excerpt(body: string) {
  const trimmed = body.trim();
  if (trimmed.length <= 180) return trimmed;
  return `${trimmed.slice(0, 177).trimEnd()}...`;
}

function dateOnly(value: Date | string | null) {
  if (!value) return null;
  return new Date(value).toISOString().slice(0, 10);
}

function ipHash(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwardedFor?.split(",")[0]?.trim() ?? realIp;

  if (!ip) return null;

  return createHash("sha256").update(ip).digest("hex");
}

async function logAgentQuery(request: Request, product: TrustProduct) {
  const [insertResult, updateResult] = await Promise.all([
    supabaseAdmin.from("agent_queries").insert({
      product_id: product.id,
      product_slug: product.slug,
      query_type: "rest",
      user_agent: request.headers.get("user-agent"),
      ip_hash: ipHash(request),
    }),
    supabaseAdmin
      .from("products")
      .update({
        agent_query_count: (product.agent_query_count ?? 0) + 1,
        agent_query_count_30d: (product.agent_query_count_30d ?? 0) + 1,
      })
      .eq("id", product.id),
  ]);

  if (insertResult.error) {
    console.error("Failed to log agent query", {
      productId: product.id,
      productSlug: product.slug,
      error: insertResult.error,
    });
  }

  if (updateResult.error) {
    console.error("Failed to increment agent query count", {
      productId: product.id,
      productSlug: product.slug,
      error: updateResult.error,
    });
  }
}

function buildAgentSummary(
  product: TrustProduct,
  reviewTotal: number,
  averageRating: number,
  score: number,
  platforms: string[],
) {
  const base = `${product.name} has ${formatNumber(reviewTotal)} verified reviews (avg ${averageRating.toFixed(1)}/5) and a trust score of ${score}/100.`;

  if (!product.revenue_verified) {
    return base;
  }

  const platformText =
    platforms.length > 0
      ? ` Revenue verified across ${listNames(platforms.map(platformName))}:`
      : " Revenue is verified:";
  const momGrowth = product.revenue_mom_growth ?? 0;
  const growthPrefix = momGrowth > 0 ? "+" : "";

  return `${base}${platformText} ${formatMoney(centsToUsd(product.revenue_mrr))} MRR, ${formatNumber(product.revenue_customer_count)} paying customers, ${growthPrefix}${momGrowth.toFixed(1)}% month-over-month growth.`;
}

export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;

  const { data: productData, error: productError } = await supabaseAdmin
    .from("products")
    .select(
      [
        "id",
        "slug",
        "name",
        "description",
        "website_url",
        "category",
        "logo_url",
        "github_verified",
        "github_stars",
        "revenue_verified",
        "revenue_mrr",
        "revenue_arr",
        "revenue_total",
        "revenue_customer_count",
        "revenue_mom_growth",
        "revenue_last_synced_at",
        "agent_query_count",
        "agent_query_count_30d",
      ].join(", "),
    )
    .eq("slug", slug)
    .eq("is_public", true)
    .maybeSingle();

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  if (!productData) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const product = productData as unknown as TrustProduct;
  const [reviewsResult, connectionsResult] = await Promise.all([
    supabaseAdmin
      .from("reviews")
      .select(
        "rating, body, reviewer_role, is_verified_customer, is_approved, submitted_at, created_at",
      )
      .eq("product_id", product.id)
      .eq("is_approved", true)
      .order("submitted_at", { ascending: false }),
    supabaseAdmin
      .from("revenue_connections")
      .select("platform")
      .eq("product_id", product.id)
      .eq("status", "active"),
  ]);

  if (reviewsResult.error) {
    return NextResponse.json(
      { error: reviewsResult.error.message },
      { status: 500 },
    );
  }

  if (connectionsResult.error) {
    return NextResponse.json(
      { error: connectionsResult.error.message },
      { status: 500 },
    );
  }

  const reviews = (reviewsResult.data ?? []) as TrustReview[];
  const activeConnections = (connectionsResult.data ?? []) as ActiveConnection[];
  const platforms = activeConnections.map((connection) => connection.platform);
  const score = calculateTrustScore(product, reviews);
  const breakdown = calculateTrustBreakdown(product, reviews);
  const reviewTotal = reviews.length;
  const verifiedCustomers = reviews.filter(
    (review) => review.is_verified_customer,
  ).length;
  const averageRating =
    reviewTotal > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewTotal
      : 0;
  const distribution = [5, 4, 3, 2, 1].reduce<Record<string, number>>(
    (acc, rating) => {
      acc[String(rating)] = reviews.filter(
        (review) => review.rating === rating,
      ).length;
      return acc;
    },
    {},
  );

  await logAgentQuery(request, product);

  return NextResponse.json(
    {
      schema: "agenttrust/trust/v1",
      generated_at: new Date().toISOString(),
      product: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        url: product.website_url,
        category: product.category,
        logo_url: product.logo_url,
      },
      trust: {
        score,
        grade: getTrustGrade(score),
        breakdown,
      },
      reviews: {
        total: reviewTotal,
        verified_customers: verifiedCustomers,
        average_rating: Number(averageRating.toFixed(1)),
        distribution,
        recent: reviews.slice(0, 5).map((review) => ({
          rating: review.rating,
          excerpt: excerpt(review.body),
          reviewer_role: review.reviewer_role,
          verified_customer: review.is_verified_customer === true,
          date: dateOnly(review.submitted_at ?? review.created_at),
        })),
      },
      verification: {
        github: {
          connected: product.github_verified === true,
          stars: product.github_stars,
        },
      },
      revenue: {
        verified: product.revenue_verified === true,
        platforms,
        combined: {
          mrr_usd: centsToUsd(product.revenue_mrr),
          arr_usd: centsToUsd(product.revenue_arr),
          total_revenue_usd: centsToUsd(product.revenue_total),
          paying_customers: product.revenue_customer_count ?? 0,
          mom_growth_percent: product.revenue_mom_growth ?? 0,
          last_synced: product.revenue_last_synced_at,
        },
      },
      agent_summary: buildAgentSummary(
        product,
        reviewTotal,
        Number(averageRating.toFixed(1)),
        score,
        platforms,
      ),
      meta: {
        agent_queries_total: product.agent_query_count ?? 0,
        agent_queries_30d: product.agent_query_count_30d ?? 0,
        profile_url: `${appUrl()}/p/${product.slug}`,
        cache_ttl: 3600,
      },
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}
