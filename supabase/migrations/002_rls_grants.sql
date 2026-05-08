-- Allow Supabase API roles to access the public schema.
-- Row-level security policies below still decide which rows are visible/editable.
grant usage on schema public to anon, authenticated;

-- Tables with existing RLS policies from the initial schema.
grant select, insert, update, delete on public.profiles to authenticated;
grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.revenue_connections to authenticated;
grant select on public.reviews to anon;
grant select, insert, update, delete on public.reviews to authenticated;

-- Revenue snapshots are private to the owning product account.
alter table public.revenue_snapshots enable row level security;
create policy "Owners manage own revenue snapshots"
  on public.revenue_snapshots for all using (
    product_id in (
      select id from public.products where owner_id = auth.uid()
    )
  );
grant select, insert, update, delete on public.revenue_snapshots to authenticated;

-- Campaigns are private to the owning product account.
alter table public.campaigns enable row level security;
create policy "Owners manage own campaigns"
  on public.campaigns for all using (
    product_id in (
      select id from public.products where owner_id = auth.uid()
    )
  );
grant select, insert, update, delete on public.campaigns to authenticated;

alter table public.campaign_recipients enable row level security;
create policy "Owners manage own campaign recipients"
  on public.campaign_recipients for all using (
    product_id in (
      select id from public.products where owner_id = auth.uid()
    )
  );
grant select, insert, update, delete on public.campaign_recipients to authenticated;

-- Subscriptions are private to the subscribed user.
alter table public.subscriptions enable row level security;
create policy "Users view own subscriptions"
  on public.subscriptions for select using (user_id = auth.uid());
grant select on public.subscriptions to authenticated;

-- Public ad slots can be read by public pages.
alter table public.ad_slots enable row level security;
create policy "Active ad slots viewable by all"
  on public.ad_slots for select using (is_active = true);
grant select on public.ad_slots to anon, authenticated;

-- Agent query logs can be inserted by public/API traffic, but not read publicly.
alter table public.agent_queries enable row level security;
create policy "Anyone can log agent queries"
  on public.agent_queries for insert with check (true);
create policy "Owners view own agent queries"
  on public.agent_queries for select using (
    product_id in (
      select id from public.products where owner_id = auth.uid()
    )
  );
grant insert on public.agent_queries to anon, authenticated;
grant select on public.agent_queries to authenticated;
