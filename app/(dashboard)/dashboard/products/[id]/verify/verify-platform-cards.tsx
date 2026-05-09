"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import type { ActiveConnectionView, RevenueVerifyPlatform } from "./verify-types";

const VERIFY_PLATFORMS: Array<{
  key: RevenueVerifyPlatform;
  label: string;
  initials: string;
  logoClass: string;
}> = [
  { key: "stripe", label: "Stripe", initials: "S", logoClass: "bg-[#635BFF]" },
  {
    key: "lemon_squeezy",
    label: "Lemon Squeezy",
    initials: "LS",
    logoClass: "bg-amber-400",
  },
  {
    key: "revenuecat",
    label: "RevenueCat",
    initials: "RC",
    logoClass: "bg-rose-500",
  },
  { key: "dodo", label: "Dodo", initials: "D", logoClass: "bg-emerald-500" },
  { key: "paddle", label: "Paddle", initials: "P", logoClass: "bg-sky-500" },
];

function formatMoneyFromCents(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  } catch {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  }
}

function formatRelativeSynced(iso: string | null) {
  if (!iso) return "Not synced yet";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "Not synced yet";
  const mins = Math.floor((Date.now() - then) / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function VerifyPlatformCards({
  productId,
  connectedMap,
  stripeOAuthAvailable,
}: Readonly<{
  productId: string;
  connectedMap: Partial<Record<RevenueVerifyPlatform, ActiveConnectionView>>;
  stripeOAuthAvailable: boolean;
}>) {
  const router = useRouter();
  const [disconnectingKey, setDisconnectingKey] = useState<
    RevenueVerifyPlatform | null
  >(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectingKey, setConnectingKey] = useState<
    RevenueVerifyPlatform | null
  >(null);

  async function disconnect(platform: RevenueVerifyPlatform) {
    const row = connectedMap[platform];
    if (!row) return;

    const confirmMsg = `Disconnect ${VERIFY_PLATFORMS.find((p) => p.key === platform)?.label ?? platform}? Revenue from this platform will stop updating on your profile.`;
    if (!window.confirm(confirmMsg)) return;

    setConnectError(null);
    setDisconnectingKey(platform);

    try {
      const res = await fetch("/api/verify/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connection_id: row.id }),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        setConnectError(data.error ?? "Could not disconnect. Try again.");
        return;
      }

      router.refresh();
    } finally {
      setDisconnectingKey(null);
    }
  }

  async function connectApiPlatform(
    platform: RevenueVerifyPlatform,
    body: Record<string, string>,
  ) {
    setConnectingKey(platform);
    setConnectError(null);

    try {
      const res = await fetch("/api/verify/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        setConnectError(
          typeof data.error === "string"
            ? data.error
            : "Could not connect. Check your credentials and try again.",
        );
        return;
      }

      router.refresh();
    } finally {
      setConnectingKey(null);
    }
  }

  function onCredentialSubmit(
    platform: RevenueVerifyPlatform,
    needsProjectId: boolean,
  ) {
    return (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = event.currentTarget;
      const apiKeyRaw = (
        form.elements.namedItem("api_key") as HTMLInputElement | null
      )?.value?.trim();

      if (needsProjectId) {
        const projectId =
          (
            form.elements.namedItem("account_id") as HTMLInputElement | null
          )?.value?.trim() ?? "";
        if (!projectId) {
          setConnectError("Project ID is required.");
          return;
        }
        if (!apiKeyRaw) {
          setConnectError("Secret API key is required.");
          return;
        }
        void connectApiPlatform(platform, {
          product_id: productId,
          platform,
          account_id: projectId,
          api_key: apiKeyRaw,
        });
        return;
      }

      if (!apiKeyRaw) {
        setConnectError("API key is required.");
        return;
      }

      void connectApiPlatform(platform, {
        product_id: productId,
        platform,
        api_key: apiKeyRaw,
      });
    };
  }

  return (
    <div className="space-y-4">
      {connectError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {connectError}
        </div>
      ) : null}

      <div className="grid gap-4">
        {VERIFY_PLATFORMS.map((p) => {
          const active = connectedMap[p.key];
          const isConnected = Boolean(active);

          return (
            <Card key={p.key} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "flex size-11 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white",
                        p.logoClass,
                      )}
                      aria-hidden
                    >
                      {p.initials}
                    </span>
                    <div>
                      <CardTitle className="text-base font-semibold">
                        {p.label}
                      </CardTitle>
                      {p.key === "revenuecat" ? (
                        <CardDescription className="mt-0.5">
                          iOS / Android subscription metrics
                        </CardDescription>
                      ) : null}
                    </div>
                  </div>

                  {isConnected ? (
                    <div className="flex shrink-0 items-center gap-2 sm:mt-1">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300">
                        <CheckCircle2
                          className="size-3.5 shrink-0"
                          aria-hidden
                        />
                        Connected
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        disabled={disconnectingKey === p.key}
                        onClick={() => void disconnect(p.key)}
                      >
                        {disconnectingKey === p.key
                          ? "Disconnecting…"
                          : "Disconnect"}
                      </Button>
                    </div>
                  ) : null}
                </div>
              </CardHeader>

              <CardContent className="border-t pt-4">
                {isConnected && active ? (
                  <dl className="grid gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-muted-foreground">MRR</dt>
                      <dd className="font-medium tabular-nums">
                        {formatMoneyFromCents(
                          active.mrr ?? 0,
                          active.currency ?? "usd",
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Customers</dt>
                      <dd className="font-medium tabular-nums">
                        {(active.customer_count ?? 0).toLocaleString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Last synced</dt>
                      <dd className="font-medium">
                        {formatRelativeSynced(active.last_synced_at)}
                      </dd>
                    </div>
                  </dl>
                ) : p.key === "stripe" ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                    <div className="min-w-0 space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Connect via Stripe OAuth (read-only). We cannot charge you
                        or move funds through this link.
                      </p>
                      {!stripeOAuthAvailable ? (
                        <p className="text-sm text-muted-foreground">
                          Stripe Connect onboarding is currently unavailable.
                        </p>
                      ) : null}
                    </div>
                    {stripeOAuthAvailable ? (
                      <Link
                        href={`/api/verify/stripe/connect?product_id=${encodeURIComponent(productId)}`}
                        className={cn(
                          buttonVariants({
                            className: "w-full shrink-0 sm:w-auto",
                          }),
                        )}
                      >
                        Connect Stripe
                      </Link>
                    ) : (
                      <Button
                        type="button"
                        disabled
                        className="w-full shrink-0 cursor-not-allowed sm:w-auto"
                      >
                        Connect Stripe
                      </Button>
                    )}
                  </div>
                ) : (
                  <form
                    className="space-y-4"
                    onSubmit={onCredentialSubmit(
                      p.key,
                      p.key === "revenuecat",
                    )}
                  >
                    <p className="text-xs text-muted-foreground">
                      {p.key === "lemon_squeezy"
                        ? "Get at dashboard.lemonsqueezy.com → Settings → API"
                        : p.key === "revenuecat"
                          ? "Find both at app.revenuecat.com → Project Settings → API Keys"
                          : p.key === "dodo"
                            ? "Get at dashboard.dodopayments.com → Settings → API"
                            : "Get at vendors.paddle.com → Developer Tools → Authentication"}
                    </p>
                    {p.key === "revenuecat" ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor={`${p.key}-account_id`}>Project ID</Label>
                          <Input
                            id={`${p.key}-account_id`}
                            name="account_id"
                            autoComplete="off"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`${p.key}-api_key`}>Secret API key</Label>
                          <Input
                            id={`${p.key}-api_key`}
                            name="api_key"
                            type="password"
                            autoComplete="off"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor={`${p.key}-api_key`}>API key</Label>
                        <Input
                          id={`${p.key}-api_key`}
                          name="api_key"
                          type="password"
                          autoComplete="off"
                          placeholder="Paste your secret key"
                        />
                      </div>
                    )}
                    <Button
                      type="submit"
                      disabled={connectingKey === p.key}
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      {connectingKey === p.key ? "Connecting…" : "Connect"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
