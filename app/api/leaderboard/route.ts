import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const PAGE_SIZE = 20;

const VALID_SORT = ["trust_score", "revenue_mrr", "review_count"] as const;
type SortField = (typeof VALID_SORT)[number];

const VALID_CATEGORIES = ["saas", "apps", "ai tools", "open source"] as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const rawSort = searchParams.get("sort") ?? "trust_score";
  const sort: SortField = (VALID_SORT as readonly string[]).includes(rawSort)
    ? (rawSort as SortField)
    : "trust_score";

  const rawCategory = searchParams.get("category")?.toLowerCase() ?? "";
  const category =
    (VALID_CATEGORIES as readonly string[]).includes(rawCategory)
      ? rawCategory
      : null;

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabaseAdmin
    .from("products")
    .select(
      `id, slug, name, tagline, logo_url, category,
       trust_score, avg_rating, review_count,
       revenue_verified, revenue_mrr`,
      { count: "exact" },
    )
    .eq("is_public", true)
    .order(sort, { ascending: false, nullsFirst: false })
    .range(from, to);

  if (category) {
    query = query.ilike("category", category);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("[leaderboard]", error.message);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }

  return NextResponse.json({
    products: data ?? [],
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
  });
}
