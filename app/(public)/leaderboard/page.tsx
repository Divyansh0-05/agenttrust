"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

// ─────────────────────────────────────────────
// Shared nav (mirrors landing page navbar)
// ─────────────────────────────────────────────
function PublicNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/90 px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto flex h-12 max-w-[760px] items-center justify-between gap-2 rounded-full border border-white/15 bg-zinc-100 px-4 text-black shadow-[0_0_42px_rgba(255,255,255,0.12)] sm:px-5">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex size-8 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
            AT
          </span>
          <span className="hidden text-sm tracking-tight sm:inline">AgentTrust</span>
        </Link>
        <nav className="flex flex-1 items-center justify-center gap-3 text-xs font-medium sm:gap-5 sm:text-sm">
          <Link href="/leaderboard" className="font-semibold text-orange-600">
            Leaderboard
          </Link>
          <Link href="/trust-api" className="transition-colors hover:text-orange-600">
            Trust API
          </Link>
          <Link href="/pricing" className="transition-colors hover:text-orange-600">
            Pricing
          </Link>
        </nav>
        <div className="flex items-center gap-1.5">
          <Link
            href="/login"
            className="hidden rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-black/10 sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center rounded-full bg-black px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-orange-600"
          >
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}

function PublicFooter() {
  return (
    <footer className="mt-10 border-t border-white/10 bg-black py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-semibold text-white">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-100 text-xs font-bold text-black">
            AT
          </span>
          AgentTrust
        </div>
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-zinc-500">
          <Link href="/leaderboard" className="transition-colors hover:text-white">Leaderboard</Link>
          <Link href="/trust-api" className="transition-colors hover:text-white">Trust API</Link>
          <Link href="/login" className="transition-colors hover:text-white">Sign in</Link>
          <Link href="/signup" className="transition-colors hover:text-white">Sign up</Link>
        </nav>
        <p className="text-xs text-zinc-600">2026 AgentTrust.</p>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface LeaderboardProduct {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  logo_url: string | null;
  category: string | null;
  trust_score: number | null;
  avg_rating: number | null;
  review_count: number | null;
  revenue_verified: boolean | null;
  revenue_mrr: number | null;
}

interface LeaderboardResponse {
  products: LeaderboardProduct[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const CATEGORIES = ["All", "SaaS", "Apps", "AI Tools", "Open Source"] as const;
type Category = (typeof CATEGORIES)[number];

const SORT_OPTIONS = [
  { label: "Trust Score", value: "trust_score" },
  { label: "MRR", value: "revenue_mrr" },
  { label: "Reviews", value: "review_count" },
] as const;
type SortValue = (typeof SORT_OPTIONS)[number]["value"];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function formatMrr(cents: number | null): string {
  if (!cents || cents === 0) return "—";
  const dollars = cents / 100;
  if (dollars >= 1000) return `$${(dollars / 1000).toFixed(1)}K`;
  return `$${dollars.toLocaleString()}`;
}

function formatRating(r: number | null): string {
  if (!r) return "—";
  return r.toFixed(1);
}

function StarRating({ rating }: { rating: number | null }) {
  const val = rating ?? 0;
  const full = Math.round(val);
  return (
    <span className="flex items-center gap-1 text-sm">
      <span className="text-amber-400">{"★".repeat(full)}{"☆".repeat(5 - full)}</span>
      <span className="text-zinc-400">{formatRating(rating)}</span>
    </span>
  );
}

function CategoryBadge({ category }: { category: string | null }) {
  if (!category) return null;
  return (
    <span className="inline-block rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-xs font-medium text-zinc-300 capitalize">
      {category}
    </span>
  );
}

function ProductLogo({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  const initial = name.charAt(0).toUpperCase();
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={name}
        width={36}
        height={36}
        className="h-9 w-9 rounded-lg border border-white/10 object-cover"
      />
    );
  }
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.07] text-sm font-semibold text-orange-200">
      {initial}
    </span>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const base = "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold";
  if (rank === 1) return <span className={`${base} bg-orange-500 text-white`}>1</span>;
  if (rank === 2) return <span className={`${base} bg-zinc-700 text-zinc-100`}>2</span>;
  if (rank === 3) return <span className={`${base} bg-amber-500/80 text-white`}>3</span>;
  return <span className={`${base} bg-white/[0.07] text-zinc-400`}>{rank}</span>;
}

function TrustScore({ score }: { score: number | null }) {
  if (!score && score !== 0) return <span className="text-zinc-500">—</span>;
  const color =
    score >= 80
      ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-200"
      : score >= 60
      ? "border-cyan-400/20 bg-cyan-500/15 text-cyan-200"
      : score >= 40
      ? "border-amber-400/20 bg-amber-500/15 text-amber-200"
      : "border-white/10 bg-white/[0.06] text-zinc-300";
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-sm font-semibold ${color}`}>
      {score}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-white/10">
      {[...Array(7)].map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-4 w-3/4 rounded bg-white/[0.06]" />
        </td>
      ))}
    </tr>
  );
}

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────
export default function LeaderboardPage() {
  const [category, setCategory] = useState<Category>("All");
  const [sort, setSort] = useState<SortValue>("trust_score");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ sort, page: String(page) });
      if (category !== "All") params.set("category", category.toLowerCase());
      const res = await fetch(`/api/leaderboard?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json: LeaderboardResponse = await res.json();
      setData(json);
    } catch {
      setError("Could not load leaderboard. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [category, sort, page]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Reset to page 1 when filters change
  const handleCategory = (c: Category) => {
    setCategory(c);
    setPage(1);
  };
  const handleSort = (s: SortValue) => {
    setSort(s);
    setPage(1);
  };

  const offset = ((data?.page ?? 1) - 1) * (data?.pageSize ?? 20);

  return (
    <div className="overflow-x-hidden bg-black text-white">
      <PublicNav />
      {/* Page header */}
      <div className="border-b border-white/10 bg-black">
        <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-orange-400">
            Leaderboard
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Top-ranked products
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Ranked by verified trust signals — reviews, revenue, and more.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
        <div className="min-w-0 w-full">
          {/* Filters row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            {/* Category tabs */}
            <div className="flex items-center gap-1 flex-wrap">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => handleCategory(c)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                    category === c
                      ? "border-orange-400/40 bg-orange-500/15 text-orange-100"
                      : "border-white/10 bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1] hover:text-white"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Sort select */}
            <div className="flex items-center gap-2 shrink-0">
              <label htmlFor="sort-select" className="whitespace-nowrap text-sm text-zinc-500">
                Sort by
              </label>
              <select
                id="sort-select"
                value={sort}
                onChange={(e) => handleSort(e.target.value as SortValue)}
                className="rounded-lg border border-white/10 bg-zinc-950 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Error state */}
          {error && (
            <div className="mb-4 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {/* Table — desktop */}
          <div className="hidden overflow-x-auto rounded-2xl border border-white/10 bg-[#101113] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.04] text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-3 text-left w-12">#</th>
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Rating</th>
                  <th className="px-4 py-3 text-right">Reviews</th>
                  <th className="px-4 py-3 text-right">MRR</th>
                  <th className="px-4 py-3 text-right">Trust Score</th>
                  <th className="px-4 py-3 text-right" />
                </tr>
              </thead>
              <tbody>
                {loading
                  ? [...Array(8)].map((_, i) => <SkeletonRow key={i} />)
                  : data?.products.length === 0
                  ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-16 text-center text-sm text-zinc-500">
                        No products found for this filter.
                      </td>
                    </tr>
                  )
                  : data?.products.map((p, i) => (
                    <tr key={p.id} className="border-b border-white/10 transition-colors hover:bg-white/[0.04]">
                      <td className="px-4 py-4">
                        <RankBadge rank={offset + i + 1} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <ProductLogo name={p.name} logoUrl={p.logo_url} />
                          <div>
                            <p className="font-semibold text-white">{p.name}</p>
                            {p.tagline && (
                              <p className="line-clamp-1 max-w-[200px] text-xs text-zinc-400">
                                {p.tagline}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <CategoryBadge category={p.category} />
                      </td>
                      <td className="px-4 py-4">
                        <StarRating rating={p.avg_rating} />
                      </td>
                      <td className="px-4 py-4 text-right tabular-nums text-zinc-300">
                        {p.review_count?.toLocaleString() ?? "0"}
                      </td>
                      <td className="px-4 py-4 text-right tabular-nums font-medium text-zinc-300">
                        {p.revenue_verified ? formatMrr(p.revenue_mrr) : "—"}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <TrustScore score={p.trust_score} />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link
                          href={`/p/${p.slug}`}
                          className="whitespace-nowrap text-xs font-medium text-orange-300 hover:text-orange-100"
                        >
                          View profile →
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Card list — mobile */}
          <div className="space-y-3 sm:hidden">
            {loading
              ? [...Array(5)].map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl border border-white/10 bg-white/[0.06] p-4" />
              ))
              : data?.products.length === 0
              ? (
                <p className="py-12 text-center text-sm text-zinc-500">
                  No products found for this filter.
                </p>
              )
              : data?.products.map((p, i) => (
                <div key={p.id} className="rounded-xl border border-white/10 bg-[#101113] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <div className="flex items-start gap-3">
                    <RankBadge rank={offset + i + 1} />
                    <ProductLogo name={p.name} logoUrl={p.logo_url} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-white">{p.name}</p>
                        <TrustScore score={p.trust_score} />
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <CategoryBadge category={p.category} />
                        <StarRating rating={p.avg_rating} />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-zinc-400">
                          {p.review_count ?? 0} reviews ·{" "}
                          {p.revenue_verified ? formatMrr(p.revenue_mrr) : "MRR —"}
                        </span>
                        <Link
                          href={`/p/${p.slug}`}
                          className="text-xs font-medium text-orange-300 hover:text-orange-100"
                        >
                          View →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-zinc-500">
                Showing {offset + 1}–{Math.min(offset + data.pageSize, data.total)} of {data.total} products
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← Prev
                </button>
                <span className="text-sm text-zinc-400">
                  Page {data.page} of {data.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages || loading}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Total count line when single page */}
          {data && data.totalPages <= 1 && !loading && (
            <p className="mt-4 text-sm text-zinc-500">
              {data.total} product{data.total !== 1 ? "s" : ""} listed
            </p>
          )}
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
