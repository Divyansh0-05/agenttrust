import { syncConnection } from "@/lib/revenue/sync";
import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  product_id: z.string().uuid(),
  platform: z.enum([
    "stripe",
    "lemon_squeezy",
    "revenuecat",
    "dodo",
    "paddle",
  ]),
  api_key: z.string().optional(),
  account_id: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { product_id, platform, api_key, account_id } = parsed.data;

  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("id", product_id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const { data: connection, error } = await supabase
    .from("revenue_connections")
    .upsert(
      {
        product_id,
        platform,
        api_key: api_key ?? null,
        account_id: account_id ?? null,
        status: "pending",
      },
      { onConflict: "product_id,platform" },
    )
    .select()
    .single();

  if (error || !connection) {
    return NextResponse.json(
      { error: "Failed to save connection" },
      { status: 500 },
    );
  }

  syncConnection(connection.id).catch(console.error);

  return NextResponse.json({ success: true, connection_id: connection.id });
}
