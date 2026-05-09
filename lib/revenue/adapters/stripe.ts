import Stripe from "stripe";
import type { RevenueAdapter, RevenueData } from "../types";

export const stripeAdapter: RevenueAdapter = {
  platform: "stripe",

  async fetchRevenue({ access_token }): Promise<RevenueData> {
    const stripe = new Stripe(access_token!);

    const subscriptions = await stripe.subscriptions.list({
      status: "active",
      limit: 100,
    });

    let mrrCents = 0;
    for (const sub of subscriptions.data) {
      for (const item of sub.items.data) {
        const price = item.price;
        const amount = price.unit_amount ?? 0;
        const quantity = item.quantity ?? 1;
        if (price.recurring?.interval === "month") {
          mrrCents += amount * quantity;
        } else if (price.recurring?.interval === "year") {
          mrrCents += Math.round((amount * quantity) / 12);
        } else if (price.recurring?.interval === "week") {
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
      currency: "usd",
    };
  },
};
