import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { supabaseAdmin } from "@/lib/supabase/admin";

import { ReviewForm } from "../../review-form";

type PageProps = {
  params: Promise<{ token: string }>;
};

type TokenReviewData = {
  id: string;
  token: string;
  name: string | null;
  reviewed_at: string | null;
  products: {
    id: string;
    slug: string;
    name: string;
    tagline: string | null;
    logo_url: string | null;
    category: string | null;
    is_public: boolean | null;
  } | null;
};

function productInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

async function getRecipient(token: string) {
  const { data, error } = await supabaseAdmin
    .from("campaign_recipients")
    .select(
      "id, token, name, reviewed_at, products(id, slug, name, tagline, logo_url, category, is_public)",
    )
    .eq("token", token)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as TokenReviewData | null;
}

export default async function TokenReviewPage({ params }: PageProps) {
  const { token } = await params;
  const recipient = await getRecipient(token);
  const product = recipient?.products;

  if (!recipient || !product || product.is_public === false) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-10">
      <section className="mb-6 flex items-center gap-4">
        {product.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.logo_url}
            alt=""
            className="size-16 rounded-xl border object-cover"
          />
        ) : (
          <div className="flex size-16 shrink-0 items-center justify-center rounded-xl border bg-muted text-lg font-semibold">
            {productInitials(product.name)}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Review {product.name}
            </h1>
            {product.category ? (
              <Badge variant="outline">{product.category}</Badge>
            ) : null}
          </div>
          {product.tagline ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {product.tagline}
            </p>
          ) : null}
        </div>
      </section>

      {recipient.reviewed_at ? (
        <div className="rounded-lg border bg-muted/20 p-6 text-sm text-muted-foreground">
          This review link has already been used. Thank you.
        </div>
      ) : (
        <ReviewForm
          action={`/api/review/form/${recipient.token}`}
          initialName={recipient.name}
        />
      )}
    </main>
  );
}
