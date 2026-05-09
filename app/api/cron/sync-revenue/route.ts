import { syncAllConnections } from "@/lib/revenue/sync";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const synced = await syncAllConnections();
  return NextResponse.json({ synced });
}
