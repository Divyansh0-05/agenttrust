"use client";

import { useEffect, useState } from "react";

interface AgentUpButtonProps {
  productId: string;
  initialCount: number;
  initialUpped: boolean;
}

export function AgentUpButton({
  productId,
  initialCount,
  initialUpped,
}: AgentUpButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [upped, setUpped] = useState(initialUpped);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToastMessage("");
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  async function handleAgentUp() {
    if (upped) {
      setToastMessage("Already AgentUP'd today");
      return;
    }

    const previousCount = count;
    const previousUpped = upped;

    setLoading(true);

    try {
      const response = await fetch(`/api/products/${productId}/agentup`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("AgentUP request failed");
      }

      const data = await response.json();

      if (data.already_upped === true) {
        setToastMessage("Already AgentUP'd today");
        setUpped(true);
      } else {
        setCount(data.agentup_count);
        setUpped(true);
      }
    } catch {
      setToastMessage("Something went wrong");
      setCount(previousCount);
      setUpped(previousUpped);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-w-[52px] flex-col items-center gap-0.5">
      <span className="text-sm font-black leading-none text-white">{count}</span>
      <span className="text-[9px] font-black uppercase tracking-wide text-zinc-600">
        AgentUPs
      </span>
      <button
        type="button"
        disabled={loading}
        onClick={handleAgentUp}
        className={[
          upped
            ? "cursor-default rounded-md border border-orange-400/25 bg-orange-500/15 px-2 py-1 text-[10px] font-black text-orange-200"
            : "rounded-md border border-white/10 bg-white/[0.05] px-2 py-1 text-[10px] font-black text-white transition-all hover:border-orange-400/30 hover:bg-orange-500/15 active:scale-95",
          loading ? "opacity-50 cursor-not-allowed" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        UP
      </button>
      {toastMessage ? (
        <div className="fixed bottom-4 right-4 z-[70] rounded-lg border border-white/10 bg-zinc-950 px-4 py-2 text-xs text-white shadow-xl">
          {toastMessage}
        </div>
      ) : null}
    </div>
  );
}
