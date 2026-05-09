export type RevenueVerifyPlatform =
  | "stripe"
  | "lemon_squeezy"
  | "revenuecat"
  | "dodo"
  | "paddle";

export type ActiveConnectionView = {
  id: string;
  mrr: number | null;
  customer_count: number | null;
  last_synced_at: string | null;
  currency: string | null;
};
