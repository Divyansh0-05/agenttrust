import { NextResponse } from "next/server";

import { dodoClient } from "@/lib/dodo";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type DodoPayments from "dodopayments";

const PRODUCT_TO_PLAN: Record<string, "starter" | "growth" | "scale"> = {
  [process.env.DODO_STARTER_PRODUCT_ID ?? ""]: "starter",
  [process.env.DODO_GROWTH_PRODUCT_ID ?? ""]: "growth",
  [process.env.DODO_SCALE_PRODUCT_ID ?? ""]: "scale",
};

function resolvePlan(productId: string | null | undefined) {
  if (!productId) return "free";
  return PRODUCT_TO_PLAN[productId] ?? "free";
}

async function upsertSubscriptionRecord(
  subscription: DodoPayments.Subscriptions.Subscription,
  fallbackUserId?: string | null,
) {
  const customerId = subscription.customer.customer_id;
  let profileId: string | null = null;

  const { data: profileByCustomer } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("dodo_customer_id", customerId)
    .maybeSingle();

  if (profileByCustomer) {
    profileId = profileByCustomer.id;
  } else if (fallbackUserId) {
    profileId = fallbackUserId;
    await supabaseAdmin
      .from("profiles")
      .update({ dodo_customer_id: customerId })
      .eq("id", fallbackUserId);
  }

  if (!profileId) {
    console.warn("Dodo webhook subscription ignored: no profile mapping", {
      subscriptionId: subscription.subscription_id,
      customerId,
    });
    return;
  }

  const mappedPlan = resolvePlan(subscription.product_id);
  const periodEnd = subscription.next_billing_date
    ? new Date(subscription.next_billing_date).toISOString()
    : null;

  await supabaseAdmin.from("subscriptions").upsert(
    {
      id: subscription.subscription_id,
      user_id: profileId,
      status: subscription.status,
      plan: mappedPlan,
      dodo_product_id: subscription.product_id,
      dodo_subscription_id: subscription.subscription_id,
      current_period_end: periodEnd,
      cancel_at_period_end: subscription.cancel_at_next_billing_date,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  await supabaseAdmin
    .from("profiles")
    .update({
      plan:
        subscription.status === "active" || subscription.status === "pending"
          ? mappedPlan
          : "free",
      dodo_customer_id: customerId,
    })
    .eq("id", profileId);
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signatureKey = process.env.DODO_PAYMENTS_WEBHOOK_SECRET;

  if (!signatureKey) {
    return NextResponse.json(
      { error: "DODO_PAYMENTS_WEBHOOK_SECRET is not configured." },
      { status: 500 },
    );
  }

  let event: DodoPayments.UnwrapWebhookEvent;
  try {
    event = dodoClient.webhooks.unwrap(rawBody, {
      headers: Object.fromEntries(request.headers.entries()),
      key: signatureKey,
    });
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  switch (event.type) {
    case "subscription.active":
    case "subscription.updated": {
      await upsertSubscriptionRecord(event.data);
      break;
    }
    case "subscription.failed":
    case "subscription.cancelled": {
      await upsertSubscriptionRecord(event.data);
      await supabaseAdmin
        .from("profiles")
        .update({ plan: "free" })
        .eq("dodo_customer_id", event.data.customer.customer_id);
      break;
    }
    case "payment.succeeded": {
      const metadata = event.data.metadata ?? {};
      const fallbackUserId =
        typeof metadata.user_id === "string" ? metadata.user_id : null;
      const customerId = event.data.customer?.customer_id ?? null;
      if (fallbackUserId && customerId) {
        await supabaseAdmin
          .from("profiles")
          .update({ dodo_customer_id: customerId })
          .eq("id", fallbackUserId);
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
