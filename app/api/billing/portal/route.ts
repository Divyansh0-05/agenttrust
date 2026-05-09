import { NextResponse } from "next/server";

import { dodoClient } from "@/lib/dodo";
import { createClient } from "@/lib/supabase/server";

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("dodo_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!profile?.dodo_customer_id) {
    return NextResponse.json({ error: "No billing customer found." }, { status: 400 });
  }

  const session = await dodoClient.customers.customerPortal.create(
    profile.dodo_customer_id,
    { return_url: `${appUrl()}/dashboard/billing` },
  );

  return NextResponse.redirect(session.link);
}
