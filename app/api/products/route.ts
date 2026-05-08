import { NextResponse } from "next/server";
import { z } from "zod";

import { PLANS, getUserPlan } from "@/lib/plan-limits";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const LOGO_BUCKET = "product-logos";
const MAX_LOGO_SIZE = 2 * 1024 * 1024;
const LOGO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];

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

async function getUniqueSlug(name: string) {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const { data, error } = await supabaseAdmin
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

function fileExtension(file: File) {
  const nameExtension = file.name.split(".").pop()?.toLowerCase();

  if (nameExtension) {
    return nameExtension.replace(/[^a-z0-9]/g, "");
  }

  return file.type.split("/").pop()?.replace("svg+xml", "svg") ?? "png";
}

async function uploadLogo(userId: string, productSlug: string, logo: File) {
  if (logo.size === 0) {
    return null;
  }

  if (logo.size > MAX_LOGO_SIZE) {
    throw new Error("Logo must be 2MB or smaller.");
  }

  if (!LOGO_TYPES.includes(logo.type)) {
    throw new Error("Logo must be a JPG, PNG, WebP, or SVG image.");
  }

  const { error: bucketError } = await supabaseAdmin.storage.createBucket(LOGO_BUCKET, {
    public: true,
    fileSizeLimit: MAX_LOGO_SIZE,
    allowedMimeTypes: LOGO_TYPES,
  });

  if (
    bucketError &&
    !bucketError.message.toLowerCase().includes("already exists")
  ) {
    throw new Error(`Unable to prepare logo storage: ${bucketError.message}`);
  }

  const path = `${userId}/${productSlug}.${fileExtension(logo)}`;
  const { error } = await supabaseAdmin.storage
    .from(LOGO_BUCKET)
    .upload(path, logo, {
      contentType: logo.type,
      upsert: true,
    });

  if (error) {
    throw new Error(`Unable to upload logo: ${error.message}`);
  }

  const { data } = supabaseAdmin.storage.from(LOGO_BUCKET).getPublicUrl(path);

  return data.publicUrl;
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
      {
        error:
          parsed.error.issues[0]?.message ?? "Invalid product details.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  let userPlan = getUserPlan(profile);

  if (!profile) {
    const { error: insertProfileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: user.id,
        full_name: user.user_metadata.full_name ?? null,
        avatar_url: user.user_metadata.avatar_url ?? null,
        plan: "free",
      });

    if (insertProfileError) {
      return NextResponse.json(
        { error: `Unable to create profile: ${insertProfileError.message}` },
        { status: 500 },
      );
    }

    userPlan = "free";
  }

  const { count, error: countError } = await supabaseAdmin
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id);

  if (countError) {
    return NextResponse.json(
      { error: `Unable to check product limit: ${countError.message}` },
      { status: 500 },
    );
  }

  if ((count ?? 0) >= PLANS[userPlan].products) {
    return NextResponse.json(
      {
        error: `Your ${userPlan} plan allows ${PLANS[userPlan].products} product.`,
      },
      { status: 403 },
    );
  }

  try {
    const slug = await getUniqueSlug(parsed.data.name);
    const logo = formData.get("logo");
    const logoUrl = logo instanceof File ? await uploadLogo(user.id, slug, logo) : null;
    const { data: product, error } = await supabaseAdmin
      .from("products")
      .insert({
        owner_id: user.id,
        slug,
        name: parsed.data.name,
        website_url: parsed.data.website_url || null,
        category: parsed.data.category,
        tagline: parsed.data.tagline || null,
        description: parsed.data.description || null,
        logo_url: logoUrl,
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
