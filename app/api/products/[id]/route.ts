import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// ─── Constants ────────────────────────────────────────────────────────────────

const VALID_CATEGORIES = new Set([
  "SaaS",
  "Mobile App",
  "AI Tool",
  "Developer Tool",
  "Open Source",
  "Other",
]);

// ─── Validation schema ────────────────────────────────────────────────────────
//
// All fields are optional — only explicitly provided fields are applied.
// Unknown fields are stripped by zod's .strict() equivalent (we use .strip() by default).

const patchSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters.")
      .max(120, "Name must be 120 characters or fewer.")
      .optional(),

    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug may only contain lowercase letters, numbers, and hyphens.",
      )
      .min(2, "Slug must be at least 2 characters.")
      .max(80, "Slug must be 80 characters or fewer.")
      .optional(),

    tagline: z
      .string()
      .trim()
      .max(140, "Tagline must be 140 characters or fewer.")
      .optional()
      .nullable(),

    description: z
      .string()
      .trim()
      .max(2000, "Description must be 2000 characters or fewer.")
      .optional()
      .nullable(),

    category: z
      .string()
      .trim()
      .refine((v) => VALID_CATEGORIES.has(v), { message: "Invalid category." })
      .optional()
      .nullable(),

    website_url: z
      .string()
      .trim()
      .url("Enter a valid website URL (include https://).")
      .max(500)
      .optional()
      .nullable()
      .or(z.literal("").transform(() => null)),

    // logo_url: either a valid https URL, an empty string (→ null), or null (remove logo)
    logo_url: z
      .string()
      .trim()
      .url("logo_url must be a valid URL.")
      .max(1000)
      .optional()
      .nullable()
      .or(z.literal("").transform(() => null)),

    is_public: z.boolean().optional(),

    allow_public_reviews: z.boolean().optional(),

    revenue_is_public: z.boolean().optional(),
  })
  .strict(); // Reject any keys not listed above

type PatchPayload = z.infer<typeof patchSchema>;

// ─── Slug uniqueness check ────────────────────────────────────────────────────

async function isSlugTaken(slug: string, excludeProductId: string) {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("id")
    .eq("slug", slug)
    .neq("id", excludeProductId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data !== null;
}

// ─── Build safe update object ─────────────────────────────────────────────────
//
// Only include fields that were explicitly present in the validated payload.
// This prevents accidental null-overwrites for fields the client did not touch.

function buildUpdate(parsed: PatchPayload): Record<string, unknown> {
  const update: Record<string, unknown> = {};

  if (parsed.name !== undefined) update.name = parsed.name;
  if (parsed.slug !== undefined) update.slug = parsed.slug;

  // Nullable text fields — null means "clear the value"
  if ("tagline" in parsed) update.tagline = parsed.tagline ?? null;
  if ("description" in parsed) update.description = parsed.description ?? null;
  if ("category" in parsed) update.category = parsed.category ?? null;
  if ("website_url" in parsed) update.website_url = parsed.website_url ?? null;
  if ("logo_url" in parsed) update.logo_url = parsed.logo_url ?? null;

  // Boolean toggles
  if (parsed.is_public !== undefined) update.is_public = parsed.is_public;
  if (parsed.allow_public_reviews !== undefined)
    update.allow_public_reviews = parsed.allow_public_reviews;
  if (parsed.revenue_is_public !== undefined)
    update.revenue_is_public = parsed.revenue_is_public;

  return update;
}

// ─── PATCH /api/products/[id] ─────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: productId } = await context.params;

    // ── 1. Authenticate ──────────────────────────────────────────────────────
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // ── 2. Parse & validate body ─────────────────────────────────────────────
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Request body must be valid JSON." },
        { status: 400 },
      );
    }

    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ?? "Invalid request payload.",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    // Reject empty patches
    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json(
        { error: "No fields provided to update." },
        { status: 400 },
      );
    }

    // ── 3. Ownership check ───────────────────────────────────────────────────
    //
    // Use admin client so RLS doesn't hide the row if is_public = false.
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("products")
      .select("id, owner_id, slug, name")
      .eq("id", productId)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json(
        { error: `Failed to look up product: ${fetchError.message}` },
        { status: 500 },
      );
    }

    if (!existing) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    if (existing.owner_id !== user.id) {
      // Return 404 rather than 403 to avoid leaking product existence to non-owners.
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    // ── 4. Slug uniqueness ───────────────────────────────────────────────────
    if (parsed.data.slug !== undefined) {
      let taken: boolean;
      try {
        taken = await isSlugTaken(parsed.data.slug, productId);
      } catch (err) {
        return NextResponse.json(
          {
            error:
              err instanceof Error ? err.message : "Failed to validate slug.",
          },
          { status: 500 },
        );
      }

      if (taken) {
        return NextResponse.json(
          { error: "That slug is already in use. Please choose another." },
          { status: 409 },
        );
      }
    }

    // ── 5. Build and apply safe partial update ───────────────────────────────
    const update = buildUpdate(parsed.data);

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("products")
      .update(update)
      .eq("id", productId)
      .select(
        "id, name, slug, tagline, description, category, website_url, logo_url, is_public, allow_public_reviews, revenue_is_public, updated_at",
      )
      .single();

    if (updateError) {
      // Postgres unique constraint on slug
      if (
        updateError.code === "23505" &&
        updateError.message.includes("slug")
      ) {
        return NextResponse.json(
          { error: "That slug is already in use. Please choose another." },
          { status: 409 },
        );
      }

      return NextResponse.json(
        { error: `Update failed: ${updateError.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({ product: updated }, { status: 200 });
  } catch (err) {
    console.error("[PATCH /api/products/[id]]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
