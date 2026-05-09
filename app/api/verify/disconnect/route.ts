import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  connection_id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("revenue_connections")
    .update({
      status: "disconnected",
      api_key: null,
      access_token: null,
    })
    .eq("id", parsed.data.connection_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
