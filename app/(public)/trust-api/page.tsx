import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Trust API — AgentTrust",
  description:
    "AgentTrust Trust API documentation for AI developers. Query structured product trust profiles with no authentication required.",
};

const CODE_BLOCK = "bg-gray-950 text-green-400";

const trustApiJsonHtml = `{
  <span class="text-sky-400">\"schema\"</span>: <span class="text-emerald-400">\"agenttrust/trust/v1\"</span>,
  <span class="text-sky-400">\"generated_at\"</span>: <span class="text-emerald-400">\"2026-05-10T10:00:00Z\"</span>,
  <span class="text-sky-400">\"product\"</span>: {<br />
    <span class="pl-4"><span class="text-sky-400">\"name\"</span>: <span class="text-emerald-400">\"Notion\"</span>,</span><br />
    <span class="pl-4"><span class="text-sky-400">\"slug\"</span>: <span class="text-emerald-400">\"notion\"</span>,</span><br />
    <span class="pl-4"><span class="text-sky-400">\"description\"</span>: <span class="text-emerald-400">\"All-in-one workspace for notes and collaboration\"</span>,</span><br />
    <span class="pl-4"><span class="text-sky-400">\"url\"</span>: <span class="text-emerald-400">\"https://notion.so\"</span>,</span><br />
    <span class="pl-4"><span class="text-sky-400">\"category\"</span>: <span class="text-emerald-400">\"productivity\"</span></span><br />
  },<br />
  <span class="text-sky-400">\"trust\"</span>: {<br />
    <span class="pl-4"><span class="text-sky-400">\"score\"</span>: <span class="text-amber-400">84</span>,</span><br />
    <span class="pl-4"><span class="text-sky-400">\"grade\"</span>: <span class="text-emerald-400">\"A\"</span>,</span><br />
    <span class="pl-4"><span class="text-sky-400">\"breakdown\"</span>: {<br />
      <span class="pl-6"><span class="text-sky-400">\"rating_score\"</span>: <span class="text-amber-400">88</span>,</span><br />
      <span class="pl-6"><span class="text-sky-400">\"volume_score\"</span>: <span class="text-amber-400">90</span>,</span><br />
      <span class="pl-6"><span class="text-sky-400">\"recency_score\"</span>: <span class="text-amber-400">78</span>,</span><br />
      <span class="pl-6"><span class="text-sky-400">\"verification_score\"</span>: <span class="text-amber-400">75</span></span><br />
    },</span><br />
  },<br />
  <span class="text-sky-400">\"reviews\"</span>: {<br />
    <span class="pl-4"><span class="text-sky-400">\"total\"</span>: <span class="text-amber-400">312</span>,</span><br />
    <span class="pl-4"><span class="text-sky-400">\"verified_customers\"</span>: <span class="text-amber-400">198</span>,</span><br />
    <span class="pl-4"><span class="text-sky-400">\"average_rating\"</span>: <span class="text-amber-400">4.6</span>,</span><br />
    <span class="pl-4"><span class="text-sky-400">\"distribution\"</span>: { <span class="text-sky-400">\"5\"</span>: <span class="text-amber-400">178</span>, <span class="text-sky-400">\"4\"</span>: <span class="text-amber-400">89</span>, <span class="text-sky-400">\"3\"</span>: <span class="text-amber-400">30</span>, <span class="text-sky-400">\"2\"</span>: <span class="text-amber-400">10</span>, <span class="text-sky-400">\"1\"</span>: <span class="text-amber-400">5</span> },</span><br />
    <span class="pl-4"><span class="text-sky-400">\"recent\"</span>: [<br />
      <span class="pl-6">{</span><br />
      <span class="pl-8"><span class="text-sky-400">\"rating\"</span>: <span class="text-amber-400">5</span>,</span><br />
      <span class="pl-8"><span class="text-sky-400">\"excerpt\"</span>: <span class="text-emerald-400">\"Transformed how our team organizes knowledge.\"</span>,</span><br />
      <span class="pl-8"><span class="text-sky-400">\"reviewer_role\"</span>: <span class="text-emerald-400">\"Head of Product\"</span>,</span><br />
      <span class="pl-8"><span class="text-sky-400">\"verified_customer\"</span>: <span class="text-violet-400">true</span>,</span><br />
      <span class="pl-8"><span class="text-sky-400">\"date\"</span>: <span class="text-emerald-400">\"2026-04-30\"</span></span><br />
      <span class="pl-6">]</span><br />
    </span><br />
  },<br />
  <span class="text-sky-400">\"revenue\"</span>: {<br />
    <span class="pl-4"><span class="text-sky-400">\"verified\"</span>: <span class="text-violet-400">true</span>,</span><br />
    <span class="pl-4"><span class="text-sky-400">\"platforms\"</span>: [<span class="text-emerald-400">\"stripe\"</span>, <span class="text-emerald-400">\"revenuecat\"</span>],</span><br />
    <span class="pl-4"><span class="text-sky-400">\"combined\"</span>: {<br />
      <span class="pl-6"><span class="text-sky-400">\"mrr_usd\"</span>: <span class="text-amber-400">6800</span>,</span><br />
      <span class="pl-6"><span class="text-sky-400">\"arr_usd\"</span>: <span class="text-amber-400">81600</span>,</span><br />
      <span class="pl-6"><span class="text-sky-400">\"total_revenue_usd\"</span>: <span class="text-amber-400">94200</span>,</span><br />
      <span class="pl-6"><span class="text-sky-400">\"paying_customers\"</span>: <span class="text-amber-400">1247</span>,</span><br />
      <span class="pl-6"><span class="text-sky-400">\"mom_growth_percent\"</span>: <span class="text-amber-400">11.2</span></span><br />
    },</span><br />
  },<br />
  <span class="text-sky-400">\"agent_summary\"</span>: <span class="text-emerald-400">\"Notion has 312 verified reviews (avg 4.6/5), trust score 84/100, and $6,800 MRR verified across Stripe and RevenueCat. 1,247 paying customers. +11.2% MoM growth.\"</span>,
  <span class="text-sky-400">\"meta\"</span>: {<br />
    <span class="pl-4"><span class="text-sky-400">\"agent_queries_total\"</span>: <span class="text-amber-400">2341</span>,</span><br />
    <span class="pl-4"><span class="text-sky-400">\"agent_queries_30d\"</span>: <span class="text-amber-400">187</span>,</span><br />
    <span class="pl-4"><span class="text-sky-400">\"profile_url\"</span>: <span class="text-emerald-400">\"https://agenttrust.com/p/notion\"</span>,</span><br />
    <span class="pl-4"><span class="text-sky-400">\"cache_ttl\"</span>: <span class="text-amber-400">3600</span></span><br />
  }<br />
}`;

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            AT
          </span>
          <span className="text-base tracking-tight">AgentTrust</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-gray-600 dark:text-slate-300 md:flex">
          <Link href="/leaderboard" className="hover:text-gray-900 dark:hover:text-white transition-colors">
            Leaderboard
          </Link>
          <Link href="/trust-api" className="hover:text-gray-900 dark:hover:text-white transition-colors">
            Trust API
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors dark:text-slate-300 dark:hover:text-white sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Get started free
          </Link>
        </div>
      </div>
    </header>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
      {label}
    </span>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">{children}</h2>;
}

function SectionSubhead({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300">{children}</p>;
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className={`overflow-x-auto rounded-3xl border border-slate-800/70 px-4 py-5 text-sm font-mono leading-6 ${CODE_BLOCK}`}>
      <code className="block whitespace-pre">{children}</code>
    </pre>
  );
}

function SectionCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-slate-700/70 dark:bg-slate-900">
      <p className="text-3xl font-semibold text-slate-950 dark:text-white">{value}</p>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  );
}

function ToolCard({ name, input, returns }: { name: string; input: string; returns: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700/70 dark:bg-slate-950">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{name}</p>
      <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">
        <span className="font-semibold">Input:</span> {input}
      </p>
      <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
        <span className="font-semibold">Returns:</span> {returns}
      </p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200/80 bg-white py-10 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">AT</span>
            AgentTrust
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-600 dark:text-slate-400">
            <Link href="/leaderboard" className="hover:text-slate-900 dark:hover:text-white">
              Leaderboard
            </Link>
            <Link href="/trust-api" className="hover:text-slate-900 dark:hover:text-white">
              Trust API
            </Link>
            <Link href="/signup" className="hover:text-slate-900 dark:hover:text-white">
              Get started
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function TrustApiPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
      <Navbar />
      <main className="mx-auto max-w-[820px] px-4 py-10 sm:px-6 sm:py-14">
        <section className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge label="REST API" />
            <Badge label="MCP server" />
            <Badge label="No auth required" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
            Make your product discoverable by AI agents
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-slate-700 dark:text-slate-300">
            AgentTrust exposes structured trust data that AI assistants, autonomous agents, and
            LLM-powered apps can query in real time — before recommending or purchasing on behalf
            of a user.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex w-full items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 sm:w-auto"
            >
              Add your product free →
            </Link>
            <Link
              href="/leaderboard"
              className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 sm:w-auto"
            >
              View leaderboard
            </Link>
          </div>
        </section>

        <section className="mt-20 space-y-6">
          <SectionHeading>Why this matters</SectionHeading>
          <SectionSubhead>
            AI agents browsing the web on behalf of users cannot read star ratings or visual review
            widgets. They need structured, machine-readable data. AgentTrust is the trust layer
            that makes your product legible to AI.
          </SectionSubhead>
          <div className="grid gap-4 sm:grid-cols-3">
            <SectionCard
              title="Growth in agentic web traffic in 8 months of 2025"
              value="6,900%"
              description="A rapid surge in AI-driven discovery across the public web."
            />
            <SectionCard
              title="Online sales driven by AI agents in holiday 2025"
              value="$22B+"
              description="AI agent conversions generated massive revenue in late 2025."
            />
            <SectionCard
              title="Public MCP servers deployed by late 2025"
              value="10,000+"
              description="Widespread agent discovery infrastructure across the web."
            />
          </div>
        </section>

        <section className="mt-20 space-y-6">
          <SectionHeading>{"Query any product's trust profile"}</SectionHeading>
          <SectionSubhead>One GET request. No API key. Structured JSON.</SectionSubhead>
          <div className="space-y-4">
            <CodeBlock>GET https://agenttrust.com/api/trust/[product-slug]</CodeBlock>
            <CodeBlock>curl https://agenttrust.com/api/trust/notion</CodeBlock>
          </div>
          <CodeBlock>
            <span dangerouslySetInnerHTML={{ __html: trustApiJsonHtml }} />
          </CodeBlock>
        </section>

        <section className="mt-20 space-y-6">
          <SectionHeading>Key fields for agents</SectionHeading>
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 dark:border-slate-700/70 dark:bg-slate-900">
            <div className="grid grid-cols-[1.5fr_0.9fr_2.5fr] gap-x-6 gap-y-3 px-5 py-5 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <div>Field</div>
              <div>Type</div>
              <div>Description</div>
            </div>
            <div className="divide-y divide-slate-200/80 px-5 dark:divide-slate-700/80">
              {[
                ["trust.score", "number", "Composite trust score 0–100"],
                ["trust.grade", "string", "Letter grade A–F"],
                ["reviews.average_rating", "number", "Verified avg star rating"],
                ["reviews.verified_customers", "number", "Reviews from confirmed paying customers"],
                ["revenue.combined.mrr_usd", "number", "Monthly recurring revenue in USD"],
                ["revenue.platforms", "array", "Which platforms are verified (stripe, etc.)"],
                ["agent_summary", "string", "Pre-written summary string for LLM context"],
              ].map(([field, type, description]) => (
                <div key={field} className="grid grid-cols-[1.5fr_0.9fr_2.5fr] gap-x-6 gap-y-2 py-4 text-sm text-slate-700 dark:text-slate-300">
                  <div className="font-medium text-slate-900 dark:text-white">{field}</div>
                  <div className="text-slate-600 dark:text-slate-400">{type}</div>
                  <div className="text-slate-600 dark:text-slate-400">{description}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-20 space-y-6">
          <SectionHeading>Connect via MCP</SectionHeading>
          <SectionSubhead>
            AI agents using Model Context Protocol can discover and query AgentTrust without
            writing raw HTTP.
          </SectionSubhead>
          <CodeBlock>https://mcp.agenttrust.com/sse</CodeBlock>
          <div className="space-y-4">
            <ToolCard
              name="get_trust_profile"
              input="product name, slug, or URL"
              returns="Full trust profile JSON for that product"
            />
            <ToolCard
              name="search_trusted_products"
              input="category (string), min_trust_score (optional)"
              returns="Ranked list of trusted products in that category"
            />
            <ToolCard
              name="compare_products"
              input="array of product slugs (2–4)"
              returns="Side-by-side trust comparison"
            />
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            MCP access available on Scale plan · $99/mo
          </p>
        </section>

        <section className="mt-20 space-y-6">
          <SectionHeading>Rate limits & caching</SectionHeading>
          <ul className="space-y-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
            <li>• Public API: 100 requests / minute, no authentication required</li>
            <li>• Responses cached for 1 hour (Cache-Control: public, max-age=3600)</li>
            <li>• Higher limits or dedicated access: contact@agenttrust.com</li>
            <li>• Scale plan includes API analytics — see which agents queried your profile</li>
          </ul>
        </section>

        <section className="mt-20 rounded-3xl bg-slate-950 px-6 py-12 text-white">
          <div className="max-w-3xl space-y-4">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Add your product to AgentTrust</p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Add your product to AgentTrust
            </h2>
            <p className="text-base leading-7 text-slate-300">
              Free forever. Your trust profile goes live in 60 seconds. AI agents start discovering your
              product immediately.
            </p>
            <Link
              href="/signup"
              className="inline-flex rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-colors hover:bg-indigo-400"
            >
              Get started free →
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
