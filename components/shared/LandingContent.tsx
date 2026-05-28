"use client";

import { ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { AgentUpButton } from "@/components/shared/AgentUpButton";

export interface LandingProduct {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  logo_url: string | null;
  avg_rating: number | null;
  review_count: number | null;
  trust_score: number | null;
  agentup_count: number | null;
  revenue_verified: boolean | null;
  category: string | null;
}

function scoreProduct(product: LandingProduct): number {
  return (
    (product.agentup_count ?? 0) * 0.6 +
    (product.review_count ?? 0) * 0.25 +
    (product.trust_score ?? 0) * 0.15
  );
}

function brandTint(index: number): string {
  const tints = [
    "bg-[#2a1830]",
    "bg-[#202123]",
    "bg-[#351c1f]",
    "bg-[#1f2630]",
    "bg-[#221d31]",
  ];

  return tints[index % tints.length];
}

function ProductLogo({
  product,
  size = "md",
}: {
  product: LandingProduct;
  size?: "sm" | "md";
}) {
  const sizeClass = size === "sm" ? "size-9 rounded-lg" : "size-11 rounded-xl";

  if (product.logo_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={product.logo_url}
        alt={product.name}
        className={`${sizeClass} border border-white/10 object-cover`}
      />
    );
  }

  return (
    <span
      className={`${sizeClass} flex items-center justify-center border border-white/10 bg-zinc-700 text-sm font-semibold text-white`}
    >
      {product.name.charAt(0).toUpperCase() || "?"}
    </span>
  );
}

function NavPill() {
  return (
    <nav className="mx-auto flex min-h-12 w-full max-w-[720px] items-center justify-between gap-2 rounded-full border border-white/15 bg-zinc-100 px-4 text-black shadow-[0_0_42px_rgba(255,255,255,0.12)] sm:px-5">
      <Link href="/" className="hidden text-sm font-semibold tracking-tight sm:block">
        AgentTrust
      </Link>
      <div className="flex flex-1 items-center justify-center gap-2 text-xs font-medium sm:gap-4 sm:text-sm">
        <Link href="/leaderboard" className="hover:text-orange-600">
          Leaderboard
        </Link>
        <Link href="/trust-api" className="hover:text-orange-600">
          Trust API
        </Link>
        <Link href="/pricing" className="hover:text-orange-600">
          Pricing
        </Link>
      </div>
      <div className="flex items-center gap-1.5">
        <Link
          href="/login"
          className="rounded-full px-2.5 py-1.5 text-xs font-semibold hover:bg-black/10 sm:px-3"
        >
          Login
        </Link>
        <Link
          href="/signup"
          className="rounded-full bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600"
        >
          Sign up
        </Link>
      </div>
    </nav>
  );
}

function Hero({
  query,
  onQueryChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
}) {
  return (
    <section className="px-4 pb-7 pt-4 text-center sm:px-6">
      <NavPill />
      <p className="mt-5 text-base font-semibold tracking-tight text-zinc-100 sm:text-lg">
        The Trust Layer For AI-Native Era
      </p>
      <h1 className="mx-auto mt-1 max-w-4xl text-balance text-4xl font-semibold leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-7xl">
        Reach <span className="text-orange-400">AI Agents &amp; Humans</span>{" "}
        Faster
      </h1>

      <div className="mx-auto mt-7 flex max-w-3xl flex-col items-center justify-center gap-3 sm:flex-row sm:gap-5">
        <Link
          href="/signup"
          className="rounded-full border border-white/15 bg-white/[0.04] px-5 py-2 text-sm font-semibold text-white shadow-[0_0_24px_rgba(255,255,255,0.05)] transition-colors hover:border-orange-400/40 hover:bg-orange-500/10 hover:text-orange-100 sm:text-base"
        >
          Add Product
        </Link>
        <label className="flex h-11 min-w-0 items-center gap-3 rounded-full border border-white/15 bg-white/[0.04] px-4 shadow-[0_0_24px_rgba(255,255,255,0.05)] transition-colors focus-within:border-orange-400/40">
          <Search className="size-5 shrink-0 text-zinc-300" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="SaaS, Vibe Coding, Content"
            className="w-[230px] max-w-[68vw] bg-transparent text-sm font-medium text-white outline-none placeholder:text-zinc-400 sm:w-[330px] sm:text-base"
          />
        </label>
      </div>
    </section>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
      <h2 className="text-xl font-medium tracking-tight text-white sm:text-2xl">
        {title}
      </h2>
      <Link
        href="/leaderboard"
        className="inline-flex items-center gap-0.5 text-[11px] font-medium text-zinc-500 hover:text-zinc-100"
      >
        View all
        <ChevronRight className="size-3.5" aria-hidden />
      </Link>
    </div>
  );
}

function MarketCard({
  product,
  index,
}: {
  product: LandingProduct;
  index: number;
}) {
  return (
    <article
      className={`relative flex h-[118px] min-w-[236px] flex-col justify-between rounded-lg border border-white/12 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] ${brandTint(
        index,
      )}`}
    >
      <span className="absolute right-0 top-0 rounded-bl-lg rounded-tr-lg bg-orange-500/15 px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-orange-300">
        {product.revenue_verified ? "Verified" : "For Sale"}
      </span>

      <div className="flex items-start gap-3 pr-12">
        <ProductLogo product={product} />
        <div className="min-w-0">
          <Link
            href={`/p/${product.slug}`}
            className="block truncate text-sm font-semibold text-zinc-50 drop-shadow-sm hover:text-orange-200"
          >
            {product.name}
          </Link>
          <p className="truncate text-xs font-medium text-zinc-300">
            {product.category ?? "AI Product"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-left">
        <CardMetric label="Trust" value={product.trust_score ?? 0} />
        <CardMetric label="Reviews" value={product.review_count ?? 0} />
        <CardMetric label="AgentUPs" value={product.agentup_count ?? 0} />
      </div>
    </article>
  );
}

function CardMetric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[9px] font-semibold uppercase tracking-wide text-zinc-400">
        {label}
      </p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function HorizontalProductSection({
  title,
  products,
}: {
  title: string;
  products: LandingProduct[];
}) {
  return (
    <section className="border-t border-white/10 bg-black">
      <SectionHeader title={title} />
      <div className="scrollbar-hide overflow-x-auto px-3 py-2.5">
        <div className="grid auto-cols-[236px] grid-flow-col gap-3">
          {products.slice(0, 8).map((product, index) => (
            <MarketCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function LeaderboardSection({ products }: { products: LandingProduct[] }) {
  return (
    <section className="border-t border-white/10 bg-black px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-medium tracking-tight text-white sm:text-2xl">
          Products leaderboard
        </h2>
        <Link
          href="/leaderboard"
          className="text-[11px] font-medium text-zinc-500 hover:text-zinc-100"
        >
          view all &gt;
        </Link>
      </div>

      <div className="divide-y divide-white/10 rounded-lg border border-white/10 bg-[#101113] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        {products.slice(0, 7).map((product, index) => (
          <div
            key={product.id}
            className="grid grid-cols-[32px_1fr_auto] items-center gap-3 px-3 py-2.5 transition-colors hover:bg-white/[0.04]"
          >
            <span className="text-sm font-semibold text-zinc-500">
              #{index + 1}
            </span>
            <div className="flex min-w-0 items-center gap-3">
              <ProductLogo product={product} size="sm" />
              <div className="min-w-0">
                <Link
                  href={`/p/${product.slug}`}
                  className="block truncate text-sm font-semibold text-white hover:text-orange-200"
                >
                  {product.name}
                </Link>
                <p className="truncate text-xs text-zinc-400">
                  {product.tagline ?? product.category ?? "Trusted AI-native product"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  Trust
                </p>
                <p className="text-sm font-semibold text-white">
                  {product.trust_score ?? 0}
                </p>
              </div>
              <AgentUpButton
                productId={product.id}
                initialCount={product.agentup_count ?? 0}
                initialUpped={false}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function LandingContent({
  products,
}: {
  products: LandingProduct[];
}) {
  const [query, setQuery] = useState("");

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return products;
    }

    return products.filter((product) =>
      [product.name, product.tagline, product.category]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [products, query]);

  const topProducts = useMemo(
    () => [...filteredProducts].sort((a, b) => scoreProduct(b) - scoreProduct(a)),
    [filteredProducts],
  );
  const recentProducts = useMemo(
    () => [...filteredProducts].sort((a, b) => b.id.localeCompare(a.id)),
    [filteredProducts],
  );

  return (
    <div className="min-h-screen overflow-x-hidden rounded-[32px] bg-black text-white xl:rounded-[44px]">
      <Hero query={query} onQueryChange={setQuery} />

      {filteredProducts.length === 0 ? (
        <section className="border-t border-white/10 px-4 py-12 text-center">
          <p className="text-2xl font-light text-white">No products found</p>
          <p className="mt-2 text-sm text-zinc-500">
            Try another search term or add the first product.
          </p>
        </section>
      ) : (
        <>
          <HorizontalProductSection title="Top 5 on TrustAgent" products={topProducts} />
          <HorizontalProductSection
            title="Recently launched"
            products={recentProducts}
          />
          <LeaderboardSection products={topProducts} />
        </>
      )}
    </div>
  );
}
