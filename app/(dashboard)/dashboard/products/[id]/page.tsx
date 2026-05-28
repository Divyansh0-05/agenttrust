"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProductData {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  category: string | null;
  website_url: string | null;
  logo_url: string | null;
  is_public: boolean | null;
  allow_public_reviews: boolean | null;
  revenue_is_public: boolean | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  "SaaS",
  "Mobile App",
  "AI Tool",
  "Developer Tool",
  "Open Source",
  "Other",
];

const TABS = (id: string) => [
  { label: "Edit", href: `/dashboard/products/${id}` },
  { label: "Reviews", href: `/dashboard/products/${id}/reviews` },
  { label: "Campaigns", href: `/dashboard/products/${id}/campaigns` },
  { label: "Verify Revenue", href: `/dashboard/products/${id}/verify` },
  { label: "Widget", href: `/dashboard/products/${id}/widget` },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function productInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "P";
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function Toggle({
  id,
  checked,
  onChange,
}: {
  id: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${checked ? "bg-foreground" : "bg-input"
        }`}
    >
      <span
        className={`pointer-events-none block h-3.5 w-3.5 rounded-full bg-background shadow-sm ring-0 transition-transform ${checked ? "translate-x-4" : "translate-x-0"
          }`}
      />
    </button>
  );
}

// ─── Toast ───────────────────────────────────────────────────────────────────

type ToastKind = "success" | "error";

function Toast({
  message,
  kind,
  onClose,
}: {
  message: string;
  kind: ToastKind;
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      role="alert"
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg transition-all ${kind === "success"
          ? "border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200"
          : "border-destructive/30 bg-destructive/10 text-destructive"
        }`}
    >
      <span
        className={`flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${kind === "success"
            ? "bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200"
            : "bg-destructive/20 text-destructive"
          }`}
      >
        {kind === "success" ? "✓" : "!"}
      </span>
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-2 opacity-60 hover:opacity-100"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────

function DeleteModal({
  productName,
  onClose,
}: {
  productName: string;
  onClose: () => void;
}) {
  const [confirmText, setConfirmText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const isMatch = confirmText === productName;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
      aria-labelledby="delete-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 mx-4 w-full max-w-md rounded-xl bg-card ring-1 ring-foreground/10 p-6 shadow-2xl">
        <div className="mb-1 flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-destructive/15 text-destructive">
            <svg
              className="size-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </span>
          <h2
            id="delete-modal-title"
            className="text-base font-semibold text-foreground"
          >
            Delete product
          </h2>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          This action is{" "}
          <span className="font-semibold text-foreground">permanent</span> and
          cannot be undone. All reviews, campaigns, and data will be erased.
        </p>

        <div className="mb-5 space-y-2">
          <Label htmlFor="confirm-delete-input">
            Type{" "}
            <span className="rounded bg-muted px-1 font-mono text-xs text-foreground">
              {productName}
            </span>{" "}
            to confirm
          </Label>
          <Input
            ref={inputRef}
            id="confirm-delete-input"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={productName}
            autoComplete="off"
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!isMatch}
            className={`transition-opacity ${isMatch ? "opacity-100" : "opacity-40"}`}
            onClick={() => {
              // TODO: implement delete API call
              onClose();
            }}
          >
            Delete product
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function FieldSkeleton({ wide = false }: { wide?: boolean }) {
  return (
    <div
      className={`h-8 animate-pulse rounded-lg bg-muted ${wide ? "w-full" : "w-2/3"}`}
    />
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProductEditPage() {
  const params = useParams();
  const pathname = usePathname();
  const productId = params.id as string;

  const tabs = TABS(productId);
  const isActive = (href: string) => pathname === href;

  // ── State ──
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  // Visibility toggles
  const [isPublic, setIsPublic] = useState(true);
  const [allowPublicReviews, setAllowPublicReviews] = useState(true);
  const [revenueIsPublic, setRevenueIsPublic] = useState(false);

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    kind: ToastKind;
  } | null>(null);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ── Fetch product ──
  useEffect(() => {
    async function fetchProduct() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("products")
          .select(
            "id, name, slug, tagline, description, category, website_url, logo_url, is_public, allow_public_reviews, revenue_is_public"
          )
          .eq("id", productId)
          .maybeSingle();

        if (error) throw new Error(error.message);
        if (!data) throw new Error("Product not found.");

        const p = data as ProductData;
        setProduct(p);
        setName(p.name ?? "");
        setSlug(p.slug ?? "");
        setTagline(p.tagline ?? "");
        setDescription(p.description ?? "");
        setCategory(p.category ?? "");
        setWebsiteUrl(p.website_url ?? "");
        setIsPublic(p.is_public ?? true);
        setAllowPublicReviews(p.allow_public_reviews ?? true);
        setRevenueIsPublic(p.revenue_is_public ?? false);
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : "Unknown error.");
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [productId]);

  const dismissToast = useCallback(() => setToast(null), []);

  // ── Fake save (frontend only) ──
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    // TODO: implement PATCH /api/products/[id]
    await new Promise((r) => setTimeout(r, 800));
    setIsSaving(false);
    setToast({ message: "Changes saved successfully.", kind: "success" });
  }

  // ── Slug preview ──
  const slugPreview = slug
    ? `agenttrust.com/p/${slug}`
    : "agenttrust.com/p/your-slug";

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <>
      <main className="flex-1">
        {/* ── Tab bar ── */}
        <div className="border-b bg-background">
          <div className="mx-auto max-w-5xl px-4">
            <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Product sections">
              {tabs.map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${isActive(tab.href)
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {tab.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="mx-auto max-w-5xl px-4 py-8">
          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">
              Product settings
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Update your product details, visibility, and branding.
            </p>
          </div>

          {/* Fetch error */}
          {fetchError && (
            <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {fetchError}
            </div>
          )}

          <form onSubmit={handleSave} noValidate>
            <div className="space-y-6">
              {/* ══ 1. BASIC INFO ══════════════════════════════════════════════ */}
              <Card>
                <CardHeader className="border-b">
                  <CardTitle>Basic info</CardTitle>
                  <CardDescription>
                    The public-facing identity of your product.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    {/* Name */}
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="product-name">Product name</Label>
                      {loading ? (
                        <FieldSkeleton wide />
                      ) : (
                        <Input
                          id="product-name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="My Awesome Product"
                          required
                          disabled={isSaving}
                        />
                      )}
                    </div>

                    {/* Slug */}
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="product-slug">Slug</Label>
                      {loading ? (
                        <FieldSkeleton wide />
                      ) : (
                        <>
                          <Input
                            id="product-slug"
                            value={slug}
                            onChange={(e) =>
                              setSlug(
                                e.target.value
                                  .toLowerCase()
                                  .replace(/[^a-z0-9-]/g, "-")
                                  .replace(/-+/g, "-")
                                  .replace(/^-|-$/g, "")
                              )
                            }
                            placeholder="my-awesome-product"
                            disabled={isSaving}
                          />
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <svg
                              className="size-3 shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                              />
                            </svg>
                            <span className="font-mono">{slugPreview}</span>
                          </p>
                        </>
                      )}
                    </div>

                    {/* Tagline */}
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="product-tagline">Tagline</Label>
                      {loading ? (
                        <FieldSkeleton />
                      ) : (
                        <Input
                          id="product-tagline"
                          value={tagline}
                          onChange={(e) => setTagline(e.target.value)}
                          maxLength={140}
                          placeholder="A short promise for your product"
                          disabled={isSaving}
                        />
                      )}
                      {!loading && (
                        <p className="text-xs text-muted-foreground text-right">
                          {tagline.length}/140
                        </p>
                      )}
                    </div>

                    {/* Description */}
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="product-description">Description</Label>
                      {loading ? (
                        <div className="h-24 animate-pulse rounded-lg bg-muted" />
                      ) : (
                        <Textarea
                          id="product-description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={5}
                          placeholder="What does it help customers do?"
                          disabled={isSaving}
                        />
                      )}
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                      <Label htmlFor="product-category">Category</Label>
                      {loading ? (
                        <FieldSkeleton />
                      ) : (
                        <select
                          id="product-category"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          disabled={isSaving}
                          className="h-8 w-full rounded-lg border border-input bg-background px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Select a category</option>
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Website URL */}
                    <div className="space-y-2">
                      <Label htmlFor="product-website">Website URL</Label>
                      {loading ? (
                        <FieldSkeleton />
                      ) : (
                        <Input
                          id="product-website"
                          type="url"
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                          placeholder="https://example.com"
                          disabled={isSaving}
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ══ 2. LOGO ════════════════════════════════════════════════════ */}
              <Card>
                <CardHeader className="border-b">
                  <CardTitle>Logo</CardTitle>
                  <CardDescription>
                    Shown on your public profile and leaderboard.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-5">
                  <div className="flex items-center gap-5">
                    {/* Logo preview */}
                    <div className="shrink-0">
                      {loading ? (
                        <div className="size-20 animate-pulse rounded-xl bg-muted" />
                      ) : product?.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.logo_url}
                          alt={name}
                          className="size-20 rounded-xl border object-cover"
                        />
                      ) : (
                        <div
                          className="flex size-20 items-center justify-center rounded-xl border bg-muted text-2xl font-semibold text-muted-foreground"
                          aria-label="Product logo placeholder"
                        >
                          {name ? productInitial(name) : "P"}
                        </div>
                      )}
                    </div>

                    {/* Upload controls */}
                    <div className="min-w-0 space-y-2">
                      <p className="text-sm font-medium">Product logo</p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, or WebP. Recommended 256×256 px or larger.
                      </p>
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor="logo-upload"
                          className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-input bg-background px-3 text-sm font-medium transition-colors hover:bg-muted ${isSaving
                              ? "pointer-events-none opacity-50"
                              : ""
                            }`}
                        >
                          <svg
                            className="size-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                            />
                          </svg>
                          Upload logo
                          <input
                            id="logo-upload"
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            disabled={isSaving}
                            onChange={() => {
                              // TODO: handle file upload
                            }}
                          />
                        </label>
                        {product?.logo_url && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive"
                            disabled={isSaving}
                            onClick={() => {
                              // TODO: remove logo
                            }}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ══ 3. VISIBILITY SETTINGS ═════════════════════════════════════ */}
              <Card>
                <CardHeader className="border-b">
                  <CardTitle>Visibility settings</CardTitle>
                  <CardDescription>
                    Control what the public can see about your product.
                  </CardDescription>
                </CardHeader>
                <CardContent className="divide-y pt-1">
                  {/* Public profile */}
                  <div className="flex items-center justify-between gap-4 py-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Public profile</p>
                      <p className="text-xs text-muted-foreground">
                        Show your product on the AgentTrust leaderboard and make
                        it discoverable.
                      </p>
                    </div>
                    {loading ? (
                      <div className="h-5 w-9 animate-pulse rounded-full bg-muted" />
                    ) : (
                      <Toggle
                        id="toggle-is-public"
                        checked={isPublic}
                        onChange={setIsPublic}
                      />
                    )}
                  </div>

                  {/* Allow public reviews */}
                  <div className="flex items-center justify-between gap-4 py-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Allow public reviews</p>
                      <p className="text-xs text-muted-foreground">
                        Let visitors submit reviews through your public profile
                        page.
                      </p>
                    </div>
                    {loading ? (
                      <div className="h-5 w-9 animate-pulse rounded-full bg-muted" />
                    ) : (
                      <Toggle
                        id="toggle-allow-reviews"
                        checked={allowPublicReviews}
                        onChange={setAllowPublicReviews}
                      />
                    )}
                  </div>

                  {/* Show revenue */}
                  <div className="flex items-center justify-between gap-4 py-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        Show revenue on profile
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Display verified MRR and revenue data publicly as a
                        trust signal.
                      </p>
                    </div>
                    {loading ? (
                      <div className="h-5 w-9 animate-pulse rounded-full bg-muted" />
                    ) : (
                      <Toggle
                        id="toggle-revenue-public"
                        checked={revenueIsPublic}
                        onChange={setRevenueIsPublic}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* ══ 4. SAVE BUTTON ═════════════════════════════════════════════ */}
              <div className="flex justify-end">
                <Button
                  id="save-product-btn"
                  type="submit"
                  disabled={isSaving || loading || !!fetchError}
                  className="min-w-[120px]"
                >
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="size-3.5 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Saving…
                    </span>
                  ) : (
                    "Save changes"
                  )}
                </Button>
              </div>

              {/* ══ 5. DANGER ZONE ════════════════════════════════════════════ */}
              <div
                className="rounded-xl border-2 border-destructive/30 bg-destructive/5 p-5"
                aria-label="Danger zone"
              >
                <h2 className="mb-1 text-sm font-semibold text-destructive">
                  Danger zone
                </h2>
                <p className="mb-4 text-xs text-muted-foreground">
                  Once you delete this product, all associated reviews,
                  campaigns, and data will be permanently removed.
                </p>
                <Button
                  id="delete-product-btn"
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={loading || !!fetchError}
                  onClick={() => setShowDeleteModal(true)}
                >
                  Delete product
                </Button>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* ── Delete confirmation modal ── */}
      {showDeleteModal && name && (
        <DeleteModal
          productName={name}
          onClose={() => setShowDeleteModal(false)}
        />
      )}

      {/* ── Toast notification ── */}
      {toast && (
        <Toast
          message={toast.message}
          kind={toast.kind}
          onClose={dismissToast}
        />
      )}
    </>
  );
}
