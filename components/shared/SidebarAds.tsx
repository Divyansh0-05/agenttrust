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
        className="mx-auto size-9 rounded-lg bg-zinc-950 object-cover ring-1 ring-white/10"
      />
    );
  }

  return (
    <span
      aria-hidden
      className="mx-auto flex size-9 items-center justify-center rounded-lg border border-white/10 bg-black/35 text-sm font-semibold text-white"
    >
      {initial || "?"}
    </span>
  );
}

function ProductCard({ product }: Readonly<{ product: SidebarProduct }>) {
  const tagline = product.tagline ?? "Trusted product on AgentTrust";
  const tint =
    product.name.charCodeAt(0) % 4 === 0
      ? "bg-[#2c1730]"
      : product.name.charCodeAt(0) % 4 === 1
        ? "bg-[#123312]"
        : product.name.charCodeAt(0) % 4 === 2
          ? "bg-[#1a1b3b]"
          : "bg-[#202020]";

  return (
    <a
      href={`/p/${product.slug}`}
      className={`flex min-h-[118px] flex-col items-center justify-center rounded-xl border border-white/10 px-3 py-3 text-center no-underline shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all hover:-translate-y-0.5 hover:border-orange-400/25 hover:brightness-125 ${tint}`}
    >
      <LogoMark name={product.name} logoUrl={product.logo_url} />
      <p className="mt-2 line-clamp-1 text-sm font-semibold text-white">
        {product.name}
      </p>
      <p
        className={`mt-1 line-clamp-2 text-[11px] leading-snug ${
          product.tagline ? "text-zinc-300" : "text-zinc-500"
        }`}
      >
        {tagline}
      </p>
      <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px]">
        <span className="font-semibold text-cyan-200">
          {product.agentup_count ?? 0} AgentUPs
        </span>
        <span className="text-white/25" aria-hidden>
          /
        </span>
        <span className="text-zinc-400">{product.review_count ?? 0} reviews</span>
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
      className="flex min-h-[118px] flex-col items-center justify-center rounded-xl border border-white/10 bg-[#171f39] px-3 py-3 text-center no-underline shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all hover:-translate-y-0.5 hover:border-orange-400/25 hover:brightness-125"
    >
      <LogoMark name={slot.advertiser_name} logoUrl={slot.logo_url} />
      <div className="mt-2 flex items-center justify-center gap-2">
        <p className="line-clamp-1 text-sm font-semibold text-white">
          {slot.advertiser_name}
        </p>
        <span className="rounded-full border border-orange-400/25 bg-orange-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-orange-300">
          Ad
        </span>
      </div>
      {slot.tagline ? (
        <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-zinc-300">
          {slot.tagline}
        </p>
      ) : null}
      <span className="mt-2 inline-block text-[10px] font-semibold text-cyan-200 underline-offset-2 hover:text-white hover:underline">
        Visit sponsor
      </span>
    </a>
  );
}

function PlacementNote() {
  return (
    <div className="flex min-h-[88px] flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-black px-3 py-3 text-center">
      <p className="text-xs font-semibold text-zinc-500">
        Earn free placement
      </p>
      <p className="mt-1 text-[10px] leading-snug text-zinc-600">
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
        className="size-[30px] shrink-0 rounded-lg border border-white/10 bg-zinc-950 object-cover"
      />
    );
  }

  return (
    <span
      aria-hidden
      className="flex size-[30px] shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-[11px] font-black text-white"
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
      className="flex h-10 w-[180px] shrink-0 items-center gap-2 rounded-full border border-white/10 bg-zinc-950 px-2.5 shadow-sm no-underline transition-colors hover:border-cyan-300/30"
    >
      <MobileLogo name={item.name} logoUrl={item.logoUrl} />
      <span className="min-w-0">
        <span className="block truncate text-[12px] font-semibold leading-tight text-white">
          {item.name}
        </span>
        <span className="block truncate text-[10px] font-semibold leading-tight text-zinc-400">
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
  const baseSlots = rankedProducts
    .filter((_, index) => (side === "left" ? index % 2 === 0 : index % 2 === 1))
    .slice(0, placement === "mobile" ? 4 : 5);
  const paidSlot = ((paidSlots ?? [])[0] as PaidAdSlot | undefined) ?? null;
  const slots =
    placement === "desktop" && paidSlot && side === "left"
      ? baseSlots.slice(0, 4)
      : baseSlots;

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
    <div className="w-full bg-black px-2 py-2">
      <div className="flex flex-col gap-2">
        {paidSlot && side === "left" ? <PaidAdCard slot={paidSlot} /> : null}
        {slots.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
        {placement === "desktop" &&
        !showAdvertiseCta &&
        !(paidSlot && side === "left") &&
        slots.length < 5 ? (
          <PlacementNote />
        ) : null}
        {showAdvertiseCta ? <AdvertiseHereCard /> : null}
      </div>
    </div>
  );
}

export default SidebarAds;
