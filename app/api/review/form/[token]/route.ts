import { NextResponse } from "next/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ token: string }>;
};

type RecipientWithProduct = {
  id: string;
  campaign_id: string;
  product_id: string;
  email: string;
  name: string | null;
  token: string;
  status: string | null;
  reviewed_at: string | null;
  products: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    is_public: boolean | null;
  } | null;
};

const reviewSchema = z.object({
  reviewer_name: z.string().trim().min(1, "Name is required."),
  reviewer_role: z.string().trim().max(120).optional().or(z.literal("")),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(160).optional().or(z.literal("")),
  body: z.string().trim().min(50, "Review must be at least 50 characters."),
  use_case: z.string().trim().max(1000).optional().or(z.literal("")),
});

async function getRecipient(token: string) {
  const { data, error } = await supabaseAdmin
    .from("campaign_recipients")
    .select(
      "id, campaign_id, product_id, email, name, token, status, reviewed_at, products(id, name, slug, logo_url, is_public)",
    )
    .eq("token", token)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as RecipientWithProduct | null;
}

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;
  const recipient = await getRecipient(token);

  if (!recipient || !recipient.products || recipient.products.is_public === false) {
    return NextResponse.json({ error: "Review link not found." }, { status: 404 });
  }

  if (recipient.reviewed_at) {
    return NextResponse.json(
      { error: "This review link has already been used." },
      { status: 409 },
    );
  }

  return NextResponse.json({
    recipient: {
      name: recipient.name,
      email: recipient.email,
    },
    product: recipient.products,
  });
}

export async function POST(request: Request, context: RouteContext) {
  const { token } = await context.params;
  const formData = await request.formData();
  const parsed = reviewSchema.safeParse({
    reviewer_name: formData.get("reviewer_name"),
    reviewer_role: formData.get("reviewer_role"),
    rating: formData.get("rating"),
    title: formData.get("title"),
    body: formData.get("body"),
    use_case: formData.get("use_case"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid review.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const recipient = await getRecipient(token);

  if (!recipient || !recipient.products || recipient.products.is_public === false) {
    return NextResponse.json({ error: "Review link not found." }, { status: 404 });
  }

  if (recipient.reviewed_at) {
    return NextResponse.json(
      { error: "This review link has already been used." },
      { status: 409 },
    );
  }

  const { error: insertError } = await supabaseAdmin.from("reviews").insert({
    product_id: recipient.product_id,
    reviewer_name: parsed.data.reviewer_name,
    reviewer_email: recipient.email,
    reviewer_role: parsed.data.reviewer_role || null,
    rating: parsed.data.rating,
    title: parsed.data.title || null,
    body: parsed.data.body,
    use_case: parsed.data.use_case || null,
    is_verified_customer: true,
    is_approved: true,
    source: "email_campaign",
    campaign_id: recipient.campaign_id,
    token: recipient.token,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { error: updateError } = await supabaseAdmin
    .from("campaign_recipients")
    .update({
      status: "reviewed",
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", recipient.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
