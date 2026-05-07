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
-- REVENUE CONNECTIONS (multi-platform - one row per platform per product)
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
-- REVENUE SNAPSHOTS (for MRR growth chart - combined total)
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
