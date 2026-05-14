import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

async function hashForwardedFor(value: string) {
  const encoded = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}

async function getAgentupCount(productId: string) {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("agentup_count")
    .eq("id", productId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? data.agentup_count ?? 0 : null;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const currentCount = await getAgentupCount(id);

    if (currentCount === null) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const ipHash = await hashForwardedFor(
      request.headers.get("x-forwarded-for") ?? "",
    );

    if (user?.id) {
      const { data: existingUp, error: existingUpError } = await supabaseAdmin
        .from("agentups")
        .select("id")
        .eq("product_id", id)
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (existingUpError) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
      }

      if (existingUp) {
        return NextResponse.json({
          already_upped: true,
          agentup_count: currentCount,
        });
      }
    } else {
      const twentyFourHoursAgo = new Date(
        Date.now() - 24 * 60 * 60 * 1000,
      ).toISOString();
      const { data: existingUp, error: existingUpError } = await supabaseAdmin
        .from("agentups")
        .select("id")
        .eq("product_id", id)
        .eq("ip_hash", ipHash)
        .gt("created_at", twentyFourHoursAgo)
        .limit(1)
        .maybeSingle();

      if (existingUpError) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
      }

      if (existingUp) {
        return NextResponse.json({
          already_upped: true,
          agentup_count: currentCount,
        });
      }
    }

    const { error: insertError } = await supabaseAdmin
      .from("agentups")
      .insert({
        product_id: id,
        user_id: user?.id ?? null,
        ip_hash: ipHash,
      });

    if (insertError) {
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("products")
      .update({
        agentup_count: currentCount + 1,
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }

    const updatedCount = await getAgentupCount(id);

    if (updatedCount === null) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      already_upped: false,
      agentup_count: updatedCount,
    });
  } catch (error) {
    console.error("Agentup handler error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
