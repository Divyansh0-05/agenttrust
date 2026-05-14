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
  { label: "🔴 Live", value: "live" },
  { label: "Recent", value: "recent" },
  { label: "Most Reviewed", value: "most_reviewed" },
];

const PLATFORMS = [
  "Stripe",
  "Lemon Squeezy",
  "RevenueCat",
  "Dodo Payments",
  "Paddle",
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
    <section className="px-6 py-16 text-center bg-white border-b border-gray-100">
      <div className="inline-flex gap-2 justify-center mb-6">
        {["⬡ MCP", "◈ Trust API", "▲ AgentUP"].map((pill) => (
          <span
            key={pill}
            className="text-xs px-3 py-1 rounded-full border border-gray-200 text-gray-500 flex items-center gap-1.5"
          >
            {pill}
          </span>
        ))}
      </div>

      <h1 className="text-4xl font-semibold text-gray-900 leading-tight mb-4">
        Verified trust for{" "}
        <span className="text-violet-600">people and AI agents</span>
      </h1>

      <p className="text-base text-gray-500 max-w-xl mx-auto mb-8 leading-relaxed">
        Collect reviews. Verify revenue across Stripe, Lemon Squeezy,
        RevenueCat and more. Let AI agents query your trust data.
      </p>

      <div className="flex gap-4 justify-center">
        <Link
          href="/signup"
          className="bg-violet-600 text-white px-7 py-2.5 rounded-xl font-medium hover:bg-violet-700 transition-colors"
        >
          Submit
        </Link>
        <Link
          href="/leaderboard"
          className="border border-gray-200 text-gray-700 px-7 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Browse
        </Link>
      </div>
    </section>
  );
}

function PlatformStrip() {
  return (
    <section className="bg-white">
      <p className="text-xs text-gray-400 text-center pt-4">
        Verified revenue from
      </p>
      <div className="flex flex-wrap gap-6 justify-center py-3 border-b border-gray-100 px-6">
        {PLATFORMS.map((platform) => (
          <span
            key={platform}
            className="text-xs font-medium text-gray-400 hover:text-gray-600"
          >
            {platform}
          </span>
        ))}
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

      <div className="flex gap-0 border-b border-gray-100 bg-white sticky top-[53px] z-[9] px-6">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={`text-sm px-4 py-3 cursor-pointer border-b-2 border-transparent text-gray-500 hover:text-gray-800 transition-colors ${
              activeTab === tab.value
                ? "text-violet-600 border-b-2 border-violet-600 font-medium"
                : ""
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section>
        <div className="flex items-center justify-between px-6 py-3">
          <h2 className="text-sm font-medium text-gray-600">
            Today&apos;s top products
          </h2>
          <Link
            href="/leaderboard"
            className="text-sm text-violet-600 hover:text-violet-700"
          >
            See all →
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
