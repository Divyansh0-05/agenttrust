import AdvertiseHereCard from "@/components/shared/AdvertiseHereCard";
import { createClient } from "@/lib/supabase/server";

interface SidebarAdsProps {
  side: "left" | "right";
  placement?: "desktop" | "mobile";
  showAdvertiseCta?: boolean;
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

interface MobileAdItem {
  id: string;
  href: string;
  name: string;
  logoUrl: string | null;
  label: string;
  external?: boolean;
}

function rankProduct(product: SidebarProduct): number {
  return (
    (product.agentup_count ?? 0) * 0.6 +
    (product.review_count ?? 0) * 0.3 +
    (product.trust_score ?? 0) * 0.1
  );
}

function LogoMark({
  name,
  logoUrl,
}: Readonly<{ name: string; logoUrl: string | null }>) {
  const initial = name.charAt(0).toUpperCase();

  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt=""
        width={44}
        height={44}
        className="mx-auto size-11 rounded-full bg-white object-cover ring-2 ring-gray-100"
      />
    );
  }

  return (
    <span
      aria-hidden
      className="mx-auto flex size-11 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-sm font-semibold text-gray-500"
    >
      {initial || "?"}
    </span>
  );
}

function ProductCard({ product }: Readonly<{ product: SidebarProduct }>) {
  const tagline = product.tagline ?? "Trusted product on AgentTrust";

  return (
    <a
      href={`/p/${product.slug}`}
      className="block rounded-xl border border-gray-200 bg-gray-50/90 p-3 text-center shadow-sm no-underline transition-all hover:border-indigo-200 hover:bg-white hover:shadow"
    >
      <LogoMark name={product.name} logoUrl={product.logo_url} />
      <p className="mt-2 line-clamp-2 text-xs font-semibold text-gray-900">
        {product.name}
      </p>
      <p
        className={`mt-1 line-clamp-3 text-[11px] leading-snug ${
          product.tagline ? "text-gray-600" : "text-gray-400"
        }`}
      >
        {tagline}
      </p>
      <div className="mt-2 flex items-center justify-center gap-2 text-[11px]">
        <span className="font-medium text-indigo-600">
          {product.agentup_count ?? 0} AgentUPs
        </span>
        <span className="text-gray-300" aria-hidden>
          /
        </span>
        <span className="text-gray-500">{product.review_count ?? 0} reviews</span>
      </div>
    </a>
  );
}

function PaidAdCard({ slot }: Readonly<{ slot: PaidAdSlot }>) {
  return (
    <a
      href={slot.advertiser_url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl border border-gray-200 bg-gray-50/90 p-3 text-center shadow-sm no-underline transition-all hover:border-indigo-200 hover:bg-white hover:shadow"
    >
      <LogoMark name={slot.advertiser_name} logoUrl={slot.logo_url} />
      <div className="mt-2 flex items-center justify-center gap-2">
        <p className="line-clamp-2 text-xs font-semibold text-gray-900">
          {slot.advertiser_name}
        </p>
        <span className="rounded-full border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-indigo-700">
          Ad
        </span>
      </div>
      {slot.tagline ? (
        <p className="mt-1 line-clamp-3 text-[11px] leading-snug text-gray-600">
          {slot.tagline}
        </p>
      ) : null}
      <span className="mt-2 inline-block text-xs font-medium text-indigo-600 underline-offset-2 hover:text-indigo-800 hover:underline">
        Visit sponsor
      </span>
    </a>
  );
}

function PlacementNote() {
  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3 text-center shadow-sm">
      <p className="text-xs font-semibold text-indigo-800">
        Earn free placement
      </p>
      <p className="mt-1 text-[11px] leading-snug text-indigo-700">
        Reviews, AgentUPs, and trust activity help products appear here.
      </p>
    </div>
  );
}

function MobileLogo({
  name,
  logoUrl,
}: Readonly<{ name: string; logoUrl: string | null }>) {
  const initial = name.charAt(0).toUpperCase();

  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt=""
        width={30}
        height={30}
        className="size-[30px] shrink-0 rounded-full border border-gray-100 bg-white object-cover dark:border-slate-700"
      />
    );
  }

  return (
    <span
      aria-hidden
      className="flex size-[30px] shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-[11px] font-bold text-gray-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
    >
      {initial || "?"}
    </span>
  );
}

function MobileTickerCard({ item }: Readonly<{ item: MobileAdItem }>) {
  return (
    <a
      href={item.href}
      target={item.external ? "_blank" : undefined}
      rel={item.external ? "noopener noreferrer" : undefined}
      className="flex h-10 w-[180px] shrink-0 items-center gap-2 rounded-full border border-gray-200 bg-white px-2.5 shadow-sm no-underline transition-colors hover:border-indigo-200 dark:border-slate-700 dark:bg-slate-950"
    >
      <MobileLogo name={item.name} logoUrl={item.logoUrl} />
      <span className="min-w-0">
        <span className="block truncate text-[12px] font-semibold leading-tight text-gray-900 dark:text-slate-100">
          {item.name}
        </span>
        <span className="block truncate text-[10px] font-medium leading-tight text-indigo-600 dark:text-indigo-300">
          {item.label}
        </span>
      </span>
    </a>
  );
}

function MobileTickerRail({
  side,
  items,
}: Readonly<{ side: "left" | "right"; items: MobileAdItem[] }>) {
  if (items.length === 0) {
    return null;
  }

  const tickerItems = [...items, ...items, ...items];

  return (
    <div className="mobile-ad-rail w-full overflow-hidden">
      <div
        className={`mobile-ad-track flex w-max gap-3 px-3 ${
          side === "right" ? "mobile-ad-track-slow" : ""
        }`}
      >
        {tickerItems.map((item, index) => (
          <MobileTickerCard key={`${item.id}-${index}`} item={item} />
        ))}
      </div>
      <style>{`
        @keyframes agenttrust-mobile-ad-marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-33.333%, 0, 0); }
        }

        .mobile-ad-track {
          animation: agenttrust-mobile-ad-marquee 42s linear infinite;
          will-change: transform;
        }

        .mobile-ad-track-slow {
          animation-duration: 48s;
        }

        .mobile-ad-rail:hover .mobile-ad-track {
          animation-play-state: paused;
        }

        @media (prefers-reduced-motion: reduce) {
          .mobile-ad-track {
            animation-duration: 0.01ms;
            animation-iteration-count: 1;
          }
        }
      `}</style>
    </div>
  );
}

export async function SidebarAds({
  side,
  placement = "desktop",
  showAdvertiseCta = false,
}: SidebarAdsProps) {
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
    .slice(0, placement === "mobile" ? 8 : 10);
  const slots = rankedProducts
    .filter((_, index) => (side === "left" ? index % 2 === 0 : index % 2 === 1))
    .slice(0, placement === "mobile" ? 4 : 5);
  const paidSlot = ((paidSlots ?? [])[0] as PaidAdSlot | undefined) ?? null;

  if (placement === "mobile") {
    const mobileItems: MobileAdItem[] = [
      ...(paidSlot && side === "left"
        ? [
            {
              id: `paid-${paidSlot.id}`,
              href: paidSlot.advertiser_url,
              name: paidSlot.advertiser_name,
              logoUrl: paidSlot.logo_url,
              label: paidSlot.tagline ?? "Sponsored",
              external: true,
            },
          ]
        : []),
      ...slots.map((product) => ({
        id: product.id,
        href: `/p/${product.slug}`,
        name: product.name,
        logoUrl: product.logo_url,
        label:
          product.tagline ??
          `${product.agentup_count ?? 0} AgentUPs / ${product.review_count ?? 0} reviews`,
      })),
    ];

    return <MobileTickerRail side={side} items={mobileItems} />;
  }

  return (
    <div className="w-full">
      <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
        {side === "left" ? "Top Products" : "Trending"}
      </p>
      <div className="mt-3 flex flex-col gap-3">
        {paidSlot && side === "left" ? <PaidAdCard slot={paidSlot} /> : null}
        {slots.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
        {placement === "desktop" ? <PlacementNote /> : null}
        {showAdvertiseCta ? <AdvertiseHereCard /> : null}
      </div>
    </div>
  );
}

export default SidebarAds;
