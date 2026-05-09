export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: string | null;
  dodo_customer_id: string | null;
  created_at: Date | null;
}

export interface Product {
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  website_url: string | null;
  logo_url: string | null;
  category: string | null;
  trust_score: number | null;
  avg_rating: number | null;
  review_count: number | null;
  stripe_verified: boolean | null;
  github_verified: boolean | null;
  github_stars: number | null;
  github_repo_url: string | null;
  revenue_verified: boolean | null;
  revenue_mrr: number | null;
  revenue_arr: number | null;
  revenue_total: number | null;
  revenue_customer_count: number | null;
  revenue_mom_growth: number | null;
  revenue_currency: string | null;
  revenue_last_synced_at: Date | null;
  revenue_is_public: boolean | null;
  agent_query_count: number | null;
  agent_query_count_30d: number | null;
  is_public: boolean | null;
  allow_public_reviews: boolean | null;
  created_at: Date | null;
  updated_at: Date | null;
}

export interface RevenueConnection {
  id: string;
  product_id: string;
  platform: string;
  api_key: string | null;
  access_token: string | null;
  account_id: string | null;
  status: string | null;
  last_error: string | null;
  last_synced_at: Date | null;
  mrr: number | null;
  arr: number | null;
  total_revenue: number | null;
  customer_count: number | null;
  active_subscriptions: number | null;
  currency: string | null;
  created_at: Date | null;
  updated_at: Date | null;
}

export interface RevenueSnapshot {
  id: string;
  product_id: string;
  mrr: number;
  customer_count: number;
  total_revenue: number;
  recorded_at: Date | null;
}

export interface Review {
  id: string;
  product_id: string;
  reviewer_name: string;
  reviewer_email: string | null;
  reviewer_role: string | null;
  reviewer_company: string | null;
  reviewer_avatar_url: string | null;
  rating: number;
  title: string | null;
  body: string;
  use_case: string | null;
  is_verified_customer: boolean | null;
  is_featured: boolean | null;
  is_approved: boolean | null;
  source: string | null;
  campaign_id: string | null;
  token: string | null;
  token_expires_at: Date | null;
  submitted_at: Date | null;
  created_at: Date | null;
}

export interface Campaign {
  id: string;
  product_id: string;
  name: string;
  email_subject: string;
  email_body: string;
  status: string | null;
  sent_count: number | null;
  opened_count: number | null;
  review_count: number | null;
  created_at: Date | null;
  sent_at: Date | null;
}

export interface CampaignRecipient {
  id: string;
  campaign_id: string;
  product_id: string;
  email: string;
  name: string | null;
  token: string;
  status: string | null;
  sent_at: Date | null;
  reviewed_at: Date | null;
}

export interface Subscription {
  id: string;
  user_id: string;
  status: string;
  plan: string;
  dodo_product_id: string | null;
  dodo_subscription_id: string | null;
  current_period_end: Date | null;
  cancel_at_period_end: boolean | null;
  created_at: Date | null;
  updated_at: Date | null;
}

export interface AdSlot {
  id: string;
  position: string;
  advertiser_name: string;
  advertiser_url: string;
  logo_url: string | null;
  tagline: string | null;
  dodo_subscription_id: string | null;
  monthly_price: number | null;
  is_active: boolean | null;
  starts_at: Date | null;
  ends_at: Date | null;
  created_at: Date | null;
}

export interface AgentQuery {
  id: string;
  product_id: string | null;
  product_slug: string | null;
  query_type: string | null;
  user_agent: string | null;
  ip_hash: string | null;
  created_at: Date | null;
}
