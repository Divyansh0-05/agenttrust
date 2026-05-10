"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useParams } from "next/navigation";

function ProductDetailPage() {
  const params = useParams();
  const pathname = usePathname();
  const productId = params.id as string;

  const tabs = [
    { label: "Edit", href: `/dashboard/products/${productId}` },
    { label: "Reviews", href: `/dashboard/products/${productId}/reviews` },
    { label: "Campaigns", href: `/dashboard/products/${productId}/campaigns` },
    { label: "Verify Revenue", href: `/dashboard/products/${productId}/verify` },
    { label: "Widget", href: `/dashboard/products/${productId}/widget` },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <main className="flex-1">
      <div className="border-b">
        <div className="mx-auto max-w-5xl px-4">
          {/* Tab Navigation */}
          <nav className="flex gap-1 -mb-px overflow-x-auto">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive(tab.href)
                    ? "border-b-2 border-foreground text-foreground"
                    : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-muted-foreground">
          Product content will be loaded here based on the selected tab.
        </p>
      </div>
    </main>
  );
}

export default ProductDetailPage;
