"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client";

// ─────────────────────────────────────────────
// Shared nav (mirrors landing page navbar)
// ─────────────────────────────────────────────
function PublicNav() {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white text-sm font-bold">
            AT
          </span>
          <span className="text-base tracking-tight">AgentTrust</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link href="/leaderboard" className="text-indigo-600 font-semibold">
            Leaderboard
          </Link>
          <Link href="/trust-api" className="hover:text-gray-900 transition-colors">
            Trust API
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:inline-flex text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Get started free
          </Link>
        </div>
      </div>
    </header>
  );
}

function PublicFooter() {
  return (
    <footer className="bg-white border-t border-gray-100 py-10 mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-gray-900 font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-white text-xs font-bold">
            AT
          </span>
          AgentTrust
        </div>
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-500">
          <Link href="/leaderboard" className="hover:text-gray-800 transition-colors">Leaderboard</Link>
          <Link href="/trust-api" className="hover:text-gray-800 transition-colors">Trust API</Link>
          <Link href="/login" className="hover:text-gray-800 transition-colors">Sign in</Link>
          <Link href="/signup" className="hover:text-gray-800 transition-colors">Sign up</Link>
        </nav>
        <p className="text-xs text-gray-400">© {new Date().getFullYear()} AgentTrust.</p>
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

interface LeaderboardAdSlotRow {
  id: string;
  advertiser_name: string;
  advertiser_url: string;
  logo_url: string | null;
  tagline: string | null;
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
      <span className="text-gray-600">{formatRating(rating)}</span>
    </span>
  );
}

function CategoryBadge({ category }: { category: string | null }) {
  if (!category) return null;
  return (
    <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 capitalize">
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
        className="h-9 w-9 rounded-lg object-cover border border-gray-100"
      />
    );
  }
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 text-sm font-bold shrink-0">
      {initial}
    </span>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const base = "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0";
  if (rank === 1) return <span className={`${base} bg-amber-400 text-white`}>1</span>;
  if (rank === 2) return <span className={`${base} bg-gray-300 text-gray-700`}>2</span>;
  if (rank === 3) return <span className={`${base} bg-orange-300 text-white`}>3</span>;
  return <span className={`${base} bg-gray-100 text-gray-500`}>{rank}</span>;
}

function TrustScore({ score }: { score: number | null }) {
  if (!score && score !== 0) return <span className="text-gray-400">—</span>;
  const color =
    score >= 80
      ? "text-emerald-600 bg-emerald-50"
      : score >= 60
      ? "text-indigo-600 bg-indigo-50"
      : score >= 40
      ? "text-amber-600 bg-amber-50"
      : "text-gray-600 bg-gray-100";
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-sm font-semibold ${color}`}>
      {score}
    </span>
  );
}

// ─────────────────────────────────────────────
// Leaderboard sidebars (TrustMRR-style sponsors)
// ─────────────────────────────────────────────
function SponsorLogoCircle({
  name,
  logoUrl,
}: Readonly<{ name: string; logoUrl: string | null }>) {
  const initial = name.charAt(0).toUpperCase();
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt=""
        width={44}
        height={44}
        className="mx-auto size-11 rounded-full object-cover ring-2 ring-gray-100 bg-white"
      />
    );
  }
  return (
    <span
      aria-hidden
      className="mx-auto flex size-11 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-sm font-semibold text-gray-500"
    >
      {initial || "?"}
    </span>
  );
}

function SponsorAdCard({
  slot,
}: Readonly<{ slot: LeaderboardAdSlotRow | null }>) {
  const placeholderLine =
    "Your brand here → contact@agenttrust.com · From $299/mo";

  if (!slot) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50/90 p-3 text-center shadow-sm">
        <div
          className="mx-auto size-11 rounded-full border-2 border-dashed border-gray-300 bg-white"
          aria-hidden
        />
        <p className="mt-2 text-xs font-semibold text-gray-800">Your brand here</p>
        <p className="mt-1 text-[11px] leading-snug text-gray-500">
          {placeholderLine}
        </p>
        <a
          href="mailto:contact@agenttrust.com"
          className="mt-2 inline-block text-xs font-medium text-indigo-600 hover:text-indigo-800 underline-offset-2 hover:underline"
        >
          contact@agenttrust.com
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/90 p-3 text-center shadow-sm">
      <SponsorLogoCircle name={slot.advertiser_name} logoUrl={slot.logo_url} />
      <p className="mt-2 text-xs font-semibold text-gray-900 line-clamp-2">
        {slot.advertiser_name}
      </p>
      {slot.tagline ? (
        <p className="mt-1 text-[11px] leading-snug text-gray-600 line-clamp-3">
          {slot.tagline}
        </p>
      ) : null}
      <a
        href={slot.advertiser_url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block text-xs font-medium text-indigo-600 hover:text-indigo-800 underline-offset-2 hover:underline break-all"
      >
        Visit sponsor
      </a>
    </div>
  );
}

function LeaderboardAdvertiseCard() {
  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 text-center shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-800">
        Advertise here
      </p>
      <p className="mt-2 text-lg font-bold text-gray-900">$299/mo</p>
      <a
        href="mailto:contact@agenttrust.com"
        className="mt-2 inline-block text-xs font-medium text-indigo-600 hover:text-indigo-800 underline-offset-2 hover:underline"
      >
        contact@agenttrust.com
      </a>
    </div>
  );
}

// ─────────────────────────────────────────────
// Skeleton rows
// ─────────────────────────────────────────────
const SPONSOR_TICKER_PLACEHOLDERS: LeaderboardAdSlotRow[] = [
  {
    id: "placeholder-1",
    advertiser_name: "Your brand here",
    advertiser_url: "mailto:contact@agenttrust.com",
    logo_url: null,
    tagline: "Sponsor this spot",
  },
  {
    id: "placeholder-2",
    advertiser_name: "Your brand here",
    advertiser_url: "mailto:contact@agenttrust.com",
    logo_url: null,
    tagline: "Reach product buyers",
  },
  {
    id: "placeholder-3",
    advertiser_name: "Your brand here",
    advertiser_url: "mailto:contact@agenttrust.com",
    logo_url: null,
    tagline: "Featured sponsor",
  },
  {
    id: "placeholder-4",
    advertiser_name: "Your brand here",
    advertiser_url: "mailto:contact@agenttrust.com",
    logo_url: null,
    tagline: "From $299/mo",
  },
  {
    id: "placeholder-5",
    advertiser_name: "Your brand here",
    advertiser_url: "mailto:contact@agenttrust.com",
    logo_url: null,
    tagline: "Contact AgentTrust",
  },
];

function SponsorTickerLogo({
  name,
  logoUrl,
}: Readonly<{ name: string; logoUrl: string | null }>) {
  const initial = name.charAt(0).toUpperCase();

  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt=""
        width={28}
        height={28}
        className="size-7 shrink-0 rounded-full border border-gray-100 bg-white object-cover"
      />
    );
  }

  return (
    <span
      aria-hidden
      className="flex size-7 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-[11px] font-bold text-gray-500"
    >
      {initial || "?"}
    </span>
  );
}

function SponsorTicker({ adSlots }: Readonly<{ adSlots: LeaderboardAdSlotRow[] }>) {
  const sponsors =
    adSlots.length > 0
      ? [...adSlots, ...adSlots, ...adSlots]
      : [
          ...SPONSOR_TICKER_PLACEHOLDERS,
          ...SPONSOR_TICKER_PLACEHOLDERS,
          ...SPONSOR_TICKER_PLACEHOLDERS,
        ];
  const tickerItems = [...sponsors, ...sponsors];

  return (
    <div className="ticker-wrapper w-full overflow-hidden md:hidden">
      <div className="ticker-track py-1">
        {tickerItems.map((slot, index) => (
          <a
            key={`${slot.id}-${index}`}
            href={slot.advertiser_url}
            target={slot.advertiser_url.startsWith("mailto:") ? undefined : "_blank"}
            rel={slot.advertiser_url.startsWith("mailto:") ? undefined : "noopener noreferrer"}
            className="mr-4 flex h-12 w-[180px] shrink-0 items-center gap-2 rounded-full border border-gray-200 bg-white px-3 shadow-sm"
            aria-label={slot.advertiser_name}
          >
            <SponsorTickerLogo name={slot.advertiser_name} logoUrl={slot.logo_url} />
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-bold leading-tight text-gray-900">
                {slot.advertiser_name}
              </span>
              <span className="block truncate text-[11px] leading-tight text-gray-500">
                {slot.tagline ?? "Featured sponsor"}
              </span>
            </span>
          </a>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .ticker-wrapper {
          overflow: hidden;
          width: 100%;
        }

        .ticker-track {
          display: flex;
          width: max-content;
          animation: marquee 30s linear infinite;
        }

        .ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100 animate-pulse">
      {[...Array(7)].map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-4 bg-gray-100 rounded w-3/4" />
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
  const [adSlots, setAdSlots] = useState<LeaderboardAdSlotRow[]>([]);

  useEffect(() => {
    async function loadAdSlots() {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data: rows } = await supabase
          .from("ad_slots")
          .select("id, advertiser_name, advertiser_url, logo_url, tagline")
          .eq("is_active", true)
          .order("created_at", { ascending: true })
          .limit(8);

        if (!rows) {
          setAdSlots([]);
          return;
        }

        const cleaned: LeaderboardAdSlotRow[] = rows.map((r) => ({
          id: r.id as string,
          advertiser_name: r.advertiser_name as string,
          advertiser_url: r.advertiser_url as string,
          logo_url: (r.logo_url as string | null) ?? null,
          tagline: (r.tagline as string | null) ?? null,
        }));
        setAdSlots(cleaned);
      } catch {
        setAdSlots([]);
      }
    }
    void loadAdSlots();
  }, []);

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
    <div className="overflow-x-hidden">
      <PublicNav />
      {/* Page header */}
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 py-10">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest mb-2">
            Leaderboard
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Top-ranked products
          </h1>
          <p className="mt-2 text-gray-500 text-sm">
            Ranked by verified trust signals — reviews, revenue, and more.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 py-8">
        <div className="grid md:grid-cols-[160px_minmax(0,1fr)_160px] grid-cols-1 gap-6">
          {/* Left sidebar — Sponsors */}
          <aside className="hidden md:block md:w-[160px] shrink-0 self-start md:sticky md:top-24 md:z-10">
            <div className="space-y-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                Sponsors
              </p>
              <SponsorAdCard slot={adSlots[0] ?? null} />
              <SponsorAdCard slot={adSlots[1] ?? null} />
            </div>
          </aside>

          {/* Center — leaderboard */}
          <div className="min-w-0 w-full">
          <div className="mb-6 md:hidden">
            <SponsorTicker adSlots={adSlots} />
          </div>

          {/* Filters row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            {/* Category tabs */}
            <div className="flex items-center gap-1 flex-wrap">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => handleCategory(c)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    category === c
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Sort select */}
            <div className="flex items-center gap-2 shrink-0">
              <label htmlFor="sort-select" className="text-sm text-gray-500 whitespace-nowrap">
                Sort by
              </label>
              <select
                id="sort-select"
                value={sort}
                onChange={(e) => handleSort(e.target.value as SortValue)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600 mb-4">
              {error}
            </div>
          )}

          {/* Table — desktop */}
          <div className="hidden sm:block overflow-x-auto rounded-2xl border border-gray-100 shadow-sm bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
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
                      <td colSpan={8} className="px-4 py-16 text-center text-gray-400 text-sm">
                        No products found for this filter.
                      </td>
                    </tr>
                  )
                  : data?.products.map((p, i) => (
                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <RankBadge rank={offset + i + 1} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <ProductLogo name={p.name} logoUrl={p.logo_url} />
                          <div>
                            <p className="font-semibold text-gray-900">{p.name}</p>
                            {p.tagline && (
                              <p className="text-xs text-gray-500 line-clamp-1 max-w-[200px]">
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
                      <td className="px-4 py-4 text-right tabular-nums text-gray-700">
                        {p.review_count?.toLocaleString() ?? "0"}
                      </td>
                      <td className="px-4 py-4 text-right tabular-nums font-medium text-gray-800">
                        {p.revenue_verified ? formatMrr(p.revenue_mrr) : "—"}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <TrustScore score={p.trust_score} />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link
                          href={`/p/${p.slug}`}
                          className="text-indigo-600 hover:text-indigo-800 font-medium text-xs whitespace-nowrap"
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
          <div className="sm:hidden space-y-3">
            {loading
              ? [...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl border border-gray-100 bg-white p-4 h-24" />
              ))
              : data?.products.length === 0
              ? (
                <p className="text-center text-gray-400 py-12 text-sm">
                  No products found for this filter.
                </p>
              )
              : data?.products.map((p, i) => (
                <div key={p.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <RankBadge rank={offset + i + 1} />
                    <ProductLogo name={p.name} logoUrl={p.logo_url} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-gray-900 text-sm truncate">{p.name}</p>
                        <TrustScore score={p.trust_score} />
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <CategoryBadge category={p.category} />
                        <StarRating rating={p.avg_rating} />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {p.review_count ?? 0} reviews ·{" "}
                          {p.revenue_verified ? formatMrr(p.revenue_mrr) : "MRR —"}
                        </span>
                        <Link
                          href={`/p/${p.slug}`}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
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
              <p className="text-sm text-gray-500">
                Showing {offset + 1}–{Math.min(offset + data.pageSize, data.total)} of {data.total} products
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Prev
                </button>
                <span className="text-sm text-gray-600">
                  Page {data.page} of {data.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages || loading}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Total count line when single page */}
          {data && data.totalPages <= 1 && !loading && (
            <p className="mt-4 text-sm text-gray-400">
              {data.total} product{data.total !== 1 ? "s" : ""} listed
            </p>
          )}
          <div className="mt-6 md:hidden">
            <SponsorTicker adSlots={adSlots} />
          </div>
          </div>

          {/* Right sidebar — sponsors + advertise CTA */}
          <aside className="hidden md:block md:w-[160px] shrink-0 self-start md:sticky md:top-24 md:z-10">
            <div className="space-y-4">
              <SponsorAdCard slot={adSlots[2] ?? null} />
              <SponsorAdCard slot={adSlots[3] ?? null} />
              <LeaderboardAdvertiseCard />
            </div>
          </aside>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
