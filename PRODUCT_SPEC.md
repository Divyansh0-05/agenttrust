# AgentTrust — Master Build Document (v4.0 FINAL)
**Verified reviews + multi-platform revenue for software products. Built for humans and AI agents.**
Stack: Next.js 15 · Supabase · Stripe · Resend · Lemon Squeezy · RevenueCat · Dodo · Paddle

---

> **How to read this document:**
> Every part has the full specification followed by a **▶ EXECUTE** block with exact commands and steps.
> Read top to bottom. Do not skip. The 14 build prompts at the end are copy-paste ready for Codex/Cursor.

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# WHAT CHANGED FROM PREVIOUS VERSION — READ THIS FIRST
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The new file (Multi-Platform Revenue Verification) adds major changes.
Here is every change you need to make to the previous documentation, in order:

## Change A — Database: Replace Stripe-only columns with unified revenue architecture

**Old approach (wrong):** Stripe credentials and revenue columns lived directly on the `products` table.

**New approach (correct):** A separate `revenue_connections` table holds one row per platform per product. The `products` table keeps only summary columns (total aggregated MRR across all platforms).

**What to do:**
- Remove `stripe_connect_account_id`, `stripe_connect_access_token`, `stripe_connect_livemode` from the products table
- Keep the revenue summary columns (`revenue_mrr`, `revenue_arr`, etc.) on products — these now hold the *aggregated* total across all connected platforms
- Add `revenue_verified boolean` column to products
- Add the new `revenue_connections` table (full SQL in Part 3)

## Change B — New platforms supported

**Old:** Stripe only.
**New:** Stripe (OAuth) + Lemon Squeezy (API key) + RevenueCat (token + project ID) + Dodo Payments (API key) + Paddle (API key). Gumroad is P2 (future).

**What to do:** Add all 5 platform adapters (code in Part 11).

## Change C — Sync architecture

**Old:** One function `syncStripeRevenue(productId, accessToken)` in `/lib/sync-stripe.ts`
**New:** Unified adapter system in `/lib/revenue/` folder:
- `lib/revenue/types.ts` — shared interfaces
- `lib/revenue/adapters/stripe.ts`
- `lib/revenue/adapters/lemon-squeezy.ts`
- `lib/revenue/adapters/revenuecat.ts`
- `lib/revenue/adapters/dodo.ts`
- `lib/revenue/adapters/paddle.ts`
- `lib/revenue/sync.ts` — orchestrator

**What to do:** Delete `/lib/sync-stripe.ts`. Create the `/lib/revenue/` folder with all files above.

## Change D — API routes

**Old routes (replace these):**
```
GET  /api/verify/stripe/connect
GET  /api/verify/stripe/callback
POST /api/verify/stripe/disconnect
```

**New routes (use these instead):**
```
POST /api/verify/connect       ← handles ALL platforms (API key flow)
POST /api/verify/disconnect    ← disconnects any platform
GET  /api/verify/stripe/connect    ← still needed for Stripe OAuth only
GET  /api/verify/stripe/callback   ← still needed for Stripe OAuth callback
```

**What to do:** Keep the Stripe OAuth routes. Add the two new unified routes.

## Change E — Cron job

**Old:** `sync-revenue` cron called the Stripe-only sync function.
**New:** `sync-revenue` cron calls `syncAllConnections()` from `lib/revenue/sync.ts`.

**What to do:** Replace the body of `/app/api/cron/sync-revenue/route.ts`.

## Change F — Dashboard verify page

**Old:** A "Connect Stripe" card embedded in the product edit page.
**New:** A dedicated `/dashboard/products/[id]/verify` page showing all 5 platforms with connect/disconnect UI.

**What to do:** Build the new verify page (Prompt 14). The product edit page still links to it.

## Change G — Public profile page

**Old:** Revenue section shows "Stripe Verified" badge.
**New:** Revenue section shows "Verified across: [Stripe ✓] [RevenueCat ✓]" with platform badges. RevenueCat data includes a footnote about 30-day limitation.

## Change H — Trust API response

**Old:**
```json
"revenue": { "verified": true, "source": "stripe", "mrr_usd": 12400 }
```

**New:**
```json
"revenue": {
  "verified": true,
  "platforms": ["stripe", "revenuecat"],
  "combined": { "mrr_usd": 6800, "arr_usd": 81600, ... }
}
```

## Change I — Folder structure additions

Add these new paths to the folder structure:
```
lib/revenue/
├── types.ts
├── sync.ts
└── adapters/
    ├── stripe.ts
    ├── lemon-squeezy.ts
    ├── revenuecat.ts
    ├── dodo.ts
    └── paddle.ts

app/(dashboard)/dashboard/products/[id]/verify/page.tsx
app/api/verify/connect/route.ts
app/api/verify/disconnect/route.ts
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PART 1 — WHAT YOU ARE BUILDING
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## The one-sentence pitch
AgentTrust is where software products collect and display verified reviews **and verified revenue across every payment platform** — and where AI agents query structured trust data to make product recommendations.

## The two problems you solve

**For sellers (SaaS founders, app makers, indie hackers):**
They need credible, verified social proof to convert visitors. Self-hosted testimonials are not trusted. G2 and Capterra are too expensive and too enterprise. There is no simple, affordable platform built for indie/SMB software products that also supports mobile app revenue (RevenueCat), non-Stripe payments (Lemon Squeezy, Dodo), and mid-market SaaS (Paddle).

**For AI agents:**
As AI assistants browse, research, and purchase on behalf of humans, they need machine-readable trust data. Every review and rating on the internet today is designed for human eyes — not for agents. AgentTrust makes social proof queryable by machines.

## Revenue platforms supported

| Priority | Platform | Who uses it | Integration |
|---|---|---|---|
| P0 | Stripe | Most web SaaS founders | OAuth Connect (read-only) |
| P0 | Lemon Squeezy | Indie hackers, Indian founders | API key (seller pastes) |
| P0 | RevenueCat | iOS/Android app developers | Read-only token + Project ID |
| P1 | Dodo Payments | Indian SaaS founders | API key (seller pastes) |
| P1 | Paddle | Mid-size SaaS | API key (seller pastes) |
| P2 | Gumroad | Creators, simple products | Future |

## How you make money — two streams

### Stream 1: Subscriptions from sellers

| Plan | Price | What it includes |
|---|---|---|
| Free | $0 | Public profile page, up to 10 reviews, basic badge |
| Starter | $19/mo | 200 review requests/mo, all widget styles, verified badge, 1 product |
| Growth | $49/mo | 1,000 review requests/mo, 3 products, analytics, priority listing |
| Scale | $99/mo | Unlimited, 10 products, Agent Trust API access, remove branding |

### Stream 2: Advertising slots
Once you have 500+ daily visitors, sell sidebar slots at $299–$999/month. Build the table now, leave a placeholder "Your ad here" card, sell manually when you have traffic.

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PART 2 — HOW THE PRODUCT WORKS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Journey A: Seller registers a product

```
Step 1 — Sign up and name the product (60 seconds)
  Fields: product name, website URL, category, short description, logo upload
  On completion: public profile page is LIVE at agenttrust.com/p/[slug]
  Value delivered: shareable URL they can put in their bio, README, pitch deck TODAY

Step 2 — Share review collection link anywhere
  Link: agenttrust.com/review/[slug]
  Share on Twitter, email, Slack — reviews appear on profile instantly

Step 3 — Upgrade to send email campaigns (paid)
  Upload CSV of customer emails → send review request → track responses

Step 4 — Verify revenue (any platform)
  Dashboard → Products → [product] → Verify Revenue
  Connect Stripe (OAuth) or paste API key for Lemon Squeezy, RevenueCat, Dodo, Paddle
  Revenue data appears on public profile immediately after first sync
```

### Journey B: Human visitor reads reviews

```
Visitor lands on agenttrust.com/p/notion
Sees: logo, name, description, average rating, review count, trust score
Sees: verification badges (platform badges for connected revenue sources)
Sees: Verified Revenue section — combined MRR, ARR, customers, growth across all platforms
Can filter reviews by rating
Sees: "Powered by AgentTrust" link (our SEO)
```

### Journey C: AI agent queries trust data

```
Agent calls: GET agenttrust.com/api/trust/notion
Receives: structured JSON with trust score, reviews, verification, multi-platform revenue
Query is logged — seller sees "47 agents queried your profile this month"
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PART 3 — DATABASE SCHEMA (COMPLETE & FINAL)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is the single source of truth. Copy this entire block into Supabase SQL editor and run it.

```sql
-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES (extends Supabase Auth users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  avatar_url text,
  plan text default 'free',
  stripe_customer_id text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can view and edit own profile"
  on public.profiles for all using (auth.uid() = id);

-- ============================================================
-- PRODUCTS
-- ============================================================
create table public.products (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade not null,
  slug text unique not null,
  name text not null,
  tagline text,
  description text,
  website_url text,
  logo_url text,
  category text,

  -- trust signals
  trust_score numeric(5,2) default 0,
  avg_rating numeric(3,2) default 0,
  review_count integer default 0,

  -- identity verification
  stripe_verified boolean default false,   -- true once any Stripe connection is active
  github_verified boolean default false,
  github_stars integer,
  github_repo_url text,

  -- aggregated revenue summary (combined across ALL connected platforms)
  revenue_verified boolean default false,
  revenue_mrr integer default 0,           -- Monthly Recurring Revenue in cents
  revenue_arr integer default 0,           -- Annual Run Rate in cents
  revenue_total integer default 0,         -- All-time total revenue in cents
  revenue_customer_count integer default 0,
  revenue_mom_growth numeric(6,2),
  revenue_currency text default 'usd',
  revenue_last_synced_at timestamptz,
  revenue_is_public boolean default true,

  -- agent stats
  agent_query_count integer default 0,
  agent_query_count_30d integer default 0,

  -- settings
  is_public boolean default true,
  allow_public_reviews boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.products enable row level security;
create policy "Public products viewable by all"
  on public.products for select using (is_public = true);
create policy "Owners manage own products"
  on public.products for all using (owner_id = auth.uid());
create index on public.products(slug);
create index on public.products(category);
create index on public.products(trust_score desc);
create index on public.products(revenue_mrr desc);

-- ============================================================
-- REVENUE CONNECTIONS (multi-platform — one row per platform per product)
-- ============================================================
create table public.revenue_connections (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade not null,
  platform text not null,
  -- 'stripe' | 'lemon_squeezy' | 'revenuecat' | 'dodo' | 'paddle' | 'gumroad'

  -- Credentials (encrypt in production using Supabase Vault)
  api_key text,
  access_token text,      -- For OAuth platforms (Stripe Connect)
  account_id text,        -- Platform-specific ID (e.g. RevenueCat project ID)

  -- Sync state
  status text default 'pending',  -- 'pending' | 'active' | 'error' | 'disconnected'
  last_error text,
  last_synced_at timestamptz,

  -- Cached revenue data from this specific platform
  mrr integer default 0,
  arr integer default 0,
  total_revenue integer default 0,
  customer_count integer default 0,
  active_subscriptions integer default 0,
  currency text default 'usd',

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(product_id, platform)   -- One connection per platform per product
);
alter table public.revenue_connections enable row level security;
create policy "Owners manage own connections"
  on public.revenue_connections for all using (
    product_id in (
      select id from public.products where owner_id = auth.uid()
    )
  );
create index on public.revenue_connections(product_id);
create index on public.revenue_connections(status);

-- ============================================================
-- REVENUE SNAPSHOTS (for MRR growth chart — combined total)
-- ============================================================
create table public.revenue_snapshots (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade not null,
  mrr integer not null,
  customer_count integer not null,
  total_revenue integer not null,
  recorded_at timestamptz default now()
);
create index on public.revenue_snapshots(product_id);
create index on public.revenue_snapshots(recorded_at desc);

-- ============================================================
-- REVIEWS
-- ============================================================
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade not null,
  reviewer_name text not null,
  reviewer_email text,
  reviewer_role text,
  reviewer_company text,
  reviewer_avatar_url text,
  rating integer not null check (rating between 1 and 5),
  title text,
  body text not null,
  use_case text,
  is_verified_customer boolean default false,
  is_featured boolean default false,
  is_approved boolean default true,
  source text default 'public_form',
  campaign_id uuid,
  token text unique,
  token_expires_at timestamptz,
  submitted_at timestamptz default now(),
  created_at timestamptz default now()
);
alter table public.reviews enable row level security;
create policy "Approved reviews viewable by all"
  on public.reviews for select using (is_approved = true);
create policy "Product owners manage reviews"
  on public.reviews for all using (
    product_id in (
      select id from public.products where owner_id = auth.uid()
    )
  );
create index on public.reviews(product_id);
create index on public.reviews(token);

-- ============================================================
-- CAMPAIGNS
-- ============================================================
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade not null,
  name text not null,
  email_subject text not null,
  email_body text not null,
  status text default 'draft',
  sent_count integer default 0,
  opened_count integer default 0,
  review_count integer default 0,
  created_at timestamptz default now(),
  sent_at timestamptz
);

create table public.campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  email text not null,
  name text,
  token text unique not null default gen_random_uuid()::text,
  status text default 'pending',
  sent_at timestamptz,
  reviewed_at timestamptz
);
create index on public.campaign_recipients(token);
create index on public.campaign_recipients(campaign_id);

-- ============================================================
-- SUBSCRIPTIONS (synced from Stripe webhooks)
-- ============================================================
create table public.subscriptions (
  id text primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status text not null,
  plan text not null default 'free',
  stripe_price_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- AD SLOTS
-- ============================================================
create table public.ad_slots (
  id uuid primary key default gen_random_uuid(),
  position text not null,
  advertiser_name text not null,
  advertiser_url text not null,
  logo_url text,
  tagline text,
  stripe_subscription_id text,
  monthly_price integer,
  is_active boolean default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================
-- AGENT QUERY LOG
-- ============================================================
create table public.agent_queries (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id),
  product_slug text,
  query_type text default 'rest',
  user_agent text,
  ip_hash text,
  created_at timestamptz default now()
);
create index on public.agent_queries(product_id);
create index on public.agent_queries(created_at desc);

-- ============================================================
-- TRIGGER: auto-update product stats after review insert/update
-- ============================================================
create or replace function update_product_stats()
returns trigger as $$
begin
  update public.products
  set
    review_count = (
      select count(*) from public.reviews
      where product_id = NEW.product_id and is_approved = true
    ),
    avg_rating = (
      select coalesce(avg(rating), 0) from public.reviews
      where product_id = NEW.product_id and is_approved = true
    ),
    updated_at = now()
  where id = NEW.product_id;
  return NEW;
end;
$$ language plpgsql;

create trigger on_review_change
  after insert or update on public.reviews
  for each row execute procedure update_product_stats();

-- ============================================================
-- TRIGGER: auto-create profile on user signup
-- ============================================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  return NEW;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
```

---

### ▶ EXECUTE — Database Setup

**Step 1: Create Supabase project**
1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Name: `agenttrust` | Save the DB password somewhere safe | Pick closest region
3. Wait ~2 minutes for provisioning

**Step 2: Run the migration**
1. Supabase dashboard → **SQL Editor** → **New query**
2. Paste the entire SQL block above
3. Click **Run** — you should see `Success. No rows returned`

**Step 3: Collect credentials**
- Dashboard → **Settings** → **API**
- Copy: `Project URL`, `anon public` key, `service_role` key

**Step 4: Verify**
- Click **Table Editor** — you should see 10 tables:
  `profiles`, `products`, `revenue_connections`, `revenue_snapshots`, `reviews`, `campaigns`, `campaign_recipients`, `subscriptions`, `ad_slots`, `agent_queries`

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PART 4 — API ROUTES (COMPLETE LIST)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Public routes
```
GET  /api/trust/[slug]              Trust profile JSON for AI agents
GET  /api/products/[slug]           Public product data
GET  /api/reviews/[slug]            Paginated reviews list
GET  /api/leaderboard               Top products ranked by trust score + MRR
GET  /api/widget/[slug]             Lightweight data for embed widget
GET  /api/review/form/[token]       Validate token
POST /api/review/form/[token]       Submit review via email token
POST /api/review/public/[slug]      Submit review via public form
```

## Authenticated routes
```
POST   /api/products                Create product
PUT    /api/products/[id]           Update product
DELETE /api/products/[id]           Delete product
GET    /api/dashboard/stats         Overview numbers
GET    /api/dashboard/reviews       All reviews for seller products
PUT    /api/reviews/[id]/approve    Approve/unapprove review
PUT    /api/reviews/[id]/feature    Feature/unfeature review
DELETE /api/reviews/[id]            Delete review
POST   /api/campaigns               Create campaign
POST   /api/campaigns/[id]/send     Send campaign emails
GET    /api/campaigns/[id]/stats    Campaign stats
GET    /api/billing/portal          Stripe customer portal URL
POST   /api/billing/checkout        Create Stripe checkout session

POST   /api/verify/connect          Add ANY platform connection (API key flow)
POST   /api/verify/disconnect       Disconnect ANY platform
```

## Stripe OAuth routes (Stripe only — other platforms use /api/verify/connect)
```
GET  /api/verify/stripe/connect     Start Stripe OAuth flow
GET  /api/verify/stripe/callback    Handle OAuth callback
```

## Webhooks & cron
```
POST /api/webhooks/stripe           Stripe billing events
GET  /api/cron/sync-stats           Recalculate trust scores (every 6h)
GET  /api/cron/send-campaigns       Send queued emails (every 15min)
GET  /api/cron/sync-revenue         Sync ALL platform connections (every 6h)
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PART 5 — THE TRUST API
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Endpoint:** `GET /api/trust/[slug]`
No auth required. Cache-Control: public, max-age=3600. Log every request to `agent_queries`.

**Response shape (final version with multi-platform revenue):**

```json
{
  "schema": "agenttrust/trust/v1",
  "generated_at": "2026-05-06T10:00:00Z",
  "product": {
    "name": "Notion",
    "slug": "notion",
    "description": "All-in-one workspace",
    "url": "https://notion.so",
    "category": "productivity",
    "logo_url": "https://agenttrust.com/logos/notion.png"
  },
  "trust": {
    "score": 84,
    "grade": "A",
    "breakdown": {
      "rating_score": 88,
      "volume_score": 90,
      "recency_score": 78,
      "verification_score": 75
    }
  },
  "reviews": {
    "total": 312,
    "verified_customers": 198,
    "average_rating": 4.6,
    "distribution": { "5": 178, "4": 89, "3": 30, "2": 10, "1": 5 },
    "recent": [
      {
        "rating": 5,
        "excerpt": "Transformed how our team organizes knowledge.",
        "reviewer_role": "Head of Product",
        "verified_customer": true,
        "date": "2026-04-30"
      }
    ]
  },
  "verification": {
    "github": { "connected": true, "stars": 5200 }
  },
  "revenue": {
    "verified": true,
    "platforms": ["stripe", "revenuecat"],
    "combined": {
      "mrr_usd": 6800,
      "arr_usd": 81600,
      "total_revenue_usd": 94200,
      "paying_customers": 1247,
      "mom_growth_percent": 11.2,
      "last_synced": "2026-05-06T08:00:00Z"
    }
  },
  "agent_summary": "Notion has 312 verified reviews (avg 4.6/5) and a trust score of 84/100. Revenue verified across Stripe and RevenueCat: $6,800 MRR, 1,247 paying customers, +11.2% month-over-month growth.",
  "meta": {
    "agent_queries_total": 2341,
    "agent_queries_30d": 187,
    "profile_url": "https://agenttrust.com/p/notion",
    "cache_ttl": 3600
  }
}
```

**Trust score algorithm — `/lib/trust-score.ts`:**

```typescript
export function calculateTrustScore(product: any, reviews: any[]): number {
  const approved = reviews.filter(r => r.is_approved);
  if (approved.length === 0) return 0;

  const avgRating = approved.reduce((s, r) => s + r.rating, 0) / approved.length;
  const ratingScore = ((avgRating - 1) / 4) * 100;
  const volumeScore = Math.min((approved.length / 200) * 100, 100);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentCount = approved.filter(r => new Date(r.created_at) > thirtyDaysAgo).length;
  const recencyScore = Math.min((recentCount / 10) * 100, 100);

  let verificationScore = 0;
  if (product.revenue_verified) verificationScore += 60;
  if (product.github_verified) verificationScore += 40;

  return Math.round(
    ratingScore * 0.35 +
    volumeScore * 0.25 +
    recencyScore * 0.20 +
    verificationScore * 0.20
  );
}

export function getTrustGrade(score: number): string {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PART 6 — PAGES & ROUTES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Public pages

| Route | What it shows |
|---|---|
| `/` | Landing page |
| `/p/[slug]` | Product trust profile with multi-platform revenue section |
| `/review/[slug]` | Public review form |
| `/review/token/[token]` | Email review form |
| `/leaderboard` | Top products, sortable by Trust Score / MRR / Reviews |
| `/for-ai` | Trust API documentation for AI developers |
| `/pricing` | Pricing page |

## Dashboard pages

| Route | What it shows |
|---|---|
| `/dashboard` | Overview stats |
| `/dashboard/products` | All seller products |
| `/dashboard/products/new` | Create product |
| `/dashboard/products/[id]` | Edit product (links to /verify) |
| `/dashboard/products/[id]/reviews` | Moderate reviews |
| `/dashboard/products/[id]/campaigns` | Email campaigns |
| `/dashboard/products/[id]/widget` | Embed code |
| `/dashboard/products/[id]/verify` | **NEW** — Connect revenue platforms |
| `/dashboard/billing` | Subscription management |

## Revenue section on public profile

```
┌──────────────────────────────────────────────────────────────┐
│  💰 Verified Revenue                                          │
│  Verified across: [Stripe ✓] [RevenueCat ✓]                  │
│  Last updated: 1 hour ago                                     │
├──────────────┬─────────────┬─────────────┬───────────────────┤
│  MRR         │  ARR        │  Customers  │  MoM Growth        │
│  $6,800      │  $81,600    │  1,247      │  +11.2%            │
├──────────────┴─────────────┴─────────────┴───────────────────┤
│  All-time revenue: $94,200                                    │
│  [MRR sparkline chart — last 6 months]                        │
│                                                               │
│  ⚡ Revenue pulled directly from platform APIs.               │
│     Cannot be edited by the seller.                           │
│  * RevenueCat data shows last 30 days only.                   │
└───────────────────────────────────────────────────────────────┘
```

## Verify Revenue dashboard page `/dashboard/products/[id]/verify`

```
┌─────────────────────────────────────────────────────────────┐
│  Verify your revenue                                         │
│  Connect one or more platforms. Read-only access only.       │
├──────────────────────────────────────────────────────────────┤
│  [Stripe logo]  Stripe                    [Connected ✓]      │
│  MRR: $4,200 · 312 customers · Synced 2h ago  [Disconnect]  │
│                                                              │
│  [LS logo]  Lemon Squeezy                 [Connect ↓]        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ API key (read-only) — Settings → API in LS dashboard│    │
│  │ [____________________________________] [Connect]    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  [RC logo]  RevenueCat (iOS/Android)      [Connect ↓]        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Project ID: [_______________]                       │    │
│  │ Secret API key: [___________________________]       │    │
│  │ Find both at: app.revenuecat.com → Project Settings │    │
│  │                                  [Connect]          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  [Dodo logo]  Dodo Payments               [Connect ↓]        │
│  [Paddle logo] Paddle                     [Connect ↓]        │
│                                                              │
│  ⚠ Read-only access. We cannot charge you or move funds.    │
└─────────────────────────────────────────────────────────────┘
```

## Leaderboard with revenue columns

```
Rank | Logo | Name    | Category | Rating | Reviews | MRR    | Trust Score
1    | 🟣   | Notion  | SaaS     | ★4.6   | 312     | $12.4K | 84
2    | 🔵   | Linear  | SaaS     | ★4.8   | 198     | $8.1K  | 81
3    | 🟡   | Cal.com | Open Src | ★4.5   | 89      | —      | 72
```

Sort options: **Trust Score / MRR / Reviews**

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PART 7 — COMPLETE FOLDER STRUCTURE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
agenttrust/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                          ← Landing page
│   │   ├── pricing/page.tsx
│   │   ├── for-ai/page.tsx
│   │   ├── leaderboard/page.tsx
│   │   ├── p/[slug]/page.tsx                 ← Product profile
│   │   └── review/
│   │       ├── [slug]/page.tsx               ← Public review form
│   │       └── token/[token]/page.tsx        ← Email review form
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   └── dashboard/
│   │       ├── page.tsx
│   │       ├── products/
│   │       │   ├── page.tsx
│   │       │   ├── new/page.tsx
│   │       │   └── [id]/
│   │       │       ├── page.tsx
│   │       │       ├── reviews/page.tsx
│   │       │       ├── campaigns/page.tsx
│   │       │       ├── widget/page.tsx
│   │       │       └── verify/page.tsx       ← NEW multi-platform connect page
│   │       └── billing/page.tsx
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── reset-password/page.tsx
│   └── api/
│       ├── trust/[slug]/route.ts             ← THE TRUST API
│       ├── products/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── reviews/
│       │   ├── [slug]/route.ts
│       │   ├── [id]/approve/route.ts
│       │   ├── [id]/feature/route.ts
│       │   └── [id]/route.ts
│       ├── review/
│       │   ├── public/[slug]/route.ts
│       │   └── form/[token]/route.ts
│       ├── campaigns/
│       │   ├── route.ts
│       │   └── [id]/send/route.ts
│       ├── verify/
│       │   ├── connect/route.ts              ← NEW unified connect (all platforms)
│       │   ├── disconnect/route.ts           ← NEW unified disconnect
│       │   └── stripe/
│       │       ├── connect/route.ts          ← Stripe OAuth start
│       │       └── callback/route.ts         ← Stripe OAuth callback
│       ├── leaderboard/route.ts
│       ├── widget/[slug]/route.ts
│       ├── dashboard/stats/route.ts
│       ├── billing/
│       │   ├── checkout/route.ts
│       │   └── portal/route.ts
│       ├── webhooks/
│       │   └── stripe/route.ts
│       └── cron/
│           ├── sync-stats/route.ts
│           ├── send-campaigns/route.ts
│           └── sync-revenue/route.ts         ← Now calls syncAllConnections()
├── components/
│   ├── profile/
│   │   ├── TrustScore.tsx
│   │   ├── ReviewCard.tsx
│   │   ├── ReviewList.tsx
│   │   ├── VerificationBadges.tsx
│   │   ├── RatingDistribution.tsx
│   │   └── RevenueSection.tsx               ← Multi-platform revenue display
│   ├── dashboard/
│   │   ├── ProductCard.tsx
│   │   ├── CampaignForm.tsx
│   │   ├── ReviewModerationRow.tsx
│   │   ├── WidgetCodeBlock.tsx
│   │   └── PlatformConnectCard.tsx          ← NEW per-platform connect/disconnect UI
│   ├── marketing/
│   │   ├── Hero.tsx
│   │   ├── PricingCard.tsx
│   │   └── FeatureSection.tsx
│   └── shared/
│       ├── StarRating.tsx
│       ├── TrustBadge.tsx
│       └── Navbar.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── admin.ts
│   ├── revenue/                             ← NEW unified revenue system
│   │   ├── types.ts
│   │   ├── sync.ts
│   │   └── adapters/
│   │       ├── stripe.ts
│   │       ├── lemon-squeezy.ts
│   │       ├── revenuecat.ts
│   │       ├── dodo.ts
│   │       └── paddle.ts
│   ├── stripe.ts
│   ├── resend.ts
│   ├── trust-score.ts
│   └── plan-limits.ts
├── supabase/
│   └── migrations/
│       └── 001_schema.sql
├── .env.local.example
├── vercel.json
└── package.json
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PART 8 — ENVIRONMENT VARIABLES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```bash
# ── Supabase ──────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ── Stripe (billing) ──────────────────────────────────────
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_GROWTH_PRICE_ID=price_...
STRIPE_SCALE_PRICE_ID=price_...

# ── Stripe Connect (revenue OAuth) ────────────────────────
STRIPE_CONNECT_CLIENT_ID=ca_...
STRIPE_CONNECT_REDIRECT_URI=https://agenttrust.com/api/verify/stripe/callback

# ── Resend (email) ────────────────────────────────────────
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=reviews@agenttrust.com
RESEND_FROM_NAME=AgentTrust

# ── App ───────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=https://agenttrust.com
NEXT_PUBLIC_APP_NAME=AgentTrust

# ── Cron security ─────────────────────────────────────────
CRON_SECRET=generate-a-random-string-here
```

---

### ▶ EXECUTE — Accounts & Env Setup

**Step 1: Create all accounts**

| Service | URL | Action |
|---|---|---|
| Supabase | supabase.com | Create project (Part 3 steps) |
| Stripe | stripe.com | Create account, enable test mode |
| Resend | resend.com | Create account, verify your domain |
| Vercel | vercel.com | Sign up with GitHub |
| GitHub | github.com | Create private repo `agenttrust` |

**Step 2: Get Stripe keys**
1. Stripe dashboard → **Developers** → **API keys**
2. Copy publishable key (`pk_test_...`) and secret key (`sk_test_...`)
3. Create 3 products: Starter $19/mo, Growth $49/mo, Scale $99/mo
4. Copy each Price ID (`price_...`)

**Step 3: Set up Stripe Connect**
1. Stripe → **Settings** → **Connect** → **Settings**
2. Enable **Standard accounts** under OAuth
3. Add redirect URI: `http://localhost:3000/api/verify/stripe/callback` (dev) and `https://agenttrust.com/api/verify/stripe/callback` (prod)
4. Copy the **Client ID** (`ca_...`)

**Step 4: Get Resend key**
1. resend.com → **API Keys** → **Create API Key**
2. **Domains** → **Add Domain** → add your domain, add the DNS records shown

**Step 5: Create `.env.local`**
```bash
# In project root:
touch .env.local
# Fill in all values from the template above

# Generate CRON_SECRET:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PART 9 — VERCEL CRON JOBS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`vercel.json` in project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-stats",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/send-campaigns",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cron/sync-revenue",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

Protect all cron routes with:
```typescript
const auth = request.headers.get('authorization');
if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
  return new Response('Unauthorized', { status: 401 });
}
```

Test locally:
```bash
curl -H "Authorization: Bearer your-cron-secret" http://localhost:3000/api/cron/sync-revenue
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PART 10 — PLAN LIMITS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`/lib/plan-limits.ts`:

```typescript
export const PLANS = {
  free: {
    products: 1,
    reviews_per_product: 10,
    campaign_emails_per_month: 0,
    widget_styles: ['badge'],
    agent_api: false,
    remove_branding: false,
  },
  starter: {
    products: 1,
    reviews_per_product: 500,
    campaign_emails_per_month: 200,
    widget_styles: ['badge', 'carousel', 'wall', 'floating'],
    agent_api: false,
    remove_branding: false,
  },
  growth: {
    products: 3,
    reviews_per_product: 2000,
    campaign_emails_per_month: 1000,
    widget_styles: ['badge', 'carousel', 'wall', 'floating'],
    agent_api: false,
    remove_branding: false,
  },
  scale: {
    products: 10,
    reviews_per_product: 999999,
    campaign_emails_per_month: 999999,
    widget_styles: ['badge', 'carousel', 'wall', 'floating'],
    agent_api: true,
    remove_branding: true,
  },
};

export function getUserPlan(profile: { plan: string }): keyof typeof PLANS {
  return (profile?.plan as keyof typeof PLANS) || 'free';
}

export function canDo(plan: keyof typeof PLANS, feature: keyof typeof PLANS['free']): boolean {
  return !!PLANS[plan][feature];
}
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PART 11 — MULTI-PLATFORM REVENUE SYSTEM (COMPLETE)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## lib/revenue/types.ts

```typescript
export interface RevenueData {
  mrr: number;               // in cents
  arr: number;               // in cents
  total_revenue: number;     // in cents
  customer_count: number;
  active_subscriptions: number;
  currency: string;
}

export interface RevenueAdapter {
  platform: string;
  fetchRevenue(credentials: {
    api_key?: string;
    access_token?: string;
    account_id?: string;
  }): Promise<RevenueData>;
}
```

## lib/revenue/adapters/stripe.ts

```typescript
import Stripe from 'stripe';
import type { RevenueAdapter, RevenueData } from '../types';

export const stripeAdapter: RevenueAdapter = {
  platform: 'stripe',

  async fetchRevenue({ access_token }): Promise<RevenueData> {
    const stripe = new Stripe(access_token!);

    const subscriptions = await stripe.subscriptions.list({ status: 'active', limit: 100 });

    let mrrCents = 0;
    for (const sub of subscriptions.data) {
      for (const item of sub.items.data) {
        const price = item.price;
        const amount = price.unit_amount ?? 0;
        const quantity = item.quantity ?? 1;
        if (price.recurring?.interval === 'month') {
          mrrCents += amount * quantity;
        } else if (price.recurring?.interval === 'year') {
          mrrCents += Math.round((amount * quantity) / 12);
        } else if (price.recurring?.interval === 'week') {
          mrrCents += Math.round((amount * quantity * 52) / 12);
        }
      }
    }

    let totalRevenue = 0;
    const charges = await stripe.charges.list({ limit: 100 });
    for (const charge of charges.data) {
      if (charge.paid && !charge.refunded) totalRevenue += charge.amount;
    }

    return {
      mrr: mrrCents,
      arr: mrrCents * 12,
      total_revenue: totalRevenue,
      customer_count: subscriptions.data.length,
      active_subscriptions: subscriptions.data.length,
      currency: 'usd',
    };
  },
};
```

## lib/revenue/adapters/lemon-squeezy.ts

```typescript
import type { RevenueAdapter, RevenueData } from '../types';

export const lemonSqueezyAdapter: RevenueAdapter = {
  platform: 'lemon_squeezy',

  async fetchRevenue({ api_key }): Promise<RevenueData> {
    const headers = {
      'Authorization': `Bearer ${api_key}`,
      'Accept': 'application/vnd.api+json',
    };

    const storesRes = await fetch('https://api.lemonsqueezy.com/v1/stores', { headers });
    const stores = await storesRes.json();
    const storeIds: string[] = stores.data?.map((s: any) => s.id) ?? [];

    let totalRevenueCents = 0;
    let activeSubscriptions = 0;
    let customerCount = 0;

    for (const storeId of storeIds) {
      const subsRes = await fetch(
        `https://api.lemonsqueezy.com/v1/subscriptions?filter[store_id]=${storeId}&filter[status]=active&page[size]=100`,
        { headers }
      );
      const subs = await subsRes.json();
      activeSubscriptions += subs.data?.length ?? 0;

      const ordersRes = await fetch(
        `https://api.lemonsqueezy.com/v1/orders?filter[store_id]=${storeId}&page[size]=100`,
        { headers }
      );
      const orders = await ordersRes.json();
      for (const order of orders.data ?? []) {
        if (order.attributes.status === 'paid') {
          totalRevenueCents += order.attributes.total ?? 0;
        }
      }

      const customersRes = await fetch(
        `https://api.lemonsqueezy.com/v1/customers?filter[store_id]=${storeId}&page[size]=1`,
        { headers }
      );
      const customersData = await customersRes.json();
      customerCount += customersData.meta?.page?.total ?? 0;
    }

    const avgOrderValue = activeSubscriptions > 0
      ? totalRevenueCents / Math.max(activeSubscriptions, 1)
      : 0;
    const estimatedMrr = Math.round(avgOrderValue * activeSubscriptions / 12);

    return {
      mrr: estimatedMrr,
      arr: estimatedMrr * 12,
      total_revenue: totalRevenueCents,
      customer_count: customerCount,
      active_subscriptions: activeSubscriptions,
      currency: 'usd',
    };
  },
};
```

## lib/revenue/adapters/revenuecat.ts

```typescript
// NOTE: RevenueCat API does not expose all-time revenue directly.
// total_revenue here reflects last 30 days. Show a footnote in the UI.
import type { RevenueAdapter, RevenueData } from '../types';

export const revenueCatAdapter: RevenueAdapter = {
  platform: 'revenuecat',

  async fetchRevenue({ api_key, account_id }): Promise<RevenueData> {
    const headers = {
      'Authorization': `Bearer ${api_key}`,
      'Content-Type': 'application/json',
    };

    const overviewRes = await fetch(
      `https://api.revenuecat.com/v2/projects/${account_id}/metrics/overview`,
      { headers }
    );
    const overview = await overviewRes.json();
    const metrics = overview.metrics ?? {};

    const mrr = Math.round((metrics.mrr?.value ?? 0) * 100);
    const arr = Math.round((metrics.arr?.value ?? 0) * 100);
    const activeSubscribers = metrics.active_subscriptions?.value ?? 0;
    const revenue30d = Math.round((metrics.revenue?.value ?? 0) * 100);

    return {
      mrr,
      arr,
      total_revenue: revenue30d, // 30-day only — show footnote in UI
      customer_count: activeSubscribers,
      active_subscriptions: activeSubscribers,
      currency: metrics.mrr?.currency ?? 'usd',
    };
  },
};
```

## lib/revenue/adapters/dodo.ts

```typescript
import type { RevenueAdapter, RevenueData } from '../types';

export const dodoAdapter: RevenueAdapter = {
  platform: 'dodo',

  async fetchRevenue({ api_key }): Promise<RevenueData> {
    const headers = {
      'Authorization': `Bearer ${api_key}`,
      'Content-Type': 'application/json',
    };

    const subsRes = await fetch(
      'https://api.dodopayments.com/subscriptions?status=active&limit=100',
      { headers }
    );
    const subs = await subsRes.json();

    let mrrCents = 0;
    const activeSubscriptions = subs.items?.length ?? 0;
    for (const sub of subs.items ?? []) {
      const amount = sub.billing?.amount ?? 0;
      const interval = sub.billing?.interval ?? 'month';
      if (interval === 'month') mrrCents += amount;
      else if (interval === 'year') mrrCents += Math.round(amount / 12);
    }

    const paymentsRes = await fetch(
      'https://api.dodopayments.com/payments?status=succeeded&limit=100',
      { headers }
    );
    const payments = await paymentsRes.json();
    let totalRevenue = 0;
    for (const payment of payments.items ?? []) {
      totalRevenue += payment.total_amount ?? 0;
    }

    const customersRes = await fetch(
      'https://api.dodopayments.com/customers?limit=1',
      { headers }
    );
    const customers = await customersRes.json();

    return {
      mrr: mrrCents,
      arr: mrrCents * 12,
      total_revenue: totalRevenue,
      customer_count: customers.total_count ?? activeSubscriptions,
      active_subscriptions: activeSubscriptions,
      currency: 'usd',
    };
  },
};
```

## lib/revenue/adapters/paddle.ts

```typescript
import type { RevenueAdapter, RevenueData } from '../types';

export const paddleAdapter: RevenueAdapter = {
  platform: 'paddle',

  async fetchRevenue({ api_key }): Promise<RevenueData> {
    const headers = {
      'Authorization': `Bearer ${api_key}`,
      'Content-Type': 'application/json',
    };

    const subsRes = await fetch(
      'https://api.paddle.com/subscriptions?status=active&per_page=200',
      { headers }
    );
    const subs = await subsRes.json();

    let mrrCents = 0;
    const activeSubscriptions = subs.data?.length ?? 0;
    for (const sub of subs.data ?? []) {
      for (const item of sub.items ?? []) {
        const amount = parseInt(item.price?.unit_price?.amount ?? '0');
        const interval = item.price?.billing_cycle?.interval ?? 'month';
        const quantity = item.quantity ?? 1;
        if (interval === 'month') mrrCents += amount * quantity;
        else if (interval === 'year') mrrCents += Math.round((amount * quantity) / 12);
      }
    }

    const txRes = await fetch(
      'https://api.paddle.com/transactions?status=completed&per_page=200',
      { headers }
    );
    const transactions = await txRes.json();
    let totalRevenue = 0;
    for (const tx of transactions.data ?? []) {
      totalRevenue += parseInt(tx.details?.totals?.grand_total ?? '0');
    }

    const custRes = await fetch('https://api.paddle.com/customers?per_page=1', { headers });
    const custData = await custRes.json();

    return {
      mrr: mrrCents,
      arr: mrrCents * 12,
      total_revenue: totalRevenue,
      customer_count: custData.meta?.pagination?.estimated_total ?? activeSubscriptions,
      active_subscriptions: activeSubscriptions,
      currency: 'usd',
    };
  },
};
```

## lib/revenue/sync.ts

```typescript
import { createAdminClient } from '@/lib/supabase/admin';
import { stripeAdapter } from './adapters/stripe';
import { lemonSqueezyAdapter } from './adapters/lemon-squeezy';
import { revenueCatAdapter } from './adapters/revenuecat';
import { dodoAdapter } from './adapters/dodo';
import { paddleAdapter } from './adapters/paddle';
import type { RevenueAdapter } from './types';

const ADAPTERS: Record<string, RevenueAdapter> = {
  stripe: stripeAdapter,
  lemon_squeezy: lemonSqueezyAdapter,
  revenuecat: revenueCatAdapter,
  dodo: dodoAdapter,
  paddle: paddleAdapter,
};

export async function syncConnection(connectionId: string): Promise<void> {
  const supabase = createAdminClient();

  const { data: connection } = await supabase
    .from('revenue_connections')
    .select('*')
    .eq('id', connectionId)
    .single();

  if (!connection) return;

  const adapter = ADAPTERS[connection.platform];
  if (!adapter) return;

  try {
    const revenue = await adapter.fetchRevenue({
      api_key: connection.api_key,
      access_token: connection.access_token,
      account_id: connection.account_id,
    });

    await supabase
      .from('revenue_connections')
      .update({
        mrr: revenue.mrr,
        arr: revenue.arr,
        total_revenue: revenue.total_revenue,
        customer_count: revenue.customer_count,
        active_subscriptions: revenue.active_subscriptions,
        currency: revenue.currency,
        status: 'active',
        last_error: null,
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', connectionId);

    await aggregateProductRevenue(connection.product_id);

  } catch (err: any) {
    await supabase
      .from('revenue_connections')
      .update({
        status: 'error',
        last_error: err.message ?? 'Unknown error',
        last_synced_at: new Date().toISOString(),
      })
      .eq('id', connectionId);
  }
}

async function aggregateProductRevenue(productId: string): Promise<void> {
  const supabase = createAdminClient();

  const { data: connections } = await supabase
    .from('revenue_connections')
    .select('mrr, arr, total_revenue, customer_count')
    .eq('product_id', productId)
    .eq('status', 'active');

  if (!connections || connections.length === 0) return;

  const totalMrr = connections.reduce((s, c) => s + (c.mrr ?? 0), 0);
  const totalArr = connections.reduce((s, c) => s + (c.arr ?? 0), 0);
  const totalRevenue = connections.reduce((s, c) => s + (c.total_revenue ?? 0), 0);
  const totalCustomers = connections.reduce((s, c) => s + (c.customer_count ?? 0), 0);

  const { data: lastSnapshot } = await supabase
    .from('revenue_snapshots')
    .select('mrr')
    .eq('product_id', productId)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single();

  let momGrowth = null;
  if (lastSnapshot && lastSnapshot.mrr > 0) {
    momGrowth = parseFloat(
      (((totalMrr - lastSnapshot.mrr) / lastSnapshot.mrr) * 100).toFixed(2)
    );
  }

  await supabase
    .from('products')
    .update({
      revenue_verified: true,
      revenue_mrr: totalMrr,
      revenue_arr: totalArr,
      revenue_total: totalRevenue,
      revenue_customer_count: totalCustomers,
      revenue_mom_growth: momGrowth,
      revenue_last_synced_at: new Date().toISOString(),
    })
    .eq('id', productId);

  await supabase
    .from('revenue_snapshots')
    .insert({
      product_id: productId,
      mrr: totalMrr,
      customer_count: totalCustomers,
      total_revenue: totalRevenue,
    });
}

export async function syncAllConnections(): Promise<number> {
  const supabase = createAdminClient();

  const { data: connections } = await supabase
    .from('revenue_connections')
    .select('id')
    .neq('status', 'disconnected');

  if (!connections) return 0;

  const BATCH = 5;
  for (let i = 0; i < connections.length; i += BATCH) {
    await Promise.all(
      connections.slice(i, i + BATCH).map(c => syncConnection(c.id))
    );
  }
  return connections.length;
}
```

## app/api/verify/connect/route.ts

```typescript
import { createClient } from '@/lib/supabase/server';
import { syncConnection } from '@/lib/revenue/sync';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({
  product_id: z.string().uuid(),
  platform: z.enum(['stripe', 'lemon_squeezy', 'revenuecat', 'dodo', 'paddle']),
  api_key: z.string().optional(),
  account_id: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { product_id, platform, api_key, account_id } = parsed.data;

  const { data: product } = await supabase
    .from('products')
    .select('id')
    .eq('id', product_id)
    .eq('owner_id', user.id)
    .single();

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const { data: connection, error } = await supabase
    .from('revenue_connections')
    .upsert(
      { product_id, platform, api_key: api_key ?? null, account_id: account_id ?? null, status: 'pending' },
      { onConflict: 'product_id,platform' }
    )
    .select()
    .single();

  if (error || !connection) {
    return NextResponse.json({ error: 'Failed to save connection' }, { status: 500 });
  }

  // Trigger immediate sync (fire and forget)
  syncConnection(connection.id).catch(console.error);

  return NextResponse.json({ success: true, connection_id: connection.id });
}
```

## app/api/verify/disconnect/route.ts

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { connection_id } = await request.json();

  await supabase
    .from('revenue_connections')
    .update({ status: 'disconnected', api_key: null, access_token: null })
    .eq('id', connection_id);

  return NextResponse.json({ success: true });
}
```

## app/api/verify/stripe/connect/route.ts (Stripe OAuth only)

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('product_id');
  if (!productId) return NextResponse.json({ error: 'product_id required' }, { status: 400 });

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect('/login');

  const { data: product } = await supabase
    .from('products').select('id').eq('id', productId).eq('owner_id', user.id).single();
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  const params = new URLSearchParams({
    client_id: process.env.STRIPE_CONNECT_CLIENT_ID!,
    response_type: 'code',
    scope: 'read_only',
    redirect_uri: process.env.STRIPE_CONNECT_REDIRECT_URI!,
    state: productId,
  });

  return NextResponse.redirect(`https://connect.stripe.com/oauth/authorize?${params.toString()}`);
}
```

## app/api/verify/stripe/callback/route.ts

```typescript
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { syncConnection } from '@/lib/revenue/sync';
import { NextRequest, NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const productId = searchParams.get('state');
  const error = searchParams.get('error');

  if (error || !code || !productId) {
    return NextResponse.redirect(`/dashboard/products/${productId}/verify?stripe_error=true`);
  }

  const response = await stripe.oauth.token({ grant_type: 'authorization_code', code });
  const supabase = createClient();

  // Upsert the Stripe connection into revenue_connections
  const { data: connection } = await supabase
    .from('revenue_connections')
    .upsert({
      product_id: productId,
      platform: 'stripe',
      access_token: response.access_token,
      account_id: response.stripe_user_id,
      status: 'pending',
    }, { onConflict: 'product_id,platform' })
    .select()
    .single();

  // Also mark stripe_verified on the product
  await supabase
    .from('products')
    .update({ stripe_verified: true })
    .eq('id', productId);

  if (connection) syncConnection(connection.id).catch(console.error);

  return NextResponse.redirect(`/dashboard/products/${productId}/verify?stripe_connected=true`);
}
```

## app/api/cron/sync-revenue/route.ts

```typescript
import { syncAllConnections } from '@/lib/revenue/sync';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const synced = await syncAllConnections();
  return NextResponse.json({ synced });
}
```

---

### ▶ EXECUTE — Multi-Platform Revenue System

**Step 1: Create the revenue folder structure**
```bash
mkdir -p lib/revenue/adapters
```

**Step 2: Create files in this order**
1. `lib/revenue/types.ts`
2. `lib/revenue/adapters/stripe.ts`
3. `lib/revenue/adapters/lemon-squeezy.ts`
4. `lib/revenue/adapters/revenuecat.ts`
5. `lib/revenue/adapters/dodo.ts`
6. `lib/revenue/adapters/paddle.ts`
7. `lib/revenue/sync.ts`
8. `app/api/verify/connect/route.ts`
9. `app/api/verify/disconnect/route.ts`
10. `app/api/verify/stripe/connect/route.ts`
11. `app/api/verify/stripe/callback/route.ts`
12. `app/api/cron/sync-revenue/route.ts`

Copy each code block above exactly into the corresponding file.

**Step 3: Delete the old file (if it exists)**
```bash
rm -f lib/sync-stripe.ts
```

**Step 4: Test a connection locally**
```bash
# Start dev server
npm run dev

# Test the connect endpoint (replace with real values)
curl -X POST http://localhost:3000/api/verify/connect \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"product_id":"your-product-uuid","platform":"lemon_squeezy","api_key":"your-ls-key"}'
```

**Step 5: Test the cron**
```bash
curl -H "Authorization: Bearer your-cron-secret" \
  http://localhost:3000/api/cron/sync-revenue
# Should return: {"synced": N}
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PART 12 — WIDGET EMBED CODE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```html
<div id="agenttrust-widget"></div>
<script>
  (function() {
    var slug = 'your-product-slug';
    fetch('https://agenttrust.com/api/widget/' + slug)
      .then(function(r) { return r.json(); })
      .then(function(d) {
        var el = document.getElementById('agenttrust-widget');
        if (!el || !d) return;
        el.innerHTML =
          '<a href="https://agenttrust.com/p/' + slug + '" target="_blank" ' +
          'style="display:inline-flex;align-items:center;gap:8px;padding:8px 14px;' +
          'background:#fff;border:1px solid #e5e7eb;border-radius:8px;' +
          'text-decoration:none;font-family:system-ui,sans-serif;font-size:14px;color:#111">' +
          '<span style="color:#f59e0b">' + '★'.repeat(Math.round(d.avg_rating)) + '</span>' +
          '<strong>' + d.avg_rating.toFixed(1) + '</strong>' +
          '<span style="color:#6b7280">' + d.review_count + ' reviews</span>' +
          '<span style="font-size:11px;color:#9ca3af;border-left:1px solid #e5e7eb;padding-left:8px">AgentTrust</span></a>';
      });
  })();
</script>
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PART 13 — BUILD PHASES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Phase 1 — MVP (weeks 1–4)
- [ ] Supabase schema created and migration run
- [ ] Next.js scaffolded with Tailwind + shadcn/ui
- [ ] Auth: signup, login, reset password
- [ ] Dashboard layout with sidebar
- [ ] Create product form
- [ ] Public product profile page `/p/[slug]`
- [ ] Public review form `/review/[slug]`
- [ ] Trust score running + Trust API endpoint
- [ ] Landing page (basic)
- [ ] Stripe billing (Free + Starter)

## Phase 2 — Review collection (weeks 5–8)
- [ ] Campaign creation + CSV upload
- [ ] Resend email integration
- [ ] Token-based review form
- [ ] Growth and Scale plans
- [ ] Multi-platform revenue verification (full Part 11)
- [ ] Verify page `/dashboard/products/[id]/verify`
- [ ] Revenue section on public profile

## Phase 3 — Polish (weeks 9–12)
- [ ] Leaderboard with MRR column + sort options
- [ ] SEO: meta tags, Schema.org JSON-LD
- [ ] `/for-ai` page
- [ ] Agent query counter in dashboard
- [ ] Widget embed in dashboard
- [ ] Review moderation
- [ ] Placeholder ad slot in leaderboard sidebar

## Phase 4 — Ads (500+ daily visitors)
- [ ] `/advertise` page
- [ ] Active ad slots rendering
- [ ] First 3 advertisers closed manually

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PART 14 — THE 14 BUILD PROMPTS (COPY-PASTE READY)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Save this entire document as `PRODUCT_SPEC.md` in your repo root.
Then run these prompts one at a time in Codex, Cursor, or your preferred AI coding platform.
**Wait for each prompt to finish before running the next.**

---

### PROMPT 1 — Project setup
```
Read PRODUCT_SPEC.md.

Set up the Next.js project for AgentTrust:
1. Initialize Next.js 15 with App Router, TypeScript, Tailwind CSS
2. Install: @supabase/supabase-js @supabase/ssr stripe resend zod
   react-hook-form @hookform/resolvers recharts lucide-react
3. Run: npx shadcn-ui@latest init (default settings)
4. Add shadcn components: button card input label textarea badge
5. Create folder structure from Part 7 (all folders + placeholder page.tsx files)
6. Create .env.local.example with all variables from Part 8
7. Create vercel.json with the 3 cron jobs from Part 9
8. Create lib/supabase/client.ts, lib/supabase/server.ts, lib/supabase/admin.ts
   using Supabase SSR helpers

Do not build any pages. Just the foundation.
```

---

### PROMPT 2 — Database & types
```
Read PRODUCT_SPEC.md, Part 3 (Database Schema).

1. Create supabase/migrations/001_schema.sql with the COMPLETE SQL from Part 3.
   Include all 10 tables, all RLS policies, all indexes, both triggers.
   Make sure revenue_connections table is included.

2. Create lib/types.ts with TypeScript interfaces for every table:
   Profile, Product, RevenueConnection, RevenueSnapshot, Review,
   Campaign, CampaignRecipient, Subscription, AdSlot, AgentQuery.
   Use proper types (string, number, boolean, Date | null).
```

---

### PROMPT 3 — Auth pages
```
Read PRODUCT_SPEC.md.

Build auth pages using Supabase Auth:
1. /app/(auth)/login/page.tsx — email + password, magic link option
2. /app/(auth)/signup/page.tsx — name, email, password
3. /app/(auth)/reset-password/page.tsx — email input triggers reset

Use shadcn/ui Card, Input, Button, Label.
After login → redirect to /dashboard.
Keep design: centered card, clean, minimal, no sidebar.
```

---

### PROMPT 4 — Product creation flow
```
Read PRODUCT_SPEC.md.

Build:
1. /app/(dashboard)/dashboard/products/new/page.tsx
   Fields: name, website URL, category (dropdown), tagline, description, logo upload
   On submit → POST /api/products → redirect to /dashboard/products/[id]

2. /app/api/products/route.ts (POST)
   - Validate with Zod
   - Auto-generate unique slug from name
   - Check plan limits (free = 1 product)
   - Insert to products table

3. /app/(dashboard)/dashboard/products/page.tsx
   - Cards for each product: logo, name, avg rating, review count, trust score
   - "Add product" button
```

---

### PROMPT 5 — Public product profile page
```
Read PRODUCT_SPEC.md, Parts 5 and 6.

Build /app/(public)/p/[slug]/page.tsx.

Sections in order:
1. Header: logo, name, tagline, website link, category badge, "Leave a review" button
2. Trust score: large number + grade letter (A/B/C/D/F) + verification badges
3. Revenue section — show ONLY if revenue_verified = true AND revenue_is_public = true:
   - Query revenue_connections table for this product (status = 'active')
   - Show platform badges: "Verified across: [Stripe ✓] [RevenueCat ✓]"
   - Four stat cards: MRR, ARR, Customers, MoM Growth (amounts from revenue_mrr, etc.)
   - All-time total revenue
   - MRR sparkline using recharts (last 12 revenue_snapshots)
   - "Last updated X hours ago"
   - "Revenue pulled directly from platform APIs. Cannot be edited by the seller."
   - If revenuecat is in the connected platforms: show footnote
     "* RevenueCat data shows last 30 days only"
4. Rating distribution bar chart
5. Review list (paginated, 10 per page)
6. Agent section: "AI agents queried this profile X times"

Fetch all data server-side. Handle 404 gracefully.
Add Schema.org JSON-LD in <head>.
```

---

### PROMPT 6 — Review forms
```
Read PRODUCT_SPEC.md.

1. /app/(public)/review/[slug]/page.tsx — public form
   Fields: name (required), role/title, rating 1-5 (required),
   review title, body (required, min 50 chars), use case
   POST to /api/review/public/[slug]

2. /app/(public)/review/token/[token]/page.tsx — email form
   Same fields, pre-fill name from campaign_recipients
   POST to /api/review/form/[token], mark recipient as reviewed

3. /app/api/review/public/[slug]/route.ts
4. /app/api/review/form/[token]/route.ts (GET validates, POST submits)

Show product name + logo at top. After submit: thank you message (no redirect).
```

---

### PROMPT 7 — Trust API endpoint
```
Read PRODUCT_SPEC.md, Part 5.

Build /app/api/trust/[slug]/route.ts:
- GET only, no auth
- Fetch product, reviews, revenue_connections (active only)
- Build the EXACT response shape from Part 5 including:
  * revenue.platforms array (list of active platform names)
  * revenue.combined object (from products.revenue_* columns)
  * agent_summary string mentioning revenue if verified
- Log to agent_queries (fire and forget)
- Increment agent_query_count (fire and forget)
- Cache-Control: public max-age=3600
- 404 if not found

Create lib/trust-score.ts with calculateTrustScore and getTrustGrade from Part 5.
Note: verification score uses revenue_verified column, not stripe_verified.
```

---

### PROMPT 8 — Dashboard overview
```
Read PRODUCT_SPEC.md.

1. /app/(dashboard)/layout.tsx
   Sidebar: Overview, Products, Reviews, Campaigns, Billing
   User avatar + email at bottom. Redirect to /login if no session.

2. /app/(dashboard)/dashboard/page.tsx
   Stats: Total reviews this month, Avg rating, Agent queries this month, Active products
   Quick links to each product. Empty state if no products.

3. /app/api/dashboard/stats/route.ts
   Return aggregated stats across all seller products.
```

---

### PROMPT 9 — Email campaigns
```
Read PRODUCT_SPEC.md.

1. /app/(dashboard)/dashboard/products/[id]/campaigns/page.tsx
   - List campaigns with stats
   - Create form: name, subject, body ({reviewer_name}, {review_link} vars), recipients textarea

2. /app/api/campaigns/route.ts — create campaign + recipients
3. /app/api/campaigns/[id]/send/route.ts — trigger sending

4. lib/resend.ts — send review request email via Resend
   Email has product name, message, button → /review/token/[token]

5. /app/api/cron/send-campaigns/route.ts
   Protected by CRON_SECRET. Send pending emails in batches of 50.

Check plan limits: free = 0, starter = 200/month.
```

---

### PROMPT 10 — Stripe billing
```
Read PRODUCT_SPEC.md, Parts 1 and 10.

1. /app/(dashboard)/dashboard/billing/page.tsx
   Current plan + renewal date. Three plan cards. Upgrade + Manage buttons.

2. /app/api/billing/checkout/route.ts — create Stripe checkout session
3. /app/api/billing/portal/route.ts — create Stripe portal session
4. /app/api/webhooks/stripe/route.ts
   Handle: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted
   Verify webhook signature. Update subscriptions table + profiles.plan.

5. lib/plan-limits.ts — exact code from Part 10
```

---

### PROMPT 11 — Landing page
```
Read PRODUCT_SPEC.md.

Build /app/(public)/page.tsx.

Sections:
1. Navbar: logo, Leaderboard link, For AI link, Sign in + Get started free buttons
2. Hero: "AgentTrust — verified proof for the AI-native era"
   Subheadline about reviews + multi-platform revenue + AI agents
   CTAs: Get started free → /signup, View leaderboard → /leaderboard
3. How it works — 3 steps (register, collect reviews + connect revenue, display to humans + AI)
4. Supported revenue platforms — show logos: Stripe, Lemon Squeezy, RevenueCat, Dodo, Paddle
5. Pricing — four cards: Free / Starter $19 / Growth $49 / Scale $99. Highlight Growth.
6. Footer

Tailwind only. No heavy animations. Clean and minimal.
```

---

### PROMPT 12 — Leaderboard page
```
Read PRODUCT_SPEC.md, Part 6.

Build /app/(public)/leaderboard/page.tsx.

Features:
- Category filter tabs: All, SaaS, Apps, AI Tools, Open Source
- Sort options: Trust Score / MRR / Reviews
- Each row: rank, logo, name, category badge, star rating,
  review count, MRR (show "—" if revenue_verified = false),
  trust score, "View profile" link
- Pagination (20 per page)
- Sidebar: placeholder ad slot "Sponsor this spot — contact@agenttrust.com"

/app/api/leaderboard/route.ts — query products, filterable by category,
sortable by trust_score (default), revenue_mrr, or review_count.
```

---

### PROMPT 13 — Revenue verify page (dashboard)
```
Read PRODUCT_SPEC.md, Part 11.

Build /app/(dashboard)/dashboard/products/[id]/verify/page.tsx.

This page shows all 5 supported platforms.
For each platform, show either:

A) CONNECTED state (if row exists in revenue_connections with status = 'active'):
   - Platform logo + name + green checkmark
   - MRR, customer count, last synced time
   - "Disconnect" button → POST /api/verify/disconnect

B) CONNECT form (if not connected):
   - Platform logo + name
   - For Stripe: "Connect Stripe" button → GET /api/verify/stripe/connect?product_id=[id]
   - For all others: API key input field with instructions on where to find the key:
     * Lemon Squeezy: "Get at dashboard.lemonsqueezy.com → Settings → API"
     * RevenueCat: Two fields — Project ID + Secret API key.
       "Find both at app.revenuecat.com → Project Settings → API Keys"
     * Dodo: "Get at dashboard.dodopayments.com → Settings → API"
     * Paddle: "Get at vendors.paddle.com → Developer Tools → Authentication"
   - "Connect" button → POST /api/verify/connect

Handle URL params: stripe_connected=true (show success), stripe_error=true (show error).
Add privacy notice: "Read-only access. We cannot charge you or move funds."
```

---

### PROMPT 14 — Revenue sync system & cron
```
Read PRODUCT_SPEC.md, Part 11.

Build the complete revenue sync system:

1. lib/revenue/types.ts — RevenueData and RevenueAdapter interfaces (exact code from Part 11)
2. lib/revenue/adapters/stripe.ts — exact code from Part 11
3. lib/revenue/adapters/lemon-squeezy.ts — exact code from Part 11
4. lib/revenue/adapters/revenuecat.ts — exact code from Part 11
5. lib/revenue/adapters/dodo.ts — exact code from Part 11
6. lib/revenue/adapters/paddle.ts — exact code from Part 11
7. lib/revenue/sync.ts — syncConnection(), aggregateProductRevenue(), syncAllConnections()
   Exact code from Part 11.
8. app/api/verify/connect/route.ts — exact code from Part 11
9. app/api/verify/disconnect/route.ts — exact code from Part 11
10. app/api/verify/stripe/connect/route.ts — exact code from Part 11
11. app/api/verify/stripe/callback/route.ts — exact code from Part 11
12. app/api/cron/sync-revenue/route.ts — calls syncAllConnections(), protected by CRON_SECRET

If lib/sync-stripe.ts exists from a previous step, delete it.
The new system fully replaces it.
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PART 15 — DEPLOYMENT
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### ▶ EXECUTE — Step by step deployment

**Step 1: Push to GitHub**
```bash
git init
git add .
git commit -m "feat: initial agenttrust build"
git remote add origin https://github.com/yourusername/agenttrust.git
git push -u origin main
```

**Step 2: Deploy to Vercel**
1. [vercel.com](https://vercel.com) → **Add New Project** → Import GitHub repo
2. Framework: Next.js (auto-detected)
3. **Environment Variables** — add every variable from Part 8
4. Click **Deploy** — wait ~3 minutes

**Step 3: Configure Stripe webhook**
1. Stripe dashboard → **Developers** → **Webhooks** → **Add endpoint**
2. URL: `https://your-domain.vercel.app/api/webhooks/stripe`
3. Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy signing secret → add to Vercel as `STRIPE_WEBHOOK_SECRET` → redeploy

**Step 4: Verify crons**
1. Vercel dashboard → your project → **Cron Jobs** tab
2. You should see 3 crons. Trigger manually to test.

**Step 5: Test the Trust API**
```bash
curl https://your-domain.vercel.app/api/trust/your-product-slug
# Should return full JSON with trust score and (if connected) revenue data
```

**Step 6: Test revenue sync**
```bash
curl -H "Authorization: Bearer your-cron-secret" \
  https://your-domain.vercel.app/api/cron/sync-revenue
# Should return: {"synced": 0} (0 connections on first run, grows as sellers connect)
```

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PART 16 — ADVERTISING SLOTS (Phase 4)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Build now (the table is in the schema), sell later. Day one: hardcode one placeholder card.

**Where ads appear:** Leaderboard sidebar (2 slots), product profile sidebar (1 slot), leaderboard banner top.

**Pricing ladder:**

| Daily visitors | Price/month |
|---|---|
| 0–100 | $99 (fill with your own promo or leave empty) |
| 100–500 | $299 |
| 500–2,000 | $699 |
| 2,000+ | $999–$1,499 |

When someone emails about a slot: take payment via Stripe payment link, add their data to the `ad_slots` table manually.

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PART 17 — GO-TO-MARKET
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Week 1: first 10 sellers
1. List your own product on AgentTrust first (dogfood it)
2. Post: r/SaaS, r/IndieHackers, Hacker News "Show HN", Twitter #buildinpublic
3. DM 20 indie hackers → offer free Growth plan 3 months for feedback
4. Write: "I built a Trustpilot alternative for indie SaaS that also verifies revenue"
5. Reach out to mobile app founders specifically — RevenueCat support is your differentiator vs. TrustMRR

## Weeks 2–4: SEO
1. Submit sitemap to Google Search Console
2. Every `/p/[slug]` page needs proper title, description, OG tags
3. Create `/compare/notion-vs-coda` style pages for search terms
4. Schema.org markup gets you into AI search results

## Month 2: first advertiser
1. At 200+ daily visitors, email 5 indie SaaS tools
2. First slot at $149/month intro price
3. Stripe payment link → add to `ad_slots` table manually

---

*AgentTrust Master Build Document v4.0 — May 2026*
*14 build prompts · 5 revenue platforms · 10 database tables · 1 trust layer for humans and AI agents*