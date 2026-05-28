# AgentTrust

**Verified trust for people and AI agents.**

AgentTrust is an AI-native product discovery and trust verification platform. Founders list their products, collect verified reviews, connect their payment platforms to display verified revenue, and get found by both human visitors and AI agents like ChatGPT, Perplexity, and Claude.

Live: [agenttrust-theta.vercel.app](https://agenttrust-theta.vercel.app)

---

## What it does

**For founders (sellers):**
- List your product and get a public trust profile instantly at `/p/[slug]`
- Collect verified reviews via public form or email campaigns
- Connect Stripe, Lemon Squeezy, RevenueCat, Dodo, or Paddle to display verified MRR/ARR on your profile
- Run AI SEO audits to see how discoverable your product is to AI systems
- Embed a trust badge or review widget on your own website
- Track how many AI agents are querying your trust profile

**For human visitors:**
- Browse products ranked by trust score, reviews, and AgentUPs
- Read verified reviews from real customers
- See verified revenue pulled directly from payment platforms
- Upvote products with AgentUP (like Product Hunt upvotes)

**For AI agents:**
- Query any product's structured trust data via the Trust API
- Get JSON with trust score, review summary, verified revenue, and fix prompts
- Machine-readable reputation layer for AI-native search and recommendations

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| Billing | Dodo Payments (one-time purchases) |
| Email | Resend |
| Deployment | Vercel |
| Styling | Tailwind CSS |
| Revenue verification | Stripe Connect OAuth, Lemon Squeezy API, RevenueCat API, Dodo API, Paddle API |

---

## Pricing

One-time payment. No subscriptions. No renewals.

| Plan | Price | AI SEO Audits | Key features |
|---|---|---|---|
| Free | $0 | 3 lifetime | Unlimited listings, 10 reviews/product, basic badge |
| Starter | $29 | 29 lifetime | Unlimited reviews, verified revenue badge |
| Growth | $79 | 179 lifetime | Email campaigns (200/mo), all widget styles |
| Scale | $199 | 999 lifetime | Trust API access, priority sidebar, remove branding |

---

## Features

### Trust profiles
Every product gets a public profile at `agenttrust.com/p/[slug]` showing:
- Trust score (0–100) with grade (A/B/C/D/F)
- Star rating and review count
- Verified revenue section (MRR, ARR, customers, MoM growth) — pulled live from payment platforms
- Full review list with verified customer badges
- AgentUP count
- AI agent query count

### AgentUP
An upvote system where humans and AI agents can upvote products. Products with more AgentUPs rank higher in the leaderboard and earn free sidebar ad placement. One upvote per user per product (tracked by session or IP hash for anonymous users).

### Multi-platform revenue verification
Sellers connect their payment platform(s) to display verified revenue on their public profile. Revenue data is pulled directly from APIs — sellers cannot edit it manually.

Supported platforms:

| Platform | Integration method |
|---|---|
| Stripe | OAuth Connect (read-only) |
| Lemon Squeezy | API key (seller pastes) |
| RevenueCat | Read-only token + Project ID |
| Dodo Payments | API key (seller pastes) |
| Paddle | API key (seller pastes) |

Revenue syncs every 6 hours via Vercel cron. All connected platforms are aggregated into a single combined MRR/ARR displayed on the profile.

### Trust API
AI agents can query any product's trust data at:
```
GET https://agenttrust.com/api/trust/[slug]
```
Returns structured JSON including trust score, review summary, verified revenue, active platforms, and an `agent_summary` string ready for LLM consumption. Available on Scale plan. Cached for 1 hour.

### AI SEO Audit
Paste any URL and get a GEO (Generative Engine Optimization) score showing how discoverable your page is to AI systems. 30+ checks across six pillars. Generates fix prompts you can paste directly into Cursor, Claude Code, or Codex.

Six audit pillars:
1. **Technical Crawlability** — robots.txt, canonical, noindex, Open Graph
2. **Content Structure** — H1/H2 hierarchy, section length, anchor IDs
3. **Schema & Metadata** — JSON-LD, FAQPage, author field, datePublished
4. **E-E-A-T Authority** — author bio, credentials, outbound links, social proof
5. **Citation Readiness** — named statistics, blockquotes, quotable findings
6. **Measurement** — analytics detection, viewport meta

Free users see 3 fixes. Paid plans unlock all fixes + re-audit tracking + copyable agent prompt.

### Email campaigns
Sellers upload a CSV of customer emails, write a review request message, and AgentTrust sends it via Resend. Each email contains a unique token link to a pre-authenticated review form. Campaigns track sent, opened, and reviewed counts.

### Persistent three-column layout
All public pages use a three-column shell:
- Left sidebar: top-ranked products (by AgentUP score) shown as ad cards — free placement earned by reviews + AgentUPs, paid placement overrides organic
- Center: page content
- Right sidebar: same top-ranked products (alternating with left sidebar)

Sidebars are sticky and persist while navigating between pages. Hidden on screens below 1280px.

### Embed widget
Sellers get an embed code snippet to put on their own website showing their current rating, review count, and a link back to their AgentTrust profile.

---

## Database schema

Ten tables in Supabase:

| Table | Purpose |
|---|---|
| `profiles` | Extends Supabase auth users, stores plan |
| `products` | Product listings with trust score and aggregated revenue |
| `revenue_connections` | One row per connected payment platform per product |
| `revenue_snapshots` | Historical MRR snapshots for growth chart |
| `reviews` | Individual product reviews |
| `campaigns` | Email review request campaigns |
| `campaign_recipients` | Individual email recipients with unique tokens |
| `subscriptions` | Billing plan records (synced from Dodo webhooks) |
| `ad_slots` | Paid sidebar advertisement slots |
| `agent_queries` | Log of every Trust API query |
| `agentups` | One row per upvote (user or IP hash + product) |

Row-level security is enabled on all tables. Triggers auto-update product stats (avg rating, review count) on every review insert/update.

---

## Folder structure

```
agenttrust/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                    ← Landing page
│   │   ├── layout.tsx                  ← Three-column persistent shell
│   │   ├── pricing/page.tsx
│   │   ├── trust-api/page.tsx
│   │   ├── audit/page.tsx              ← AI SEO Audit tool
│   │   ├── leaderboard/page.tsx
│   │   ├── p/[slug]/page.tsx           ← Public product profile
│   │   └── review/
│   │       ├── [slug]/page.tsx
│   │       └── token/[token]/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   └── dashboard/
│   │       ├── page.tsx
│   │       ├── products/
│   │       │   ├── page.tsx
│   │       │   ├── new/page.tsx
│   │       │   └── [id]/
│   │       │       ├── page.tsx        ← Edit product
│   │       │       ├── reviews/page.tsx
│   │       │       ├── campaigns/page.tsx
│   │       │       ├── verify/page.tsx ← Connect revenue platforms
│   │       │       └── widget/page.tsx
│   │       └── billing/page.tsx
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── reset-password/page.tsx
│   └── api/
│       ├── trust/[slug]/route.ts       ← Trust API for AI agents
│       ├── audit/route.ts              ← AI SEO audit engine
│       ├── products/
│       │   ├── route.ts
│       │   ├── [id]/route.ts
│       │   └── [id]/agentup/route.ts   ← AgentUP endpoint
│       ├── reviews/[id]/
│       │   ├── approve/route.ts
│       │   ├── feature/route.ts
│       │   └── route.ts
│       ├── review/
│       │   ├── public/[slug]/route.ts
│       │   └── form/[token]/route.ts
│       ├── campaigns/
│       │   ├── route.ts
│       │   └── [id]/send/route.ts
│       ├── verify/
│       │   ├── connect/route.ts        ← All platforms (API key flow)
│       │   ├── disconnect/route.ts
│       │   └── stripe/
│       │       ├── connect/route.ts    ← Stripe OAuth
│       │       └── callback/route.ts
│       ├── leaderboard/route.ts
│       ├── widget/[slug]/route.ts
│       ├── dashboard/stats/route.ts
│       ├── billing/
│       │   ├── checkout/route.ts       ← Dodo one-time checkout
│       │   └── portal/route.ts
│       ├── webhooks/
│       │   └── dodo/route.ts           ← Dodo payment webhooks
│       └── cron/
│           ├── sync-stats/route.ts     ← Every 6h: recalculate trust scores
│           ├── send-campaigns/route.ts ← Every 15min: send queued emails
│           └── sync-revenue/route.ts   ← Every 6h: sync all revenue platforms
├── components/
│   ├── profile/
│   │   ├── TrustScore.tsx
│   │   ├── ReviewCard.tsx
│   │   ├── ReviewList.tsx
│   │   ├── VerificationBadges.tsx
│   │   ├── RatingDistribution.tsx
│   │   └── RevenueSection.tsx
│   ├── dashboard/
│   │   ├── ProductCard.tsx
│   │   ├── CampaignForm.tsx
│   │   ├── ReviewModerationRow.tsx
│   │   ├── WidgetCodeBlock.tsx
│   │   └── PlatformConnectCard.tsx
│   ├── marketing/
│   │   ├── Hero.tsx
│   │   ├── PricingCard.tsx
│   │   └── FeatureSection.tsx
│   └── shared/
│       ├── SidebarAds.tsx              ← Persistent sidebar component
│       ├── AgentUpButton.tsx           ← AgentUP upvote button
│       ├── LandingContent.tsx          ← Landing page client component
│       ├── StarRating.tsx
│       ├── TrustBadge.tsx
│       └── Navbar.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── admin.ts
│   ├── revenue/
│   │   ├── types.ts
│   │   ├── sync.ts
│   │   └── adapters/
│   │       ├── stripe.ts
│   │       ├── lemon-squeezy.ts
│   │       ├── revenuecat.ts
│   │       ├── dodo.ts
│   │       └── paddle.ts
│   ├── seo-audit.ts                    ← AI SEO audit engine
│   ├── trust-score.ts
│   ├── plan-limits.ts
│   └── resend.ts
├── supabase/
│   └── migrations/
│       ├── 001_schema.sql
│       └── 002_agentup.sql
├── vercel.json
└── .env.local.example
```

---

## Environment variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Dodo Payments (billing)
DODO_STARTER_PRODUCT_ID=
DODO_GROWTH_PRODUCT_ID=
DODO_SCALE_PRODUCT_ID=
DODO_WEBHOOK_SECRET=

# Stripe Connect (revenue verification only — NOT billing)
STRIPE_SECRET_KEY=
STRIPE_CONNECT_CLIENT_ID=
STRIPE_CONNECT_REDIRECT_URI=

# Resend (email)
RESEND_API_KEY=
RESEND_FROM_EMAIL=
RESEND_FROM_NAME=AgentTrust

# App
NEXT_PUBLIC_APP_URL=https://agenttrust.com
NEXT_PUBLIC_APP_NAME=AgentTrust

# Cron security
CRON_SECRET=
```

---

## Cron jobs

Three Vercel cron jobs run automatically:

| Job | Schedule | What it does |
|---|---|---|
| `/api/cron/sync-stats` | Every 6 hours | Recalculates trust scores for all products |
| `/api/cron/send-campaigns` | Every 15 minutes | Processes queued campaign emails via Resend |
| `/api/cron/sync-revenue` | Every 6 hours | Syncs revenue data from all connected payment platforms |

All cron routes are protected with a `CRON_SECRET` bearer token.

---

## Trust score algorithm

```
trust_score =
  rating_score    × 0.35   (avg rating normalized to 0–100)
  volume_score    × 0.25   (review count, caps at 200)
  recency_score   × 0.20   (reviews in last 30 days, caps at 10)
  verification    × 0.20   (60pts for revenue verified, 40pts for GitHub)

Grade:
  85–100 → A
  70–84  → B
  55–69  → C
  40–54  → D
  0–39   → F
```

---

## Sidebar ad placement logic

The left and right sidebars on all public pages show products ranked by:
```
(agentup_count × 0.6) + (review_count × 0.3) + (trust_score × 0.1)
```

Top 10 products are fetched. Left sidebar shows ranks 1, 3, 5, 7, 9. Right sidebar shows ranks 2, 4, 6, 8, 10. If a paid `ad_slot` row exists with `is_active = true`, it replaces the first organic slot on the left sidebar only.

This means new products earn free sidebar placement through reviews and AgentUPs. Paid advertising overrides organic placement when sold.

---

## Revenue verification flow

```
Seller clicks "Connect" on /dashboard/products/[id]/verify
     ↓
For Stripe: OAuth redirect → stripe.com/oauth/authorize
For others: seller pastes API key into form
     ↓
Credentials saved to revenue_connections table (encrypted)
     ↓
Immediate sync triggered: adapter fetches MRR, ARR,
customers, total revenue from platform API
     ↓
Data saved to revenue_connections row
aggregateProductRevenue() sums across all active connections
Products table updated with combined totals
Snapshot saved to revenue_snapshots for growth chart
     ↓
Public profile now shows Verified Revenue section
Trust API response includes revenue.platforms array
     ↓
Cron re-syncs every 6 hours automatically
```

---

## AI SEO Audit flow

```
User pastes URL into audit input (landing page or /audit page)
     ↓
POST /api/audit with { url }
Rate limit checked (3 free lifetime, then plan limits)
     ↓
lib/seo-audit.ts fetches the URL server-side (10s timeout)
Cheerio parses the HTML
30+ checks run across 6 pillars
Score calculated (0–100), grade assigned
Fix prompts generated sorted by impact (high → medium → low)
     ↓
Results returned to /audit page
Score, pillar breakdown, and first 3 fixes shown to everyone
Remaining fixes blurred for free users
     ↓
Paid users see all fixes + full copyable agent prompt
formatted for pasting into Cursor / Claude Code / Codex
```

---

## Local development

```bash
# Clone the repo
git clone https://github.com/yourusername/agenttrust.git
cd agenttrust

# Install dependencies
npm install

# Copy env file and fill in values
cp .env.local.example .env.local

# Run the Supabase migrations
# Paste supabase/migrations/001_schema.sql into Supabase SQL editor
# Then paste supabase/migrations/002_agentup.sql

# Start dev server
npm run dev
# Open http://localhost:3000

# Test a cron job locally
curl -H "Authorization: Bearer your-cron-secret" \
  http://localhost:3000/api/cron/sync-revenue

# Test the Trust API
curl http://localhost:3000/api/trust/your-product-slug
```

---

## Deployment

The app is deployed on Vercel connected to the GitHub repo.

```bash
# Push to deploy
git add .
git commit -m "your message"
git push origin main
# Vercel auto-deploys on push to main
```

After deploying:
1. Add all environment variables in Vercel dashboard → Settings → Environment Variables
2. Configure Dodo webhook endpoint: `https://agenttrust.com/api/webhooks/dodo`
3. Configure Stripe Connect redirect URI: `https://agenttrust.com/api/verify/stripe/callback`
4. Verify cron jobs appear in Vercel dashboard → your project → Cron Jobs

---

## Pages reference

### Public pages

| Route | Description |
|---|---|
| `/` | Landing page — hero, product list, AgentUP upvotes, pricing preview |
| `/p/[slug]` | Product trust profile — reviews, trust score, verified revenue |
| `/leaderboard` | All products ranked by trust score, filterable and sortable |
| `/review/[slug]` | Public review submission form |
| `/review/token/[token]` | Email campaign review form (pre-authenticated) |
| `/audit` | AI SEO audit tool — paste any URL, get GEO score + fix prompts |
| `/trust-api` | Trust API documentation for AI developers |
| `/pricing` | Full pricing page with feature comparison table |

### Dashboard pages (authenticated)

| Route | Description |
|---|---|
| `/dashboard` | Overview — total reviews, avg rating, agent queries |
| `/dashboard/products` | All seller products |
| `/dashboard/products/new` | Create a new product |
| `/dashboard/products/[id]` | Edit product details and settings |
| `/dashboard/products/[id]/reviews` | Moderate and feature reviews |
| `/dashboard/products/[id]/campaigns` | Create and send email campaigns |
| `/dashboard/products/[id]/verify` | Connect revenue platforms |
| `/dashboard/products/[id]/widget` | Get embed code + Trust API key |
| `/dashboard/billing` | Purchase or upgrade plan |

---

## Key API endpoints

### Trust API (public)
```
GET /api/trust/[slug]
```
Returns full trust JSON for a product. Used by AI agents.
Cached 1 hour. No authentication required.

### AgentUP
```
POST /api/products/[id]/agentup
```
Upvote a product. Rate limited to once per user per product (or once per IP per 24 hours for anonymous).

### AI SEO Audit
```
POST /api/audit
Body: { url: "https://yoursite.com" }
```
Returns AuditResult with score, pillar breakdown, and fix prompts.

### Revenue connect
```
POST /api/verify/connect
Body: { product_id, platform, api_key, account_id? }
```
Connects a revenue platform and triggers an immediate sync.

---

## Contributing

This is a private project. If you are working on it:

1. Never commit `.env.local`
2. Never touch `app/api/verify/*` or `lib/revenue/*` without understanding the full revenue sync architecture first
3. All database changes go in a new numbered migration file — never edit existing migrations
4. Test cron jobs locally with curl before deploying
5. The `(dashboard)` and `(public)` route groups have separate layouts — do not mix them

---

*AgentTrust — verified trust for the AI-native era.*
*Built with Next.js, Supabase, Dodo Payments, and Resend.*
