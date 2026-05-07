import { NextResponse } from "next/server";
import { z } from "zod";

import { PLANS, getUserPlan } from "@/lib/plan-limits";
import { createClient } from "@/lib/supabase/server";

const productSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  website_url: z
    .string()
    .trim()
    .url("Enter a valid website URL.")
    .optional()
    .or(z.literal("")),
  category: z.string().trim().min(1, "Choose a category."),
  tagline: z.string().trim().max(140).optional().or(z.literal("")),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
});

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "product"
  );
}

async function getUniqueSlug(supabase: Awaited<ReturnType<typeof createClient>>, name: string) {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const { data, error } = await supabase
      .from("products")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return slug;
    }

    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    website_url: formData.get("website_url"),
    category: formData.get("category"),
    tagline: formData.get("tagline"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid product details.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const plan = getUserPlan(profile);
  const { count, error: countError } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  if ((count ?? 0) >= PLANS[plan].products) {
    return NextResponse.json(
      { error: `Your ${plan} plan allows ${PLANS[plan].products} product.` },
      { status: 403 },
    );
  }

  try {
    const slug = await getUniqueSlug(supabase, parsed.data.name);
    const { data: product, error } = await supabase
      .from("products")
      .insert({
        owner_id: user.id,
        slug,
        name: parsed.data.name,
        website_url: parsed.data.website_url || null,
        category: parsed.data.category,
        tagline: parsed.data.tagline || null,
        description: parsed.data.description || null,
        logo_url: null,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: product.id, slug }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create product.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
