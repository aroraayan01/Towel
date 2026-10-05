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

## Products and photos

Everything is managed in **/admin → Products**:

- **New product**: name, web address, tagline, description, bullet-point details, material, care, category and collection, labels (New, Bestseller, Featured) and whether personalisation is offered
- **Options**: one row per colour and size, each with its own price, optional "was" price, stock and SKU (left blank, one is generated). "Add colours × sizes in bulk" fills in every combination at once
- **Photos**: drag in several at once. Each can be shown for every colour or for one colour only, reordered (the first is the main photo) and given alt text. Uploads are rotated, capped at 2400px and stored as WebP; the shop serves each one resized for the screen
- New products start hidden, so you can add photos and check them before switching on **Show in shop**
- Removing an option or product that has been ordered hides it instead of deleting it, so order history stays intact

Photos are stored outside the code, in `uploads/` locally and `/home/grapme/xomexo-data/uploads` on the server (next to the database), so deploys never touch them. Back that folder up along with the database.

### The sample catalogue

The 38 starter products (`prisma/seed.ts`) use free-licence **Unsplash stock photos** and are marked as samples. They must not stay up once you sell: showing a product that isn't what customers receive is misleading under the Australian Consumer Law. Either edit a sample into one of your own products (it then stops being a sample), or press **Remove sample products** on the Products page once your range is in. Samples that appear in past orders are hidden rather than deleted.

The seed never overwrites or deletes products made or edited in admin.

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
- Products: create and edit products, options, prices, stock and photos; hide, show or delete; remove the sample catalogue in one go
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
| Products, photos, colours, sizes, stock | /admin → Products (the starter samples live in `prisma/seed.ts`) |
| Colours and type | `app/globals.css` (`@theme`), `app/layout.tsx` (Bodoni Moda for headings, Archivo for text) |
| Home page copy and photos | `app/(shop)/page.tsx` |
| Emails | `lib/email.ts` |

## Launch checklist

- [ ] **Name and business details** in `lib/store.ts`: brand, ABN, legal name, address, phone, email, Instagram handle, Traditional Custodians for your location
- [ ] **Your products** added in /admin → Products, then **Remove sample products**
- [ ] **Your own photos** for the home and About pages too (those are set in `app/(shop)/page.tsx` and `about/page.tsx`)
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

Live at **xomexo.com** on the cPanel box (the same server as the other sites). The old handicrafts site stays live at **old.xomexo.com**, with a backup in `~/backups` and its own repo (aroraayan01/xomexo) untouched.

How it runs:
- Code: `/home/grapme/xomexo-store`, a checkout of this repo
- Database: `/home/grapme/xomexo-data/xomexo.db`, kept outside the code folder so deploys never touch it. Back it up.
- Settings: `.env.local` in the code folder (Next.js and Prisma both read it)
- Process: a Docker container (`compose.yaml`, `Dockerfile`), running as the cPanel user on 127.0.0.1:3410 and restarting on boot. It runs in Docker because the server is AlmaLinux 8, whose glibc (2.28) is too old for Next.js (it needs 2.30).
- Apache: proxies xomexo.com to it through cPanel userdata includes (`/etc/apache2/conf.d/userdata/{std,ssl}/2_4/grapme/xomexo.com/xomexo.conf`)

Commands (run as root in WHM » Terminal):

| What | Command |
|---|---|
| First install | `curl -fsSL https://raw.githubusercontent.com/aroraayan01/Towel/main/deploy/install.sh -o /root/xomexo-install.sh && bash /root/xomexo-install.sh` (safe to re-run) |
| Update after a push | `bash /home/grapme/xomexo-store/deploy/update.sh` |
| Put the old site back on xomexo.com | `bash /home/grapme/xomexo-store/deploy/rollback.sh` |
| Logs | `cd /home/grapme/xomexo-store && docker compose logs -f` |

**Checkout is closed on the live site until Stripe is set up.** Without `STRIPE_SECRET_KEY`, orders would be marked paid without taking money, so in production the checkout page says "opens soon" instead. To open it, add the Stripe keys to `.env.local` and run `update.sh --force`. (`ALLOW_TEST_CHECKOUT=true` overrides this for a private staging copy. Never set it on the public site.)

The first install loads the catalogue **without** the sample reviews. Updates never reseed, because that would undo price and stock changes made in /admin.

The rate limiter is in-memory, so it assumes one Node process.

To use MySQL or MariaDB instead of SQLite: change `provider` in `prisma/schema.prisma`, swap the adapter in `lib/prisma.ts` and `prisma/seed.ts` for `@prisma/adapter-mariadb`, delete `prisma/migrations`, and run `npx prisma migrate dev --name init`.
