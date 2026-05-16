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
    <div className="flex flex-col items-center gap-0.5 min-width: 52px">
      <span className="text-lg font-semibold text-gray-800">{count}</span>
      <span className="text-[10px] text-gray-400 uppercase tracking-wide">
        AgentUPs
      </span>
      <button
        type="button"
        disabled={loading}
        onClick={handleAgentUp}
        className={[
          upped
            ? "bg-violet-600 text-white text-xs font-medium px-2.5 py-1 rounded-lg border border-violet-600 cursor-default"
            : "bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-medium px-2.5 py-1 rounded-lg border border-violet-100 transition-all active:scale-95",
          loading ? "opacity-50 cursor-not-allowed" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        ▲ UP
      </button>
      {toastMessage ? (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white text-xs px-4 py-2 rounded-lg">
          {toastMessage}
        </div>
      ) : null}
    </div>
  );
}
