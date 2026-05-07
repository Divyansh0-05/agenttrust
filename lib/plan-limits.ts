export const PLANS = {
  free: {
    products: 1,
    reviews_per_product: 10,
    campaign_emails_per_month: 0,
    widget_styles: ["badge"],
    agent_api: false,
    remove_branding: false,
  },
  starter: {
    products: 1,
    reviews_per_product: 500,
    campaign_emails_per_month: 200,
    widget_styles: ["badge", "carousel", "wall", "floating"],
    agent_api: false,
    remove_branding: false,
  },
  growth: {
    products: 3,
    reviews_per_product: 2000,
    campaign_emails_per_month: 1000,
    widget_styles: ["badge", "carousel", "wall", "floating"],
    agent_api: false,
    remove_branding: false,
  },
  scale: {
    products: 10,
    reviews_per_product: 999999,
    campaign_emails_per_month: 999999,
    widget_styles: ["badge", "carousel", "wall", "floating"],
    agent_api: true,
    remove_branding: true,
  },
};

export type Plan = keyof typeof PLANS;

export function getUserPlan(profile?: { plan: string | null } | null): Plan {
  const plan = profile?.plan;

  if (plan && plan in PLANS) {
    return plan as Plan;
  }

  return "free";
}

export function canDo(plan: Plan, feature: keyof (typeof PLANS)["free"]) {
  return Boolean(PLANS[plan][feature]);
}
