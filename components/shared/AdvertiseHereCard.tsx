"use client";

import { Megaphone } from "lucide-react";
import { useState } from "react";

type PromotionCadence = "weekly" | "monthly";

const OPTIONS: Array<{
  cadence: PromotionCadence;
  title: string;
  description: string;
}> = [
  {
    cadence: "weekly",
    title: "Weekly Promotion",
    description: "A short featured placement for launches and time-boxed pushes.",
  },
  {
    cadence: "monthly",
    title: "Monthly Promotion",
    description: "A longer sponsored run for sustained product discovery.",
  },
];

export default function AdvertiseHereCard() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<PromotionCadence | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(cadence: PromotionCadence) {
    setLoading(cadence);
    setError(null);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promotion: cadence }),
      });

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      const payload = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Unable to start checkout.");
      }

      window.location.href = payload.url;
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Unable to start checkout.",
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="relative flex min-h-[88px] flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-black px-3 py-2.5 text-center">
      <div className="mx-auto flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-zinc-500">
        <Megaphone className="size-4" aria-hidden />
      </div>
      <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
        Advertise Here
      </p>
      <p className="mt-1 text-[10px] leading-snug text-zinc-600">
        Promote your product and get featured on AgentTrust.
      </p>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="mt-1.5 inline-flex rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-semibold text-zinc-300 transition-colors hover:border-orange-400/30 hover:text-white"
        aria-expanded={open}
      >
        View options
      </button>

      {open ? (
        <div className="absolute bottom-full right-0 z-30 mb-2 w-64 rounded-lg border border-white/10 bg-zinc-950 p-3 text-left shadow-2xl">
          <p className="text-sm font-semibold text-white">Promotion slots</p>
          <div className="mt-3 space-y-2">
            {OPTIONS.map((option) => (
              <button
                key={option.cadence}
                type="button"
                onClick={() => startCheckout(option.cadence)}
                disabled={loading !== null}
                className="block w-full rounded-lg border border-white/10 bg-white/[0.04] p-3 text-left transition-all hover:border-orange-400/30 hover:bg-orange-500/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="block text-xs font-semibold text-white">
                  {option.title}
                </span>
                <span className="mt-1 block text-[11px] leading-snug text-zinc-500">
                  {loading === option.cadence ? "Starting checkout..." : option.description}
                </span>
              </button>
            ))}
          </div>
          {error ? <p className="mt-2 text-[11px] text-red-300">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
