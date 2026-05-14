-- Migration for AgentUp feature

-- 1. Add agentup_count to products
ALTER TABLE public.products
ADD COLUMN agentup_count integer DEFAULT 0;

-- 2. Create agentups table
CREATE TABLE public.agentups (
    id uuid primary key default gen_random_uuid(),
    product_id uuid references public.products(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete set null,
    ip_hash text not null,
    created_at timestamptz default now()
);

-- 3. Create indices
CREATE INDEX idx_agentups_product_user ON public.agentups(product_id, user_id);
CREATE INDEX idx_agentups_product_ip_time ON public.agentups(product_id, ip_hash, created_at);

-- 4. Enable RLS
ALTER TABLE public.agentups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view agentups" ON public.agentups FOR SELECT USING (true);

-- 5. RPC for atomic increment
CREATE OR REPLACE FUNCTION increment_agentup_count(product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.products
  SET agentup_count = agentup_count + 1
  WHERE id = product_id;
END;
$$;
