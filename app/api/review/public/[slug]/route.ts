import { NextResponse } from "next/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

const reviewSchema = z.object({
  reviewer_name: z.string().trim().min(1, "Name is required."),
  reviewer_role: z.string().trim().max(120).optional().or(z.literal("")),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(160).optional().or(z.literal("")),
  body: z.string().trim().min(50, "Review must be at least 50 characters."),
  use_case: z.string().trim().max(1000).optional().or(z.literal("")),
});

export async function POST(request: Request, context: RouteContext) {
  const { slug } = await context.params;
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

  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .select("id, allow_public_reviews")
    .eq("slug", slug)
    .eq("is_public", true)
    .maybeSingle();

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  if (product.allow_public_reviews === false) {
    return NextResponse.json(
      { error: "Public reviews are not currently open for this product." },
      { status: 403 },
    );
  }

  const { error } = await supabaseAdmin.from("reviews").insert({
    product_id: product.id,
    reviewer_name: parsed.data.reviewer_name,
    reviewer_role: parsed.data.reviewer_role || null,
    rating: parsed.data.rating,
    title: parsed.data.title || null,
    body: parsed.data.body,
    use_case: parsed.data.use_case || null,
    is_verified_customer: false,
    is_approved: true,
    source: "public_form",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
