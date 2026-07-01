# WhatsApp AI Seller Assistant

A market-ready WhatsApp auto-reply SaaS for small online sellers — the kind of product
[lamabots.com](https://lamabots.com) is, scoped to its core: a seller connects their WhatsApp
number, adds what they sell, and an AI assistant answers customer questions instantly using that
catalog. The seller can take over any conversation at any time.

## Stack

- **Backend:** NestJS + Prisma + PostgreSQL, JWT auth, Gemini Flash, WhatsApp Cloud API
- **Frontend:** Next.js 14 (App Router) + Tailwind, polished dashboard UI
- **Infra:** Docker Compose for local Postgres, Dockerfile for the API, deployable on any VPS

```
wa-ai-assistant/
├── backend/     NestJS API (auth, products, conversations, AI, WhatsApp webhook)
├── frontend/    Next.js dashboard (login, products, conversations/inbox, settings)
└── docker-compose.yml   Local Postgres
```

## How it works

1. Seller registers → an account **and** a business are created together.
2. Seller connects their own WhatsApp Cloud API number (see below) and adds products.
3. A customer messages the seller's WhatsApp number.
4. Meta sends a webhook to the API → the AI looks at the product catalog + recent chat history →
   replies instantly via the WhatsApp Cloud API.
5. The seller can flip "AI is replying" off globally (Settings, or the toggle in the dashboard
   header) or just for one customer (Conversations) to take over personally. Sending a manual
   reply from the dashboard automatically pauses the AI for that customer.

## Prerequisites

- Node.js 20+
- Docker (for local Postgres) — or your own Postgres instance
- A Gemini API key (Google Generative Language)
- A Meta Developer account (for WhatsApp Cloud API) — free, no Meta Business verification needed
  to test with your own number

## 1. Database

```bash
docker compose up -d
```

This starts Postgres on `localhost:5433` with the credentials already wired into
`backend/.env.example`.

## 2. Backend

```bash
cd backend
cp .env.example .env        # fill in GEMINI_API_KEY at minimum to start
npm install
npx prisma migrate dev --name init
npm run prisma:seed         # optional: creates demo@seller.test / Demo@1234 with sample products
npm run start:dev           # http://localhost:4000
```

## 3. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev                 # http://localhost:3000
```

Open `http://localhost:3000`, register (or sign in with the seeded demo account), and you'll land
on the dashboard.

## Connecting a real WhatsApp number

This version uses the most common path for an indie/small SaaS: **each seller creates their own
free Meta App** and pastes its credentials into Settings. (Going fully self-serve — one shared
Meta App onboarding every seller via Embedded Signup, like the big WhatsApp BSPs do — requires
Meta's Tech Provider program and is a natural next step once you have paying customers; the data
model here already supports it since every business stores its own WhatsApp credentials.)

Steps, per seller:

1. Go to [developers.facebook.com/apps](https://developers.facebook.com/apps) → create an app →
   add the **WhatsApp** product.
2. Under WhatsApp → API Setup, grab the **Phone number ID** and a temporary access token (swap
   for a permanent **System User token** before going live — temporary tokens expire in 24h).
3. Under App Settings → Basic, grab the **App Secret**.
4. In the dashboard, go to **Settings → WhatsApp connection**. It shows you the exact
   **Callback URL** and **Verify token** to paste into Meta's webhook config (WhatsApp → 
   Configuration → Webhook). Subscribe to the `messages` field.
5. Paste the Phone number ID, App Secret and access token into the dashboard form and click
   **Connect**.
6. Send a WhatsApp message to that number — the AI should reply within a couple of seconds.

The webhook signature is verified per-business using that business's own App Secret
(`X-Hub-Signature-256`), so one seller can never spoof traffic for another.

## Gemini Flash

Replies are generated with `gemini-1.5-flash` by default (`GEMINI_MODEL` in `backend/.env`) — the
free tier is a good fit for lightweight seller responses. The system prompt is built from the seller's
actual product catalog and explicitly told not to invent products, prices, or promises that aren't in it.

## Deploying (e.g. a Hostinger/Contabo VPS)

- **Backend:** `docker build` the included `Dockerfile`, or run directly with `pm2` after
  `npm run build`. Put it behind Nginx with TLS (the WhatsApp webhook **must** be HTTPS).
- **Database:** managed Postgres, or the same `docker-compose.yml` on the VPS with a real
  password.
- **Frontend:** `npm run build && npm run start`, also behind Nginx, or deploy to Vercel and point
  `NEXT_PUBLIC_API_URL` at your API's public URL.
- Set `CORS_ORIGIN` on the backend to your real frontend domain before going live.

## Notable production details already in here

- Passwords hashed with bcrypt (12 rounds); JWT access + refresh tokens, with refresh-token
  rotation and revocation on logout.
- Webhook signature verification (HMAC SHA-256) so only genuine Meta traffic is processed.
- Global rate limiting, Helmet security headers, strict request validation (unknown fields are
  rejected, not silently dropped).
- WhatsApp access tokens / app secrets are never returned to the frontend once saved.
- Every database query is scoped to the authenticated seller's own business — there's no way for
  one seller to read another's products or conversations.

## Intentionally out of scope for this version (next steps)

- **Images/voice notes/documents** from customers are logged but not yet understood by the AI —
  only text (and button/list replies) get a reply.
- **Billing/subscriptions** (the original PRD's ₹999/1999/3999 tiers) aren't wired up — there's no
  Razorpay integration or usage metering yet.
- **One business per account** — the schema supports multiple businesses per user, but there's no
  UI to switch between them yet.
- **Real-time inbox** uses short polling (5–15s), not WebSockets — fine at this scale, worth
  revisiting if conversation volume grows.
- **Embedded Signup / Tech Provider model** for fully self-serve WhatsApp onboarding (no per-seller
  Meta App needed) — the bigger lift mentioned above.

## Demo account

If you ran the seed script: `demo@seller.test` / `Demo@1234`, with three sample products already
loaded so you can see the AI reply logic without connecting a real WhatsApp number first (you can
test the AI's reply generation by hitting the `/conversations/:id/reply` flow once you manually
insert a test customer row, or simply connect a real WhatsApp test number — that's the fastest way
to see the whole loop end to end).
