import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

import { BillingActions } from "./billing-actions";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile, error: profileError }, { data: subscription, error: subError }] =
    await Promise.all([
      supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle(),
      supabase
        .from("subscriptions")
        .select("plan, status, current_period_end")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (subError) {
    throw new Error(subError.message);
  }

  const currentPlan = (profile?.plan ?? "free") as "free" | "starter" | "growth" | "scale";
  const hasActiveSubscription =
    subscription?.status === "active" || subscription?.status === "pending";

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Manage your AgentTrust subscription powered by Dodo Payments.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Current subscription</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Plan</p>
            <p className="text-lg font-semibold capitalize">{currentPlan}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Renewal date</p>
            <p className="text-lg font-semibold">
              {formatDate(subscription?.current_period_end ?? null)}
            </p>
          </div>
        </CardContent>
      </Card>

      <BillingActions
        currentPlan={currentPlan}
        hasActiveSubscription={hasActiveSubscription}
      />
    </main>
  );
}
