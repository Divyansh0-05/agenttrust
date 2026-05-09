export interface RevenueData {
  mrr: number; // in cents
  arr: number; // in cents
  total_revenue: number; // in cents
  customer_count: number;
  active_subscriptions: number;
  currency: string;
}

export interface RevenueAdapter {
  platform: string;
  fetchRevenue(credentials: {
    api_key?: string;
    access_token?: string;
    account_id?: string;
  }): Promise<RevenueData>;
}
