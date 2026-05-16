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
    <div className="relative rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 text-center shadow-sm">
      <div className="mx-auto flex size-11 items-center justify-center rounded-full border border-indigo-200 bg-white text-indigo-600">
        <Megaphone className="size-5" aria-hidden />
      </div>
      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-indigo-800">
        Advertise Here
      </p>
      <p className="mt-1 text-[11px] leading-snug text-gray-600">
        Promote your product and get featured on AgentTrust.
      </p>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="mt-2 inline-flex rounded-lg border border-indigo-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition-colors hover:border-indigo-300 hover:text-indigo-900"
        aria-expanded={open}
      >
        View options
      </button>

      {open ? (
        <div className="absolute bottom-full right-0 z-30 mb-2 w-64 rounded-xl border border-gray-200 bg-white p-3 text-left shadow-lg">
          <p className="text-sm font-semibold text-gray-900">Promotion slots</p>
          <div className="mt-3 space-y-2">
            {OPTIONS.map((option) => (
              <button
                key={option.cadence}
                type="button"
                onClick={() => startCheckout(option.cadence)}
                disabled={loading !== null}
                className="block w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-left transition-all hover:border-indigo-200 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="block text-xs font-semibold text-gray-900">
                  {option.title}
                </span>
                <span className="mt-1 block text-[11px] leading-snug text-gray-500">
                  {loading === option.cadence ? "Starting checkout..." : option.description}
                </span>
              </button>
            ))}
          </div>
          {error ? <p className="mt-2 text-[11px] text-red-600">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
