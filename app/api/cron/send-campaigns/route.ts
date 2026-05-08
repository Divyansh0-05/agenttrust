import { NextResponse } from "next/server";

import { PLANS, getUserPlan } from "@/lib/plan-limits";
import { sendReviewRequestEmail } from "@/lib/resend";
import { supabaseAdmin } from "@/lib/supabase/admin";

const BATCH_SIZE = 50;


function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function startOfCurrentMonthIso() {
  const now = new Date();
  now.setDate(1);
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

export async function GET(request: Request) {
  // Protected cron endpoint: requires Bearer token with CRON_SECRET.
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: queuedCampaigns, error: campaignError } = await supabaseAdmin
    .from("campaigns")
    .select("id, product_id, email_subject, email_body, status")
    .in("status", ["queued", "sending"])
    .order("created_at", { ascending: true })
    .limit(10);

  if (campaignError) {
    return NextResponse.json({ error: campaignError.message }, { status: 500 });
  }

  if (!queuedCampaigns || queuedCampaigns.length === 0) {
    return NextResponse.json({ processed: 0, sent: 0, failed: 0 });
  }

  let processed = 0;
  let sent = 0;
  let failed = 0;

  for (const campaign of queuedCampaigns) {
    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("id, name, owner_id")
      .eq("id", campaign.product_id)
      .maybeSingle();

    if (productError || !product) {
      failed += 1;
      continue;
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("plan")
      .eq("id", product.owner_id)
      .maybeSingle();

    const plan = getUserPlan(profile);
    const monthlyLimit = PLANS[plan].campaign_emails_per_month;
    if (monthlyLimit <= 0) {
      await supabaseAdmin
        .from("campaigns")
        .update({ status: "draft" })
        .eq("id", campaign.id);
      continue;
    }

    const { count: sentThisMonth } = await supabaseAdmin
      .from("campaign_recipients")
      .select("id", { count: "exact", head: true })
      .eq("product_id", campaign.product_id)
      .eq("status", "sent")
      .gte("sent_at", startOfCurrentMonthIso());

    const remainingQuota = monthlyLimit - (sentThisMonth ?? 0);
    if (remainingQuota <= 0) {
      continue;
    }

    const limit = Math.min(BATCH_SIZE, remainingQuota);
    const { data: recipients, error: recipientsError } = await supabaseAdmin
      .from("campaign_recipients")
      .select("id, email, name, token")
      .eq("campaign_id", campaign.id)
      .eq("status", "pending")
      .order("id", { ascending: true })
      .limit(limit);

    if (recipientsError || !recipients || recipients.length === 0) {
      const { count: pendingCount } = await supabaseAdmin
        .from("campaign_recipients")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", campaign.id)
        .eq("status", "pending");

      if ((pendingCount ?? 0) === 0) {
        await supabaseAdmin
          .from("campaigns")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", campaign.id);
      }
      continue;
    }

    await supabaseAdmin.from("campaigns").update({ status: "sending" }).eq("id", campaign.id);

    for (const recipient of recipients) {
      processed += 1;
      const reviewLink = `${appUrl()}/review/token/${recipient.token}`;

      try {
        await sendReviewRequestEmail({
          to: recipient.email,
          reviewerName: recipient.name,
          productName: product.name,
          subject: campaign.email_subject,
          body: campaign.email_body,
          reviewLink,
        });

        await supabaseAdmin
          .from("campaign_recipients")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", recipient.id);
        sent += 1;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to send campaign email.";
        await supabaseAdmin
          .from("campaign_recipients")
          .update({ status: "failed" })
          .eq("id", recipient.id);
        await supabaseAdmin
          .from("campaigns")
          .update({ status: "draft" })
          .eq("id", campaign.id);
        console.error("Campaign email send failed", {
          campaignId: campaign.id,
          recipientId: recipient.id,
          error: message,
        });
        failed += 1;
      }
    }

    const { count: pendingCount } = await supabaseAdmin
      .from("campaign_recipients")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaign.id)
      .eq("status", "pending");

    if ((pendingCount ?? 0) === 0) {
      await supabaseAdmin
        .from("campaigns")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", campaign.id);
    } else {
      await supabaseAdmin.from("campaigns").update({ status: "queued" }).eq("id", campaign.id);
    }

    const { count: sentCount } = await supabaseAdmin
      .from("campaign_recipients")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaign.id)
      .eq("status", "sent");

    await supabaseAdmin
      .from("campaigns")
      .update({ sent_count: sentCount ?? 0 })
      .eq("id", campaign.id);
  }

  return NextResponse.json({ processed, sent, failed });
}

