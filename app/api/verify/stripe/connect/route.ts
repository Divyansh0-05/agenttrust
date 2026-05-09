import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("product_id");
  if (!productId) {
    return NextResponse.json(
      { error: "product_id required" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const clientId = process.env.STRIPE_CONNECT_CLIENT_ID;
  const redirectUri = process.env.STRIPE_CONNECT_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return NextResponse.redirect(
      new URL(`/dashboard/products/${productId}/verify`, request.url),
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    scope: "read_only",
    redirect_uri: redirectUri,
    state: productId,
  });

  return NextResponse.redirect(
    `https://connect.stripe.com/oauth/authorize?${params.toString()}`,
  );
}
