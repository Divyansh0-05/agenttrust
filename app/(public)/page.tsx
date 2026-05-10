import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AgentTrust — Verified proof for the AI-native era",
  description:
    "AgentTrust gives software products verified reviews and multi-platform revenue proof — readable by humans and AI agents alike.",
};

// ─────────────────────────────────────────────
// NAVBAR
// ─────────────────────────────────────────────
function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white text-sm font-bold">
            AT
          </span>
          <span className="text-base tracking-tight">AgentTrust</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link href="/leaderboard" className="hover:text-gray-900 transition-colors">
            Leaderboard
          </Link>
          <Link href="/trust-api" className="hover:text-gray-900 transition-colors">
            Trust API
          </Link>
        </nav>

        {/* CTAs */}
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

// ─────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pt-20 pb-24 sm:pt-28 sm:pb-32">
      {/* Subtle background gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-white"
      />
      {/* Decorative blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-100/60 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 right-0 h-72 w-72 rounded-full bg-violet-100/50 blur-3xl"
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
        {/* Eyebrow badge */}
        <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
          Built for the AI-native era
        </span>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
          AgentTrust —{" "}
          <span className="text-indigo-600">verified proof</span>
          <br className="hidden sm:block" /> for the AI-native era
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Collect <strong className="text-gray-800">verified reviews</strong> and connect{" "}
          <strong className="text-gray-800">multi-platform revenue verification</strong> — then let
          AI agents discover your product through{" "}
          <strong className="text-gray-800">structured trust data</strong> they can actually read.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            Get started free
          </Link>
          <Link
            href="/leaderboard"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            View leaderboard →
          </Link>
        </div>

        {/* Social proof line */}
        <p className="mt-8 text-sm text-gray-500">
          Free forever · No credit card required · Live AI Trust API
        </p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// HOW IT WORKS
// ─────────────────────────────────────────────
const STEPS = [
  {
    number: "01",
    title: "Register your product",
    description:
      "Sign up and add your product in under 60 seconds. Your public trust profile goes live immediately at agenttrust.com/p/your-product.",
  },
  {
    number: "02",
    title: "Collect reviews & connect revenue",
    description:
      "Share your review link anywhere. Connect Stripe, Lemon Squeezy, RevenueCat, Dodo, or Paddle to verify your revenue — read-only, we never move funds.",
  },
  {
    number: "03",
    title: "Display proof to humans & AI agents",
    description:
      "Embed a trust badge, share your profile, and let AI agents query your structured trust data via the Trust API. Every query is logged for your analytics.",
  },
];

function HowItWorks() {
  return (
    <section className="bg-gray-50 py-20 sm:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Heading */}
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest mb-3">
            How it works
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Three simple steps to verified trust
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step) => (
            <div key={step.number} className="relative bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <span className="block text-4xl font-black text-indigo-100 select-none mb-4">
                {step.number}
              </span>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// SUPPORTED PLATFORMS
// ─────────────────────────────────────────────
const PLATFORMS = [
  { name: "Stripe", color: "bg-[#635BFF]", initial: "S", description: "OAuth Connect" },
  { name: "Lemon Squeezy", color: "bg-amber-400", initial: "LS", description: "API Key" },
  { name: "RevenueCat", color: "bg-rose-500", initial: "RC", description: "Token + Project ID" },
  { name: "Dodo", color: "bg-emerald-500", initial: "D", description: "API Key" },
  { name: "Paddle", color: "bg-sky-500", initial: "P", description: "API Key" },
];

function Platforms() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest mb-3">
            Revenue verification
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Supports all major payment platforms
          </h2>
          <p className="mt-4 text-gray-600 max-w-xl mx-auto">
            Connect one or more platforms. Revenue data is read-only — we verify, never touch your funds.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-5">
          {PLATFORMS.map((p) => (
            <div
              key={p.name}
              className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-5 py-4 shadow-sm min-w-[180px]"
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${p.color} text-white text-sm font-bold shrink-0`}
              >
                {p.initial}
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                <p className="text-xs text-gray-500">{p.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// PRICING
// ─────────────────────────────────────────────
const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Get started with a public profile and up to 10 reviews.",
    features: [
      "Public trust profile",
      "Up to 10 reviews",
      "Basic trust badge",
      "1 product",
    ],
    cta: "Get started free",
    href: "/signup",
    highlight: false,
  },
  {
    name: "Starter",
    price: "$19",
    period: "/ month",
    description: "For indie hackers and early-stage products.",
    features: [
      "200 review requests / mo",
      "All widget styles",
      "Verified badge",
      "1 product",
    ],
    cta: "Start Starter",
    href: "/signup",
    highlight: false,
  },
  {
    name: "Growth",
    price: "$49",
    period: "/ month",
    description: "More volume, analytics, and priority placement.",
    features: [
      "1,000 review requests / mo",
      "3 products",
      "Analytics dashboard",
      "Priority leaderboard listing",
    ],
    cta: "Start Growth",
    href: "/signup",
    highlight: true,
    badge: "Most popular",
  },
  {
    name: "Scale",
    price: "$99",
    period: "/ month",
    description: "Unlimited everything for serious SaaS businesses.",
    features: [
      "Unlimited review requests",
      "10 products",
      "Agent Trust API access",
      "Remove branding",
    ],
    cta: "Start Scale",
    href: "/signup",
    highlight: false,
  },
];

function Pricing() {
  return (
    <section className="bg-gray-50 py-20 sm:py-28" id="pricing">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest mb-3">
            Pricing
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-gray-600">
            Start free. Upgrade when you need more reach.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-6 ${
                plan.highlight
                  ? "border-indigo-500 bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                  : "border-gray-200 bg-white text-gray-900 shadow-sm"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-block rounded-full bg-amber-400 px-3 py-0.5 text-xs font-semibold text-gray-900">
                  {plan.badge}
                </span>
              )}

              <p className={`text-sm font-semibold ${plan.highlight ? "text-indigo-100" : "text-gray-500"}`}>
                {plan.name}
              </p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-black">{plan.price}</span>
                <span className={`text-sm ${plan.highlight ? "text-indigo-200" : "text-gray-500"}`}>
                  {plan.period}
                </span>
              </div>
              <p className={`mt-2 text-sm ${plan.highlight ? "text-indigo-100" : "text-gray-600"}`}>
                {plan.description}
              </p>

              <ul className="mt-6 space-y-2.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <svg
                      className={`mt-0.5 h-4 w-4 shrink-0 ${plan.highlight ? "text-indigo-200" : "text-indigo-500"}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className={plan.highlight ? "text-indigo-50" : "text-gray-700"}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`mt-8 block w-full rounded-lg py-2.5 text-center text-sm font-semibold transition-colors ${
                  plan.highlight
                    ? "bg-white text-indigo-600 hover:bg-indigo-50"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2 text-gray-900 font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-white text-xs font-bold">
            AT
          </span>
          AgentTrust
        </div>

        {/* Links */}
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-500">
          <Link href="/leaderboard" className="hover:text-gray-800 transition-colors">
            Leaderboard
          </Link>
          <Link href="/trust-api" className="hover:text-gray-800 transition-colors">
            Trust API
          </Link>
          <Link href="#pricing" className="hover:text-gray-800 transition-colors">
            Pricing
          </Link>
          <Link href="/login" className="hover:text-gray-800 transition-colors">
            Sign in
          </Link>
          <Link href="/signup" className="hover:text-gray-800 transition-colors">
            Sign up
          </Link>
        </nav>

        {/* Legal */}
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} AgentTrust. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Platforms />
        <Pricing />
      </main>
      <Footer />
    </>
  );
}
