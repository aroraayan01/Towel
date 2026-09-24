# xomexo

An online store for bath, bedding, rugs and leather goods, built for Australia: AUD with GST-inclusive pricing, Australia Post postcode and state validation, Afterpay, and returns wording that meets the Australian Consumer Law.

The name is set in `lib/store.ts`, along with the other business details (ABN, address and so on are still placeholders). The brand colours (forest green and brass) and the favicon come from the existing xomexo.com site.

Categories and collections:

- **Bath:** bath towels, beach towels, hand towels
- **Bedding:** quilts, bed linen, throws and blankets
- **Rugs:** area rugs, runners, bath mats
- **Leather:** bags, wallets and accessories, leather for the home

The product mix and pricing are based on a look at Amazon Australia's best sellers; see [docs/amazon-au-research.md](docs/amazon-au-research.md).

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

With no `STRIPE_SECRET_KEY` the shop runs in **test mode**: checkout creates real orders and marks them paid without taking money, and the checkout page shows a notice saying so. With no `SMTP_HOST`, emails are printed to the server console instead of sent.

> npm 11 blocks install scripts by default. If `better-sqlite3` fails to load, run
> `npm approve-scripts better-sqlite3 prisma @prisma/engines esbuild` and then `npm rebuild`.

## Photos

Product and page photos are **free-licence stand-ins from Unsplash** ([licence](https://unsplash.com/license)), loaded from Unsplash's CDN at the size each screen needs (`lib/image-loader.ts`). The catalogue in `prisma/seed.ts` was written to match what the photos show, but they are not photos of your stock.

**Replace them with your own before you sell anything.** Showing a product that isn't the one customers will receive is misleading under the Australian Consumer Law.

To use your own photos:

- Each product has a list of images, and each image can be tied to one colour (it shows when that colour is picked) or left untied (it shows for every colour).
- Set the image URLs in `prisma/seed.ts`, or edit the `ProductImage` table with `npm run db:studio`.
- Any image URL works. To have Next.js serve other hosts, add them to `lib/image-loader.ts`.

## Features

**Shopping**
- Collections with colour, price and stock filters, sorting and search
- Product pages:
  - a gallery that switches with the selected colour
  - size options and live stock ("only 3 left")
  - a delivery check by postcode
  - reviews and related products
- Personalisation (+$12): embroidered monograms on towels and heat-debossed initials on leather. Plus a gift note and gift wrap
- Cart drawer, cart page, a free-delivery progress bar, and a wishlist (both saved in the browser)

**Checkout** (`app/(shop)/checkout`)
- Prices are recalculated on the server from the database; the prices shown in the browser are never trusted
- Checks that the postcode matches the state, and checks stock
- Delivery zones: metro, regional, and remote (WA/NT/TAS); standard and express
- Discount codes (`WELCOME10`, one use per email)
- Stripe Checkout (cards, Apple Pay, Google Pay, Afterpay) plus a webhook. The confirmation email is also a tax invoice (ABN, GST)
- Order numbers run 1001, 1002, and so on

**Admin** (`/admin`, password login)
- Dashboard: revenue, orders waiting to be packed, low stock
- Orders: a packing view that flags monograms, gift notes and gift wrap; status and tracking updates; a "shipped" email to the customer
- Edit prices and stock, hide or show products
- Approve reviews, read contact messages, export subscribers to CSV

**Everything else**
- Pages: About, Contact, FAQ, Delivery, Returns (ACL mandatory text), Privacy (APPs), Terms, Care guide, Order tracking
- SEO: per-page metadata, Open Graph share images, `sitemap.xml`, `robots.txt`, and schema.org data for Product, Offer, FAQ and Organization
- Accessibility: skip link, focus states, labelled controls, reduced-motion support
- Security: HMAC-signed admin session, rate limits on public forms, honeypot spam traps, secret order links, security headers

## Where things live

| What | Where |
|---|---|
| Brand name, ABN, contact details, Traditional Custodians, delivery threshold, monogram price | `lib/store.ts` |
| Categories and collections (names, blurbs, tile photos) | `lib/collections.ts` |
| Delivery rates and estimates | `lib/shipping.ts` |
| Products, photos, colours, sizes | `prisma/seed.ts` → `npm run db:seed` (safe to re-run; keeps variant ids stable) |
| Colours and type | `app/globals.css` (`@theme`), `app/layout.tsx` (Bodoni Moda for headings, Archivo for text) |
| Home page copy and photos | `app/(shop)/page.tsx` |
| Emails | `lib/email.ts` |

## Launch checklist

- [ ] **Name and business details** in `lib/store.ts`: brand, ABN, legal name, address, phone, email, Instagram handle, Traditional Custodians for your location
- [ ] **Your own photos** for every product and for the home and About pages (see above)
- [ ] **Product copy**: check every claim against the real stock, especially "Australian merino", "French flax linen", "22 momme", "full-grain" and "vegetable-tanned". Material claims are what shoppers and the ACCC look at hardest
- [ ] **Reviews**: reseed with `SEED_REVIEWS=false npm run db:seed` so the sample reviews are removed. Publishing reviews that aren't from real customers breaches the ACL
- [ ] **About page**: rewrite in your own words (`app/(shop)/about/page.tsx`)
- [ ] **Stripe**: add `STRIPE_SECRET_KEY`; turn on Afterpay, Apple Pay and Google Pay in Dashboard → Settings → Payment methods; add a webhook to `https://<domain>/api/stripe/webhook` for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` and `checkout.session.expired`, then set `STRIPE_WEBHOOK_SECRET`
- [ ] **Email**: SMTP credentials and `MAIL_FROM` on your own domain (set up SPF and DKIM)
- [ ] **Admin**: a strong `ADMIN_PASSWORD` and a random `ADMIN_SECRET` of 32+ characters
- [ ] **Legal**: have the Privacy policy and Terms reviewed (they are templates, not legal advice)
- [ ] **`NEXT_PUBLIC_SITE_URL`** set to the live https URL
- [ ] Place a real $1 order end to end, then refund it in Stripe

## Deploying

This is a standard Node app (`npm run build && npm start`) and runs under PM2 on any VPS. SQLite suits a single server; back up the database file.

To use MySQL or MariaDB instead: change `provider` in `prisma/schema.prisma`, swap the adapter in `lib/prisma.ts` and `prisma/seed.ts` for `@prisma/adapter-mariadb`, delete `prisma/migrations`, and run `npx prisma migrate dev --name init`.

The rate limiter is in-memory, so it assumes one Node process.
