import { supabaseAdmin } from "@/lib/supabase/admin";

import { dodoAdapter } from "./adapters/dodo";
import { lemonSqueezyAdapter } from "./adapters/lemon-squeezy";
import { paddleAdapter } from "./adapters/paddle";
import { revenueCatAdapter } from "./adapters/revenuecat";
import { stripeAdapter } from "./adapters/stripe";
import type { RevenueAdapter } from "./types";

const ADAPTERS: Record<string, RevenueAdapter> = {
  stripe: stripeAdapter,
  lemon_squeezy: lemonSqueezyAdapter,
  revenuecat: revenueCatAdapter,
  dodo: dodoAdapter,
  paddle: paddleAdapter,
};

export async function syncConnection(connectionId: string): Promise<void> {
  const supabase = supabaseAdmin;

  const { data: connection } = await supabase
    .from("revenue_connections")
    .select("*")
    .eq("id", connectionId)
    .single();

  if (!connection) return;

  const adapter = ADAPTERS[connection.platform as string];
  if (!adapter) return;

  try {
    const revenue = await adapter.fetchRevenue({
      api_key: connection.api_key ?? undefined,
      access_token: connection.access_token ?? undefined,
      account_id: connection.account_id ?? undefined,
    });

    await supabase
      .from("revenue_connections")
      .update({
        mrr: revenue.mrr,
        arr: revenue.arr,
        total_revenue: revenue.total_revenue,
        customer_count: revenue.customer_count,
        active_subscriptions: revenue.active_subscriptions,
        currency: revenue.currency,
        status: "active",
        last_error: null,
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", connectionId);

    await aggregateProductRevenue(connection.product_id);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await supabase
      .from("revenue_connections")
      .update({
        status: "error",
        last_error: message,
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", connectionId);
  }
}

async function aggregateProductRevenue(productId: string): Promise<void> {
  const supabase = supabaseAdmin;

  const { data: connections } = await supabase
    .from("revenue_connections")
    .select("mrr, arr, total_revenue, customer_count")
    .eq("product_id", productId)
    .eq("status", "active");

  if (!connections || connections.length === 0) return;

  const totalMrr = connections.reduce((s, c) => s + (c.mrr ?? 0), 0);
  const totalArr = connections.reduce((s, c) => s + (c.arr ?? 0), 0);
  const totalRevenue = connections.reduce(
    (s, c) => s + (c.total_revenue ?? 0),
    0,
  );
  const totalCustomers = connections.reduce(
    (s, c) => s + (c.customer_count ?? 0),
    0,
  );

  const { data: lastSnapshot } = await supabase
    .from("revenue_snapshots")
    .select("mrr")
    .eq("product_id", productId)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let momGrowth = null as number | null;
  if (lastSnapshot && lastSnapshot.mrr > 0) {
    momGrowth = parseFloat(
      (((totalMrr - lastSnapshot.mrr) / lastSnapshot.mrr) * 100).toFixed(2),
    );
  }

  await supabase
    .from("products")
    .update({
      revenue_verified: true,
      revenue_mrr: totalMrr,
      revenue_arr: totalArr,
      revenue_total: totalRevenue,
      revenue_customer_count: totalCustomers,
      revenue_mom_growth: momGrowth,
      revenue_last_synced_at: new Date().toISOString(),
    })
    .eq("id", productId);

  await supabase.from("revenue_snapshots").insert({
    product_id: productId,
    mrr: totalMrr,
    customer_count: totalCustomers,
    total_revenue: totalRevenue,
  });
}

export async function syncAllConnections(): Promise<number> {
  const supabase = supabaseAdmin;

  const { data: connections } = await supabase
    .from("revenue_connections")
    .select("id")
    .neq("status", "disconnected");

  if (!connections) return 0;

  const BATCH = 5;
  for (let i = 0; i < connections.length; i += BATCH) {
    await Promise.all(
      connections.slice(i, i + BATCH).map((c) => syncConnection(c.id)),
    );
  }
  return connections.length;
}
