import Link from "next/link";
import Script from "next/script";
import { redirect } from "next/navigation";
import { Menu } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import DashboardSidebar from "@/components/dashboard/sidebar";

const DASHBOARD_NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/products", label: "Products" },
  { href: "/dashboard/billing", label: "Billing" },
];

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const displayName = profile?.full_name?.trim() || user.email || "User";
  const initials = getInitials(displayName || "U");

  return (
    <div className="flex min-h-screen bg-muted/30">
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
            <Menu className="size-4" aria-hidden="true" />
            <span className="sr-only">Toggle dashboard navigation</span>
          </span>
        </summary>
        <div className="border-t p-3">
          <nav className="space-y-1">
            {DASHBOARD_NAV.map((item) => (
              <Link
                key={`mobile-${item.label}-${item.href}`}
                href={item.href}
                data-mobile-nav-link="true"
                className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
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
      <DashboardSidebar nav={DASHBOARD_NAV} user={user} profile={profile} />
      <div className="flex min-w-0 flex-1 flex-col pt-14 md:pt-0">{children}</div>
      <Script id="mobile-dashboard-nav-close" strategy="afterInteractive">
        {`(() => {
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
        })();`}
      </Script>
    </div>
  );
}
