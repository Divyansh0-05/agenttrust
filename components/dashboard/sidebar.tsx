"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

interface NavItem {
  href: string;
  label: string;
}

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
}

interface DashboardSidebarProps {
  nav: NavItem[];
  user: {
    email?: string;
  };
  profile: Profile | null;
}

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getProductIdFromPathname(pathname: string): string | null {
  const match = pathname.match(/\/dashboard\/products\/([^\/]+)/);
  return match ? match[1] : null;
}

export default function DashboardSidebar({
  nav,
  user,
  profile,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const productId = getProductIdFromPathname(pathname);
  const isProductPage = productId && !pathname.includes("/new");

  const displayName = profile?.full_name?.trim() || user.email || "User";
  const initials = getInitials(displayName || "U");

  const productSubLinks: NavItem[] = isProductPage
    ? [
        {
          href: "/dashboard/products",
          label: "← Back to products",
        },
        {
          href: `/dashboard/products/${productId}`,
          label: "Edit product",
        },
        {
          href: `/dashboard/products/${productId}/reviews`,
          label: "Reviews",
        },
        {
          href: `/dashboard/products/${productId}/campaigns`,
          label: "Campaigns",
        },
        {
          href: `/dashboard/products/${productId}/verify`,
          label: "Verify revenue",
        },
        {
          href: `/dashboard/products/${productId}/widget`,
          label: "Widget",
        },
      ]
    : [];

  const isActive = (href: string) => {
    return pathname === href;
  };

  const isMobileNavLink = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      {/* Mobile Navigation */}
      <details
        id="mobile-dashboard-nav"
        className="group fixed inset-x-0 top-0 z-40 border-b bg-background md:hidden"
      >
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-semibold">AgentTrust</p>
            <p className="text-xs text-muted-foreground">Dashboard</p>
          </div>
          <span className="inline-flex size-9 items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
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
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
            <span className="sr-only">Toggle dashboard navigation</span>
          </span>
        </summary>
        <div className="border-t p-3">
          <nav className="space-y-1">
            {nav.map((item) => (
              <Link
                key={`mobile-${item.label}-${item.href}`}
                href={item.href}
                data-mobile-nav-link="true"
                className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                  isMobileNavLink(item.href)
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {isProductPage && (
              <>
                <div className="my-2 border-t" />
                {productSubLinks.map((item) => (
                  <Link
                    key={`mobile-${item.label}-${item.href}`}
                    href={item.href}
                    data-mobile-nav-link="true"
                    className={`block rounded-md px-3 py-2 pl-6 text-sm transition-colors ${
                      isMobileNavLink(item.href)
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </>
            )}
          </nav>
          <div className="mt-3 border-t pt-3">
            <div className="flex items-center gap-3 rounded-md bg-muted/60 p-3">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="size-9 rounded-full border object-cover"
                />
              ) : (
                <div className="flex size-9 items-center justify-center rounded-full border bg-background text-xs font-medium">
                  {initials || "U"}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </details>

      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-background md:flex md:flex-col">
        <div className="border-b px-5 py-4">
          <h1 className="text-lg font-semibold">AgentTrust</h1>
          <p className="text-xs text-muted-foreground">Dashboard</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => (
            <Link
              key={`${item.label}-${item.href}`}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                isActive(item.href)
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}

          {/* Product Sub-Links */}
          {isProductPage && productSubLinks.length > 0 && (
            <>
              <div className="my-2 border-t" />
              {productSubLinks.map((item) => (
                <Link
                  key={`${item.label}-${item.href}`}
                  href={item.href}
                  className={`block rounded-md px-3 py-2 pl-6 text-sm transition-colors ${
                    isActive(item.href)
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </nav>
        <div className="border-t p-4">
          <div className="flex items-center gap-3 rounded-md bg-muted/60 p-3">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt=""
                className="size-9 rounded-full border object-cover"
              />
            ) : (
              <div className="flex size-9 items-center justify-center rounded-full border bg-background text-xs font-medium">
                {initials || "U"}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Close mobile nav when link is clicked */}
      <script
        id="mobile-dashboard-nav-close"
        dangerouslySetInnerHTML={{
          __html: `(() => {
            if (typeof document === 'undefined') return;
            document.addEventListener("click", (event) => {
              const target = event.target;
              if (!(target instanceof Element)) return;
              const link = target.closest('[data-mobile-nav-link="true"]');
              if (!link) return;
              const drawer = document.getElementById("mobile-dashboard-nav");
              if (drawer instanceof HTMLDetailsElement) {
                drawer.open = false;
              }
            });
          })();`,
        }}
      />
    </>
  );
}
