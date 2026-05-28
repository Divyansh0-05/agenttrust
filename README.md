**AgentTrust — Verified Reviews & Multi‑Platform Revenue**

AgentTrust is an open-source Next.js application that helps software makers collect verified reviews and display verified revenue across multiple payment platforms. It is built for both humans and AI agents: reviews, trust scores, and revenue data are exposed as structured, machine-readable APIs so AI assistants can discover and reason about product trust signals.

**Key features:**
- **Verified reviews:** public profiles, review collection, moderation and featured reviews.
- **Multi-platform revenue verification:** connect Stripe, Lemon Squeezy, RevenueCat, Dodo, Paddle (and more) and aggregate MRR/ARR.
- **Agent-friendly API:** structured trust data for AI agents to query and act on.
- **Dashboard & widgets:** product dashboard, billing, public product pages and embeddable widgets.

**Tech stack:**
- **Framework:** Next.js
- **Database & auth:** Supabase
- **Payments & revenue connectors:** Stripe, Lemon Squeezy, RevenueCat, Dodo, Paddle
- **Email / notifications:** Resend

**Repository layout (high-level):**
- **app/** — Next.js app routes & pages (dashboard, public pages, auth)
- **api/** — server API routes (verify, billing, webhooks, cron)
- **lib/** — utilities, adapters (revenue adapters live under `lib/revenue` per spec)
- **components/** — UI components used across the app
- **supabase/** — database migrations and SQL schema

See the full product specification: [PRODUCT_SPEC.md](PRODUCT_SPEC.md)

**Quick Start (development)**

1. Install dependencies:

```bash
npm install
```

2. Run the dev server:

```bash
npm run dev
```

3. Open http://localhost:3000

**Recommended scripts**
- `npm run dev` — start Next.js in development mode
- `npm run build` — build for production
- `npm start` — start built app
- `npm run lint` — run ESLint

**Environment variables**
Create a `.env.local` (do not commit). Typical variables the app expects include:

- `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_ANON_KEY`
- `DATABASE_URL` (if using a direct DB connection)
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` (for Stripe integrations)
- `RESEND_API_KEY` (email)
- Provider API keys/tokens for Lemon Squeezy, RevenueCat, Dodo, Paddle as needed

Check the API routes and `lib/` adapters for the full list of env names.

**Database / Migrations**
This project includes Supabase SQL migrations under the `supabase/migrations/` folder. Apply them to your Supabase project to create the required schema.

**SEO & AI‑Agent Optimization (SEO Audit)**

AgentTrust is explicitly designed to serve both human users and AI agents. The codebase already contains features that improve discoverability and machine-readability; the README below summarises how the project supports an SEO audit targeted at AI agents:

- **Machine-readable trust endpoints:** public product pages and API routes (e.g., `/api/trust/[slug]`) return structured JSON that includes trust scores, review metadata, and verified revenue so agents can parse and compare products.
- **Structured metadata & schema:** public pages include structured data (JSON‑LD or equivalent) to surface reviews, ratings, and verification badges to crawlers and agents.
- **Crawlable, canonical URLs:** public profile pages follow a consistent URL scheme (`/p/[slug]`) and include canonical links to avoid duplication.
- **Agent-focused audit checklist (what to verify):**
	- Verify that the trust API returns consistent fields for `trust_score`, `reviews[]`, `revenue.verified`, and `revenue.platforms`.
	- Ensure review content is accessible without JS (server-rendered or accessible via API endpoints).
	- Confirm frequency and freshness fields (`revenue_last_synced_at`, `recorded_at`) are present so agents can prefer recent data.
	- Validate JSON‑LD schema on public pages for ratings and aggregateRating.
	- Check CORS and rate limits for agent access to the trust API, and provide API keys or rate-limited endpoints for heavier agent use.

If you are adding or running an SEO audit for AI agents, treat the above checklist as the starting point — the project already supports these signals and the [PRODUCT_SPEC.md](PRODUCT_SPEC.md) documents the machine‑readable API expectations in detail.

**Deployment**
Deploy on Vercel, Netlify, or any platform that supports Next.js. When deploying, ensure environment variables and Supabase credentials are set in the host environment. For production, use Supabase service keys carefully and secure payment provider credentials.

**Testing & Quality**
- Linting: `npm run lint`
- Unit/integration tests: none included by default — add tests in `__tests__` and update CI as needed.

**Contributing**
- Please open issues or PRs. Follow the existing code style and keep changes focused. Major architecture changes (revenue adapters, auth, schema) should reference the [PRODUCT_SPEC.md](PRODUCT_SPEC.md).

**References**
- Product spec: [PRODUCT_SPEC.md](PRODUCT_SPEC.md)
- Migrations: [supabase/migrations/](supabase/migrations/)
- App entry: [app/layout.tsx](app/layout.tsx)

**License**
This repository does not include a license file. Add a license if you plan to publish this project.

---
If you want, I can also generate a short `.env.example` and a `CONTRIBUTING.md` to make local setup and contributions easier. Would you like that?
