import { NextResponse } from "next/server";
import { z } from "zod";

import { dodoClient } from "@/lib/dodo";
import { createClient } from "@/lib/supabase/server";

const checkoutSchema = z.object({
  plan: z.enum(["starter", "growth", "scale"]),
});

const PLAN_TO_PRODUCT_ID: Record<"starter" | "growth" | "scale", string | undefined> = {
  starter: process.env.DODO_STARTER_PRODUCT_ID,
  growth: process.env.DODO_GROWTH_PRODUCT_ID,
  scale: process.env.DODO_SCALE_PRODUCT_ID,
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

  const productId = PLAN_TO_PRODUCT_ID[parsed.data.plan];
  if (!productId) {
    return NextResponse.json(
      { error: `Missing Dodo product ID for ${parsed.data.plan} plan.` },
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
    return_url: `${appUrl()}/dashboard/billing`,
    metadata: {
      user_id: user.id,
      plan: parsed.data.plan,
    },
  });

  if (!checkout.checkout_url) {
    return NextResponse.json({ error: "Unable to create checkout session." }, { status: 500 });
  }

  return NextResponse.json({ url: checkout.checkout_url });
}
