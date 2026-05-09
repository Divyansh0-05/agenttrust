// NOTE: RevenueCat API does not expose all-time revenue directly.
// total_revenue here reflects last 30 days. Show a footnote in the UI.
import type { RevenueAdapter, RevenueData } from "../types";

export const revenueCatAdapter: RevenueAdapter = {
  platform: "revenuecat",

  async fetchRevenue({ api_key, account_id }): Promise<RevenueData> {
    const headers = {
      Authorization: `Bearer ${api_key}`,
      "Content-Type": "application/json",
    };

    const overviewRes = await fetch(
      `https://api.revenuecat.com/v2/projects/${account_id}/metrics/overview`,
      { headers },
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
      currency: metrics.mrr?.currency ?? "usd",
    };
  },
};
