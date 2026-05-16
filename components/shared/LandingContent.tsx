"use client";

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

type Tab = "top" | "live" | "recent" | "most_reviewed";

const TABS: Array<{ label: string; value: Tab }> = [
  { label: "Top", value: "top" },
  { label: "Live", value: "live" },
  { label: "Recent", value: "recent" },
  { label: "Most Reviewed", value: "most_reviewed" },
];

const PLATFORMS: Array<{ name: string; mark: string; wordmark: string }> = [
  { name: "Stripe", mark: "S", wordmark: "stripe" },
  { name: "Lemon Squeezy", mark: "LS", wordmark: "lemon" },
  { name: "RevenueCat", mark: "RC", wordmark: "RevenueCat" },
  { name: "Dodo Payments", mark: "D", wordmark: "dodo" },
  { name: "Paddle", mark: "P", wordmark: "paddle" },
];

function getLogoColor(name: string): string {
  const firstLetter = name.charAt(0).toUpperCase();

  if ("ABCDE".includes(firstLetter)) {
    return "bg-violet-500";
  }

  if ("FGHIJ".includes(firstLetter)) {
    return "bg-emerald-500";
  }

  if ("KLMNO".includes(firstLetter)) {
    return "bg-orange-500";
  }

  if ("PQRST".includes(firstLetter)) {
    return "bg-blue-500";
  }

  return "bg-pink-500";
}

function ShieldIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 text-violet-600"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3.75 5.25 6v5.25c0 4.14 2.77 7.99 6.75 9 3.98-1.01 6.75-4.86 6.75-9V6L12 3.75Z"
      />
    </svg>
  );
}

function Navbar() {
  return (
    <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100">
      <div className="flex items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <ShieldIcon />
          <span className="text-base font-semibold text-gray-900">
            AgentTrust
          </span>
        </Link>

        <nav className="hidden md:flex text-sm text-gray-500 transition-colors gap-6">
          <Link
            href="/leaderboard"
            className="hover:text-gray-800 transition-colors"
          >
            Leaderboard
          </Link>
          <Link
            href="/trust-api"
            className="hover:text-gray-800 transition-colors"
          >
            Trust API
          </Link>
          <Link href="/pricing" className="hover:text-gray-800 transition-colors">
            Pricing
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="text-sm px-4 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="text-sm px-4 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 font-medium"
          >
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="border-b border-gray-100 bg-white px-6 py-9 text-center sm:py-11">
      <p className="mx-auto mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-500">
        Verified trust for people and AI agents
      </p>

      <h1 className="mx-auto mb-3 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight text-gray-950 sm:text-5xl">
        The Trust Layer For AI-Native Products
      </h1>

      <p className="mx-auto mb-6 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
        Collect reviews, verify revenue, and publish trust signals that people and AI agents can inspect before they choose what to use.
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/signup"
          className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-violet-200/60 transition-colors hover:bg-violet-700"
        >
          Submit product
        </Link>
        <Link
          href="/leaderboard"
          className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
        >
          Browse products
        </Link>
      </div>
    </section>
  );
}

function PlatformStrip() {
  return (
    <section className="border-b border-gray-100 bg-white px-6 py-4">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
          Trusted integrations
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {PLATFORMS.map((platform) => (
            <span
              key={platform.name}
              className="group relative inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-500 transition-all hover:border-violet-200 hover:bg-white hover:text-gray-800 hover:shadow-sm"
              aria-label={platform.name}
            >
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full border border-gray-200 bg-white px-1 text-[9px] font-bold tracking-tight text-gray-400 group-hover:border-violet-200 group-hover:text-violet-600">
                {platform.mark}
              </span>
              <span className="tracking-tight">{platform.wordmark}</span>
              <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-gray-600 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                {platform.name}
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductLogo({ product }: { product: LandingProduct }) {
  if (product.logo_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={product.logo_url}
        alt={product.name}
        className="w-10 h-10 rounded-xl object-cover"
      />
    );
  }

  return (
    <div
      className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-base font-semibold ${getLogoColor(
        product.name,
      )}`}
    >
      {product.name.charAt(0).toUpperCase() || "?"}
    </div>
  );
}

function ProductRow({ product }: { product: LandingProduct }) {
  const roundedRating = Math.round(product.avg_rating ?? 0);

  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-50 hover:bg-gray-50/80 transition-colors group">
      <ProductLogo product={product} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link
            href={`/p/${product.slug}`}
            className="text-sm font-semibold text-gray-900 group-hover:text-violet-700 transition-colors"
          >
            {product.name}
          </Link>
          {product.revenue_verified ? (
            <span className="text-[10px] bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full border border-violet-100 font-medium">
              Verified MRR
            </span>
          ) : (
            <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100 font-medium">
              Free tier
            </span>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 truncate">
          {product.tagline ?? "No description yet"}
        </p>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-amber-400 text-xs">
            {"★".repeat(roundedRating)}
            {"☆".repeat(5 - roundedRating)}
          </span>
          <span className="text-xs text-gray-400">
            {product.review_count ?? 0} reviews
          </span>
        </div>
      </div>

      <AgentUpButton
        productId={product.id}
        initialCount={product.agentup_count ?? 0}
        initialUpped={false}
      />
    </div>
  );
}

function Footer() {
  return (
    <footer className="px-6 py-12 border-t border-gray-100 bg-white text-center">
      <p className="text-sm font-medium text-gray-500">🛡 AgentTrust</p>
      <p className="text-xs text-gray-400 mt-1">
        Verified trust for the AI-native era
      </p>

      <nav className="flex justify-center gap-6 mt-4">
        <Link
          href="/leaderboard"
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Leaderboard
        </Link>
        <Link
          href="/trust-api"
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Trust API
        </Link>
        <Link href="/pricing" className="text-xs text-gray-400 hover:text-gray-600">
          Pricing
        </Link>
        <Link href="/terms" className="text-xs text-gray-400 hover:text-gray-600">
          Terms
        </Link>
        <Link
          href="/privacy"
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Privacy
        </Link>
      </nav>

      <p className="text-xs text-gray-300 mt-4">© 2026 AgentTrust</p>
    </footer>
  );
}

export default function LandingContent({
  products,
}: {
  products: LandingProduct[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("top");

  const sortedProducts = useMemo(() => {
    const nextProducts = [...products];

    if (activeTab === "recent") {
      return nextProducts.sort((a, b) => b.id.localeCompare(a.id));
    }

    if (activeTab === "most_reviewed") {
      return nextProducts.sort(
        (a, b) => (b.review_count ?? 0) - (a.review_count ?? 0),
      );
    }

    return nextProducts.sort(
      (a, b) => (b.agentup_count ?? 0) - (a.agentup_count ?? 0),
    );
  }, [activeTab, products]);

  return (
    <>
      <Navbar />
      <Hero />
      <PlatformStrip />

      <div className="sticky top-[53px] z-[9] border-b border-gray-100 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center gap-2 overflow-x-auto rounded-2xl border border-gray-200 bg-gray-50 p-1 shadow-sm">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.value;

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={`relative shrink-0 cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-white text-violet-700 shadow-sm ring-1 ring-violet-100"
                    : "text-gray-500 hover:bg-white/70 hover:text-gray-800"
                }`}
              >
                {tab.value === "live" ? (
                  <span className="mr-1.5 inline-block size-1.5 rounded-full bg-emerald-500 align-middle shadow-[0_0_0_3px_rgba(16,185,129,0.12)]" />
                ) : null}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <section className="bg-white">
        <div className="flex flex-col gap-2 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">
              Today&apos;s top products
            </h2>
            <p className="mt-0.5 text-xs text-gray-400">
              Strong reviews and AgentUPs earn products free visibility across AgentTrust.
            </p>
          </div>
          <Link
            href="/leaderboard"
            className="text-sm font-semibold text-violet-600 transition-colors hover:text-violet-700"
          >
            See all -&gt;
          </Link>
        </div>

        {sortedProducts.map((product) => (
          <ProductRow key={product.id} product={product} />
        ))}
      </section>

      <Footer />
    </>
  );
}
