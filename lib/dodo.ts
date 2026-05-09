import DodoPayments from "dodopayments";

const dodoEnvironment =
  process.env.DODO_PAYMENTS_ENV === "test_mode" ||
  process.env.DODO_PAYMENTS_ENV === "live_mode"
    ? process.env.DODO_PAYMENTS_ENV
    : process.env.NODE_ENV === "production"
      ? "live_mode"
      : "test_mode";

export const dodoClient = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY,
  environment: dodoEnvironment,
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_SECRET ?? null,
});
