import { NextResponse } from "next/server";
import { z } from "zod";

import { dodoClient } from "@/lib/dodo";
import { createClient } from "@/lib/supabase/server";

const checkoutSchema = z.union([
  z.object({
    plan: z.enum(["starter", "growth", "scale"]),
    promotion: z.never().optional(),
  }),
  z.object({
    promotion: z.enum(["weekly", "monthly"]),
    plan: z.never().optional(),
  }),
]);

const PLAN_TO_PRODUCT_ID: Record<"starter" | "growth" | "scale", string | undefined> = {
  starter: process.env.DODO_STARTER_PRODUCT_ID,
  growth: process.env.DODO_GROWTH_PRODUCT_ID,
  scale: process.env.DODO_SCALE_PRODUCT_ID,
};

const PROMOTION_TO_PRODUCT_ID: Record<"weekly" | "monthly", string | undefined> = {
  weekly: process.env.DODO_PROMOTION_WEEKLY_PRODUCT_ID,
  monthly: process.env.DODO_PROMOTION_MONTHLY_PRODUCT_ID,
};

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = checkoutSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid checkout input.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const checkoutInput = parsed.data;
  const isPlanCheckout = "plan" in checkoutInput && checkoutInput.plan !== undefined;
  const productId = isPlanCheckout
    ? PLAN_TO_PRODUCT_ID[checkoutInput.plan]
    : PROMOTION_TO_PRODUCT_ID[checkoutInput.promotion];
  const productLabel = isPlanCheckout
    ? `${checkoutInput.plan} plan`
    : `${checkoutInput.promotion} promotion`;

  if (!productId) {
    return NextResponse.json(
      { error: `Missing Dodo product ID for ${productLabel}.` },
      { status: 500 },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, dodo_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  const checkout = await dodoClient.checkoutSessions.create({
    product_cart: [{ product_id: productId, quantity: 1 }],
    customer: profile?.dodo_customer_id
      ? { customer_id: profile.dodo_customer_id }
      : {
          email: user.email ?? "",
          name: profile?.full_name ?? user.user_metadata.full_name ?? "AgentTrust User",
        },
    return_url: isPlanCheckout ? `${appUrl()}/dashboard/billing` : `${appUrl()}/leaderboard`,
    metadata: {
      user_id: user.id,
      ...(isPlanCheckout
        ? { plan: checkoutInput.plan }
        : { promotion: checkoutInput.promotion }),
    },
  });

  if (!checkout.checkout_url) {
    return NextResponse.json({ error: "Unable to create checkout session." }, { status: 500 });
  }

  return NextResponse.json({ url: checkout.checkout_url });
}
