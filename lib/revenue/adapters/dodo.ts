import type { RevenueAdapter, RevenueData } from "../types";

/**
 * Seller-facing Dodo Payments revenue sync (API key the seller pastes).
 * Not used for AgentTrust subscription billing — see lib/dodo.ts for that.
 */
export const dodoAdapter: RevenueAdapter = {
  platform: "dodo",

  async fetchRevenue({ api_key }): Promise<RevenueData> {
    const headers = {
      Authorization: `Bearer ${api_key}`,
      "Content-Type": "application/json",
    };

    const subsRes = await fetch(
      "https://api.dodopayments.com/subscriptions?status=active&limit=100",
      { headers },
    );
    const subs = await subsRes.json();

    let mrrCents = 0;
    const activeSubscriptions = subs.items?.length ?? 0;
    for (const sub of subs.items ?? []) {
      const amount = sub.billing?.amount ?? 0;
      const interval = sub.billing?.interval ?? "month";
      if (interval === "month") mrrCents += amount;
      else if (interval === "year") mrrCents += Math.round(amount / 12);
    }

    const paymentsRes = await fetch(
      "https://api.dodopayments.com/payments?status=succeeded&limit=100",
      { headers },
    );
    const payments = await paymentsRes.json();
    let totalRevenue = 0;
    for (const payment of payments.items ?? []) {
      totalRevenue += payment.total_amount ?? 0;
    }

    const customersRes = await fetch(
      "https://api.dodopayments.com/customers?limit=1",
      { headers },
    );
    const customers = await customersRes.json();

    return {
      mrr: mrrCents,
      arr: mrrCents * 12,
      total_revenue: totalRevenue,
      customer_count: customers.total_count ?? activeSubscriptions,
      active_subscriptions: activeSubscriptions,
      currency: "usd",
    };
  },
};
