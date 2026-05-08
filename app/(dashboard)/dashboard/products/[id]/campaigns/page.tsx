import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { CampaignManager } from "./campaign-manager";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type CampaignRow = {
  id: string;
  name: string;
  status: string | null;
  sent_count: number | null;
  created_at: string | null;
};

export default async function ProductCampaignsPage(context: RouteContext) {
  const { id } = await context.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, name")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (productError) {
    throw new Error(productError.message);
  }

  if (!product) {
    redirect("/dashboard/products");
  }

  const { data: campaigns, error: campaignsError } = await supabase
    .from("campaigns")
    .select("id, name, status, sent_count, created_at")
    .eq("product_id", product.id)
    .order("created_at", { ascending: false });

  if (campaignsError) {
    throw new Error(campaignsError.message);
  }

  const rows = (campaigns ?? []) as CampaignRow[];
  const campaignStats = await Promise.all(
    rows.map(async (campaign) => {
      const [pendingResult, reviewedResult] = await Promise.all([
        supabase
          .from("campaign_recipients")
          .select("id", { count: "exact", head: true })
          .eq("campaign_id", campaign.id)
          .eq("status", "pending"),
        supabase
          .from("campaign_recipients")
          .select("id", { count: "exact", head: true })
          .eq("campaign_id", campaign.id)
          .not("reviewed_at", "is", null),
      ]);

      return {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status ?? "draft",
        sent_count: campaign.sent_count ?? 0,
        pending_count: pendingResult.count ?? 0,
        reviewed_count: reviewedResult.count ?? 0,
        created_at: campaign.created_at,
      };
    }),
  );

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Email campaigns</h1>
        <p className="text-sm text-muted-foreground">
          Send review requests for {product.name} and track response stats.
        </p>
      </div>

      <CampaignManager productId={product.id} campaigns={campaignStats} />
    </main>
  );
}
