# Wattle & Weave

An online store for towels and rugs, built for Australia: AUD with GST-inclusive pricing, Australia Post postcode and state validation, Afterpay, and returns wording that meets the Australian Consumer Law.

**Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · Prisma 7 + SQLite · Stripe Checkout · Nodemailer

## Run it locally

```bash
npm install
cp .env.example .env.local     # then fill in ADMIN_PASSWORD / ADMIN_SECRET
npx prisma migrate deploy      # create the database
npm run db:seed                # load the starter catalogue
npm run dev
```

Open http://localhost:3000. The admin is at `/admin`.

With no `STRIPE_SECRET_KEY` the shop runs in **demo mode**: checkout creates real orders and marks them paid without taking money. With no `SMTP_HOST`, emails are printed to the server console instead of sent.

> npm 11 blocks install scripts by default. If `better-sqlite3` fails to load, run
> `npm approve-scripts better-sqlite3 prisma @prisma/engines esbuild` and then `npm rebuild`.

## Features

**Shopping**
- Collections, search, and filters for colour, price and stock, with sorting
- Product pages: colour and size variants, live stock ("only 3 left"), a delivery-cost check by postcode, reviews with a rating breakdown, related products
- Monogramming on towels (+$12) with a live preview
- Cart drawer and cart page, a free-shipping progress bar, and a wishlist (both saved in the browser)
- Illustrated product images drawn in each variant's real colours. Set `imageUrl` on a product to use a photo instead

**Checkout** (`app/(shop)/checkout`)
- Prices are recalculated on the server from the database; the prices shown in the browser are never trusted
- Checks that the postcode matches the state, and checks stock
- Delivery zones: metro, regional, and remote (WA/NT/TAS); standard and express
- Discount codes (`WELCOME10`, one use per email), gift wrap, and a free handwritten gift note
- Stripe Checkout (cards, Apple Pay, Google Pay, Afterpay) plus a webhook. The confirmation email doubles as a tax invoice (ABN, GST)

**Admin** (`/admin`, password login)
- Dashboard: revenue, orders waiting to be packed, low stock
- Orders: filter and search, a packing view that highlights monograms and gift notes, status and tracking updates, and a "shipped" email to the customer
- Edit prices and stock, hide or show products
- Approve reviews, read contact messages, export subscribers to CSV

**Everything else**
- Pages: About, Contact, FAQ, Shipping, Returns (ACL mandatory text), Privacy (APPs), Terms, Care guide, Order tracking
- SEO: per-page metadata, Open Graph share images, `sitemap.xml`, `robots.txt`, and schema.org data for Product, Offer, Review, FAQ and Organization
- Accessibility: skip link, focus states, labelled controls, reduced-motion support
- Security: HMAC-signed admin session, rate limits on public forms, honeypot spam traps, secret order links, security headers

## Where things live

| What | Where |
|---|---|
| Brand name, ABN, contact details, founders' note, shipping threshold, monogram price | `lib/store.ts` |
| Shipping rates and delivery estimates | `lib/shipping.ts` |
| Products (starter catalogue) | `prisma/seed.ts` → `npm run db:seed` |
| Collections and category copy | `lib/collections.ts` |
| Colours and fonts | `app/globals.css` (`@theme`), `app/layout.tsx` |
| Emails | `lib/email.ts` |

## Launch checklist

- [ ] **Business details** in `lib/store.ts`: real ABN, legal name, address, phone, email, social links
- [ ] **Founders' note and About page**: rewrite in your own words (these are the "personal touch" and they are placeholders)
- [ ] **Product copy**: check every claim (GSM, materials, "washable", "hand-woven") against the real stock. Under the ACL, product descriptions are representations you are liable for
- [ ] **Photos**: set `imageUrl` for each product (Google product rich results need a real photo)
- [ ] **Stripe**: add `STRIPE_SECRET_KEY`; turn on Afterpay, Apple Pay and Google Pay under Dashboard → Settings → Payment methods; add a webhook to `https://<domain>/api/stripe/webhook` for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` and `checkout.session.expired`, then set `STRIPE_WEBHOOK_SECRET`
- [ ] **Email**: SMTP credentials and `MAIL_FROM` on your own domain (set up SPF and DKIM)
- [ ] **Admin**: a strong `ADMIN_PASSWORD` and a random `ADMIN_SECRET` of 32+ characters
- [ ] **Legal**: have the Privacy policy and Terms reviewed (they are templates, not legal advice)
- [ ] **`NEXT_PUBLIC_SITE_URL`** set to the live https URL
- [ ] Place a real $1 order end to end, then refund it in Stripe

## Deploying

This is a standard Node app (`npm run build && npm start`) and runs under PM2 on any VPS. SQLite suits a single server; back up `prisma/dev.db` (or whatever `DATABASE_URL` points to).

To use MySQL or MariaDB instead: change `provider` in `prisma/schema.prisma`, swap the adapter in `lib/prisma.ts` and `prisma/seed.ts` for `@prisma/adapter-mariadb`, delete `prisma/migrations`, and run `npx prisma migrate dev --name init`.

The rate limiter is in-memory, so it assumes one Node process. Swap it for Redis before running multiple instances.
