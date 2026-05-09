import { syncConnection } from "@/lib/revenue/sync";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const productId = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code || !productId) {
    const path = productId
      ? `/dashboard/products/${productId}/verify?stripe_error=true`
      : "/dashboard/products?stripe_error=true";
    return NextResponse.redirect(new URL(path, request.url));
  }

  const stripe = new Stripe(secretKey);
  const response = await stripe.oauth.token({
    grant_type: "authorization_code",
    code,
  });
  const supabase = await createClient();

  const { data: connection } = await supabase
    .from("revenue_connections")
    .upsert(
      {
        product_id: productId,
        platform: "stripe",
        access_token: response.access_token,
        account_id: response.stripe_user_id,
        status: "pending",
      },
      { onConflict: "product_id,platform" },
    )
    .select()
    .single();

  await supabase
    .from("products")
    .update({ stripe_verified: true })
    .eq("id", productId);

  if (connection) syncConnection(connection.id).catch(console.error);

  return NextResponse.redirect(
    new URL(
      `/dashboard/products/${productId}/verify?stripe_connected=true`,
      request.url,
    ),
  );
}
