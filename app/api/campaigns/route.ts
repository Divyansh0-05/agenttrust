import { NextResponse } from "next/server";
import { z } from "zod";

import { PLANS, getUserPlan } from "@/lib/plan-limits";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const createCampaignSchema = z.object({
  product_id: z.string().uuid(),
  name: z.string().trim().min(2, "Campaign name is required."),
  email_subject: z.string().trim().min(3, "Email subject is required."),
  email_body: z.string().trim().min(10, "Email body is required."),
  recipients_text: z.string().trim().min(3, "Add at least one recipient email."),
});

function normalizeRecipients(recipientsText: string) {
  const rawEntries = recipientsText
    .split(/[\n,;]/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  const recipients = rawEntries
    .map((entry) => {
      const [namePart, emailPart] = entry.includes("<")
        ? entry.split("<")
        : ["", entry];
      const email = emailPart.replace(">", "").trim().toLowerCase();
      const name = namePart.trim() || null;
      return { email, name };
    })
    .filter((recipient) =>
      z.string().email().safeParse(recipient.email).success,
    );

  const deduped = new Map<string, { email: string; name: string | null }>();
  recipients.forEach((recipient) => {
    if (!deduped.has(recipient.email)) {
      deduped.set(recipient.email, recipient);
    }
  });

  return Array.from(deduped.values());
}

async function resolveUserPlan(userId: string) {
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  const profilePlan = getUserPlan(profile);
  if (profilePlan !== "free") {
    return profilePlan;
  }

  const { data: subscription, error: subscriptionError } = await supabaseAdmin
    .from("subscriptions")
    .select("plan, status")
    .eq("user_id", userId)
    .in("status", ["active", "trialing"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subscriptionError) {
    throw new Error(subscriptionError.message);
  }

  if (
    subscription?.plan &&
    subscription.plan in PLANS
  ) {
    return subscription.plan as keyof typeof PLANS;
  }

  return profilePlan;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.warn("Campaign create denied: unauthenticated request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = createCampaignSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ?? "Invalid campaign input.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .select("id")
    .eq("id", parsed.data.product_id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (productError) {
    console.error("Campaign create product lookup failed", {
      userId: user.id,
      productId: parsed.data.product_id,
      error: productError.message,
    });
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  if (!product) {
    console.warn("Campaign create denied: product ownership mismatch", {
      userId: user.id,
      productId: parsed.data.product_id,
    });
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const recipients = normalizeRecipients(parsed.data.recipients_text);
  if (recipients.length === 0) {
    return NextResponse.json(
      { error: "No valid recipient emails found." },
      { status: 400 },
    );
  }

  let plan: keyof typeof PLANS;
  try {
    plan = await resolveUserPlan(user.id);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to resolve plan.";
    console.error("Campaign create plan lookup failed", {
      userId: user.id,
      productId: parsed.data.product_id,
      error: message,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (PLANS[plan].campaign_emails_per_month <= 0) {
    console.warn("Campaign create denied: plan restriction", {
      userId: user.id,
      productId: parsed.data.product_id,
      resolvedPlan: plan,
    });
    return NextResponse.json(
      { error: "Your current plan does not include email campaigns." },
      { status: 403 },
    );
  }

  const { data: campaign, error: campaignError } = await supabaseAdmin
    .from("campaigns")
    .insert({
      product_id: parsed.data.product_id,
      name: parsed.data.name,
      email_subject: parsed.data.email_subject,
      email_body: parsed.data.email_body,
      status: "draft",
    })
    .select("id")
    .single();

  if (campaignError || !campaign) {
    return NextResponse.json(
      { error: campaignError?.message ?? "Unable to create campaign." },
      { status: 500 },
    );
  }

  const recipientsPayload = recipients.map((recipient) => ({
    campaign_id: campaign.id,
    product_id: parsed.data.product_id,
    email: recipient.email,
    name: recipient.name,
    status: "pending",
  }));

  const { error: recipientsError } = await supabaseAdmin
    .from("campaign_recipients")
    .insert(recipientsPayload);

  if (recipientsError) {
    await supabaseAdmin.from("campaigns").delete().eq("id", campaign.id);
    return NextResponse.json({ error: recipientsError.message }, { status: 500 });
  }

  return NextResponse.json(
    { id: campaign.id, recipients_count: recipientsPayload.length },
    { status: 201 },
  );
}
