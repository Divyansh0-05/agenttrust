import { createClient } from "@/lib/supabase/server";

interface SidebarAdsProps {
  side: "left" | "right";
}

interface SidebarProduct {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  logo_url: string | null;
  avg_rating: number | null;
  review_count: number | null;
  agentup_count: number | null;
  trust_score: number | null;
}

interface PaidAdSlot {
  id: string;
  advertiser_name: string;
  advertiser_url: string;
  logo_url: string | null;
  tagline: string | null;
}

function getLogoColor(name: string): string {
  const firstLetter = name.charAt(0).toUpperCase();

  if ("ABCDE".includes(firstLetter)) {
    return "bg-violet-500 text-white";
  }

  if ("FGHIJ".includes(firstLetter)) {
    return "bg-emerald-500 text-white";
  }

  if ("KLMNO".includes(firstLetter)) {
    return "bg-orange-500 text-white";
  }

  if ("PQRST".includes(firstLetter)) {
    return "bg-blue-500 text-white";
  }

  return "bg-pink-500 text-white";
}

function rankProduct(product: SidebarProduct): number {
  return (
    (product.agentup_count ?? 0) * 0.6 +
    (product.review_count ?? 0) * 0.3 +
    (product.trust_score ?? 0) * 0.1
  );
}

function ProductCard({ product }: { product: SidebarProduct }) {
  const tagline = product.tagline ?? "No description yet";
  const rating = Math.round(product.avg_rating ?? 0);

  return (
    <a
      href={`/p/${product.slug}`}
      className="block bg-white rounded-xl border border-gray-100 p-3 hover:border-violet-200 hover:shadow-sm transition-all cursor-pointer no-underline"
    >
      <div className="flex items-center gap-2">
        {product.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.logo_url}
            alt={product.name}
            className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 ${getLogoColor(
              product.name,
            )}`}
          >
            {product.name.charAt(0).toUpperCase() || "?"}
          </div>
        )}
        <span className="text-xs font-semibold text-gray-800 flex-1 min-w-0 truncate leading-tight">
          {product.name}
        </span>
        <span className="text-[10px] text-amber-400 flex-shrink-0">
          {"★".repeat(rating)}
        </span>
      </div>

      <p
        className={`text-[10px] line-clamp-1 leading-snug mt-1 ${
          product.tagline ? "text-gray-400" : "italic text-gray-300"
        }`}
      >
        {tagline}
      </p>

      <div className="flex items-center mt-2">
        <span className="text-[10px] text-violet-600 font-medium flex items-center gap-0.5">
          ▲ {product.agentup_count ?? 0} AgentUPs
        </span>
        <span className="text-[10px] text-gray-400 ml-auto">
          {product.review_count ?? 0} reviews
        </span>
      </div>
    </a>
  );
}

function PaidAdCard({ slot }: { slot: PaidAdSlot }) {
  return (
    <a
      href={slot.advertiser_url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white rounded-xl border border-amber-200 p-3 hover:border-amber-300 transition-all cursor-pointer no-underline"
    >
      <div className="flex items-center gap-2">
        {slot.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={slot.logo_url}
            alt={slot.advertiser_name}
            className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {slot.advertiser_name.charAt(0).toUpperCase() || "?"}
          </div>
        )}
        <span className="text-xs font-semibold text-gray-800 flex-1 min-w-0 truncate">
          {slot.advertiser_name}
        </span>
        <span className="text-[9px] bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-full flex-shrink-0 font-medium">
          Ad
        </span>
      </div>

      <p className="text-[10px] text-gray-400 line-clamp-1 mt-1">
        {slot.tagline ?? ""}
      </p>

      <span className="text-[10px] text-amber-600 font-medium mt-2 block">
        Sponsored placement ↗
      </span>
    </a>
  );
}

function PromoCard() {
  return (
    <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 text-center mt-1">
      <p className="text-[11px] font-semibold text-violet-800">
        🏆 Earn free placement
      </p>
      <p className="text-[10px] text-violet-600 mt-1 leading-snug">
        Get more reviews and AgentUPs to appear here
      </p>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a
        href="/dashboard/products/new"
        className="text-[10px] text-violet-700 underline mt-2 block hover:text-violet-900 transition-colors"
      >
        Submit your product →
      </a>
    </div>
  );
}

export async function SidebarAds({ side }: SidebarAdsProps) {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const [{ data: products }, { data: paidSlots }] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, slug, name, tagline, logo_url, avg_rating, review_count, agentup_count, trust_score",
      )
      .eq("is_public", true),
    supabase
      .from("ad_slots")
      .select("*")
      .eq("is_active", true)
      .or(`ends_at.is.null,ends_at.gt.${now}`)
      .limit(1),
  ]);

  const rankedProducts = ((products ?? []) as SidebarProduct[])
    .sort((a, b) => rankProduct(b) - rankProduct(a))
    .slice(0, 10);
  const slots = rankedProducts.filter((_, index) =>
    side === "left" ? index % 2 === 0 : index % 2 === 1,
  );
  const paidSlot = ((paidSlots ?? [])[0] as PaidAdSlot | undefined) ?? null;

  return (
    <div className="flex flex-col gap-2 w-full">
      <p className="text-[9px] text-gray-400 uppercase tracking-widest px-1">
        {side === "left" ? "Top Products" : "Trending"}
      </p>

      {slots.map((product, index) =>
        index === 0 && side === "left" && paidSlot ? (
          <PaidAdCard key="paid" slot={paidSlot} />
        ) : (
          <ProductCard key={product.id} product={product} />
        ),
      )}

      <PromoCard />
    </div>
  );
}

export default SidebarAds;
