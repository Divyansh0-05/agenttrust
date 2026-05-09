import type { RevenueAdapter, RevenueData } from "../types";

export const lemonSqueezyAdapter: RevenueAdapter = {
  platform: "lemon_squeezy",

  async fetchRevenue({ api_key }): Promise<RevenueData> {
    const headers = {
      Authorization: `Bearer ${api_key}`,
      Accept: "application/vnd.api+json",
    };

    const storesRes = await fetch("https://api.lemonsqueezy.com/v1/stores", {
      headers,
    });
    const stores = await storesRes.json();
    const storeIds: string[] = stores.data?.map((s: { id: string }) => s.id) ?? [];

    let totalRevenueCents = 0;
    let activeSubscriptions = 0;
    let customerCount = 0;

    for (const storeId of storeIds) {
      const subsRes = await fetch(
        `https://api.lemonsqueezy.com/v1/subscriptions?filter[store_id]=${storeId}&filter[status]=active&page[size]=100`,
        { headers },
      );
      const subs = await subsRes.json();
      activeSubscriptions += subs.data?.length ?? 0;

      const ordersRes = await fetch(
        `https://api.lemonsqueezy.com/v1/orders?filter[store_id]=${storeId}&page[size]=100`,
        { headers },
      );
      const orders = await ordersRes.json();
      for (const order of orders.data ?? []) {
        if (order.attributes.status === "paid") {
          totalRevenueCents += order.attributes.total ?? 0;
        }
      }

      const customersRes = await fetch(
        `https://api.lemonsqueezy.com/v1/customers?filter[store_id]=${storeId}&page[size]=1`,
        { headers },
      );
      const customersData = await customersRes.json();
      customerCount += customersData.meta?.page?.total ?? 0;
    }

    const avgOrderValue =
      activeSubscriptions > 0
        ? totalRevenueCents / Math.max(activeSubscriptions, 1)
        : 0;
    const estimatedMrr = Math.round(
      (avgOrderValue * activeSubscriptions) / 12,
    );

    return {
      mrr: estimatedMrr,
      arr: estimatedMrr * 12,
      total_revenue: totalRevenueCents,
      customer_count: customerCount,
      active_subscriptions: activeSubscriptions,
      currency: "usd",
    };
  },
};
