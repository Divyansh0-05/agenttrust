import { NextResponse } from "next/server";

import { PLANS, getUserPlan } from "@/lib/plan-limits";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function startOfCurrentMonthIso() {
  const now = new Date();
  now.setDate(1);
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: campaign, error: campaignError } = await supabaseAdmin
    .from("campaigns")
    .select("id, product_id, status")
    .eq("id", id)
    .maybeSingle();

  if (campaignError) {
    return NextResponse.json({ error: campaignError.message }, { status: 500 });
  }

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
  }

  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .select("id, owner_id")
    .eq("id", campaign.product_id)
    .maybeSingle();

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  if (!product || product.owner_id !== user.id) {
    return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const plan = getUserPlan(profile);
  const monthlyLimit = PLANS[plan].campaign_emails_per_month;
  if (monthlyLimit <= 0) {
    return NextResponse.json(
      { error: "Your current plan does not include email campaigns." },
      { status: 403 },
    );
  }

  const monthStart = startOfCurrentMonthIso();
  const { count: sentThisMonth, error: sentCountError } = await supabaseAdmin
    .from("campaign_recipients")
    .select("id", { count: "exact", head: true })
    .eq("product_id", campaign.product_id)
    .eq("status", "sent")
    .gte("sent_at", monthStart);

  if (sentCountError) {
    return NextResponse.json({ error: sentCountError.message }, { status: 500 });
  }

  const { count: pendingCount, error: pendingCountError } = await supabaseAdmin
    .from("campaign_recipients")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaign.id)
    .eq("status", "pending");

  if (pendingCountError) {
    return NextResponse.json({ error: pendingCountError.message }, { status: 500 });
  }

  const available = monthlyLimit - (sentThisMonth ?? 0);
  if ((pendingCount ?? 0) <= 0) {
    return NextResponse.json({ error: "No pending recipients to send." }, { status: 400 });
  }

  if (available <= 0) {
    return NextResponse.json(
      { error: "Monthly campaign email limit reached for your plan." },
      { status: 403 },
    );
  }

  const { error: updateError } = await supabaseAdmin
    .from("campaigns")
    .update({
      status: "queued",
    })
    .eq("id", campaign.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, queued_recipients: pendingCount ?? 0 });
}
