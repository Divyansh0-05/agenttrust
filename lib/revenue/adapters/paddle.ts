import type { RevenueAdapter, RevenueData } from "../types";

export const paddleAdapter: RevenueAdapter = {
  platform: "paddle",

  async fetchRevenue({ api_key }): Promise<RevenueData> {
    const headers = {
      Authorization: `Bearer ${api_key}`,
      "Content-Type": "application/json",
    };

    const subsRes = await fetch(
      "https://api.paddle.com/subscriptions?status=active&per_page=200",
      { headers },
    );
    const subs = await subsRes.json();

    let mrrCents = 0;
    const activeSubscriptions = subs.data?.length ?? 0;
    for (const sub of subs.data ?? []) {
      for (const item of sub.items ?? []) {
        const amount = parseInt(item.price?.unit_price?.amount ?? "0", 10);
        const interval = item.price?.billing_cycle?.interval ?? "month";
        const quantity = item.quantity ?? 1;
        if (interval === "month") mrrCents += amount * quantity;
        else if (interval === "year")
          mrrCents += Math.round((amount * quantity) / 12);
      }
    }

    const txRes = await fetch(
      "https://api.paddle.com/transactions?status=completed&per_page=200",
      { headers },
    );
    const transactions = await txRes.json();
    let totalRevenue = 0;
    for (const tx of transactions.data ?? []) {
      totalRevenue += parseInt(tx.details?.totals?.grand_total ?? "0", 10);
    }

    const custRes = await fetch("https://api.paddle.com/customers?per_page=1", {
      headers,
    });
    const custData = await custRes.json();

    return {
      mrr: mrrCents,
      arr: mrrCents * 12,
      total_revenue: totalRevenue,
      customer_count:
        custData.meta?.pagination?.estimated_total ?? activeSubscriptions,
      active_subscriptions: activeSubscriptions,
      currency: "usd",
    };
  },
};
