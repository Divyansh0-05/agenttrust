"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type BillingActionsProps = {
  currentPlan: "free" | "starter" | "growth" | "scale";
  hasActiveSubscription: boolean;
};

export function BillingActions({
  currentPlan,
  hasActiveSubscription,
}: BillingActionsProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [isManaging, setIsManaging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(plan: "starter" | "growth" | "scale") {
    setError(null);
    setLoadingPlan(plan);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        setError(data.error ?? "Unable to start checkout.");
        setLoadingPlan(null);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
      setLoadingPlan(null);
    }
  }

  function openPortal() {
    setError(null);
    setIsManaging(true);
    window.location.href = "/api/billing/portal";
  }

  const plans: Array<{
    id: "free" | "starter" | "growth" | "scale";
    name: string;
    price: string;
    description: string;
    cta: string;
    featured?: boolean;
  }> = [
    {
      id: "free",
      name: "Free",
      price: "$0/mo",
      description: "Public profile and basic trust presence.",
      cta: "Current plan",
    },
    {
      id: "starter",
      name: "Starter",
      price: "$19/mo",
      description: "Review campaigns and one product workspace.",
      cta: "Upgrade to Starter",
    },
    {
      id: "growth",
      name: "Growth",
      price: "$49/mo",
      description: "Most popular for growing SaaS teams.",
      cta: "Upgrade to Growth",
      featured: true,
    },
    {
      id: "scale",
      name: "Scale",
      price: "$99/mo",
      description: "Expanded limits and advanced trust workflows.",
      cta: "Upgrade to Scale",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          return (
            <div
              key={plan.id}
              className={`rounded-lg border p-4 ${plan.featured ? "border-primary" : ""}`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{plan.name}</p>
                {plan.featured ? (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    Most popular
                  </span>
                ) : null}
              </div>
              <p className="text-2xl font-semibold">{plan.price}</p>
              <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
              {plan.id === "free" ? (
                <Button type="button" variant="outline" disabled className="mt-4 w-full">
                  {isCurrent ? plan.cta : "Downgrade via support"}
                </Button>
              ) : (
                (() => {
                  const paidPlan = plan.id as "starter" | "growth" | "scale";
                  return (
                <Button
                  type="button"
                  variant={isCurrent ? "outline" : "default"}
                  disabled={isCurrent || loadingPlan === plan.id}
                  className="mt-4 w-full"
                  onClick={() => startCheckout(paidPlan)}
                >
                  {loadingPlan === plan.id
                    ? "Redirecting..."
                    : isCurrent
                      ? "Current plan"
                      : plan.cta}
                </Button>
                  );
                })()
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">
          Manage billing details, invoices, and cancellation in Dodo customer portal.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-3"
          onClick={openPortal}
          disabled={!hasActiveSubscription || isManaging}
        >
          {isManaging ? "Opening..." : "Manage subscription"}
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
