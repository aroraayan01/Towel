/**
 * Seeds the starter catalogue. Safe to re-run: products are upserted by slug
 * and their variants/reviews replaced. Orders, subscribers and messages are
 * never touched.
 *
 * All copy here is placeholder — check every product claim (materials, GSM,
 * "washable", etc.) against the real stock before launch. Under Australian
 * Consumer Law a product description is a representation you're liable for.
 */
import { config } from "dotenv";
config({ path: [".env.local", ".env"], quiet: true });

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "../app/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./prisma/dev.db" }),
});

type Colour = { name: string; hex: string; accent: string };
type Size = { label: string; price: number; compareAt?: number };

type Seed = {
  slug: string;
  name: string;
  category: "towels" | "rugs";
  collection: string;
  tagline: string;
  description: string;
  details: string[];
  material: string;
  care: string;
  pattern: string;
  colours: Colour[];
  sizes: Size[];
  featured?: boolean;
  bestseller?: boolean;
  isNew?: boolean;
  monogramable?: boolean;
  reviews?: { name: string; location: string; rating: number; title: string; body: string }[];
};

// A palette named after places and plants — a small way to feel local.
const C = {
  harbour: { name: "Harbour Blue", hex: "#3F6E8C", accent: "#F3EDE3" },
  eucalypt: { name: "Eucalypt", hex: "#7C9A86", accent: "#F3EDE3" },
  ochre: { name: "Ochre", hex: "#C0803F", accent: "#FAF3E8" },
  saltpan: { name: "Salt Pan", hex: "#EDE6DA", accent: "#C9BCA6" },
  clay: { name: "Clay", hex: "#B87462", accent: "#F4E9E1" },
  charcoal: { name: "Charcoal", hex: "#4A4846", accent: "#D8CFC2" },
  white: { name: "Chalk White", hex: "#F7F5F0", accent: "#D9D3C7" },
  sandstone: { name: "Sandstone", hex: "#D9C3A0", accent: "#F7F1E6" },
  sage: { name: "Sage", hex: "#A3B09A", accent: "#F3F1EA" },
  ironbark: { name: "Ironbark", hex: "#5B4A42", accent: "#E8DDD3" },
  coral: { name: "Coral Bay", hex: "#E08E79", accent: "#FBF1EC" },
  wattle: { name: "Wattle", hex: "#E3B23C", accent: "#FFF8E6" },
  ocean: { name: "Ningaloo", hex: "#2F5D7C", accent: "#F2EFE8" },
  terracotta: { name: "Terracotta", hex: "#B5563C", accent: "#F6E9DF" },
  olive: { name: "Saltbush", hex: "#8A8F6A", accent: "#F4F1E6" },
  pinklake: { name: "Pink Lake", hex: "#E7A6A1", accent: "#FFF5F2" },
  seafoam: { name: "Seafoam", hex: "#9CC9BF", accent: "#F4FBF8" },
  jute: { name: "Natural", hex: "#C8A874", accent: "#3B3A36" },
  jutewhite: { name: "Natural & Chalk", hex: "#D4BC92", accent: "#F3EEE4" },
  rainforest: { name: "Daintree", hex: "#4F6B55", accent: "#EFE7DA" },
  dusk: { name: "Dusk", hex: "#6B5B73", accent: "#EFE3D9" },
  redearth: { name: "Red Earth", hex: "#A5522F", accent: "#F2E6D3" },
};

const products: Seed[] = [
  // ─── Bath towels ─────────────────────────────────────────────
  {
    slug: "coogee-stripe-bath-towel",
    name: "Coogee Stripe Towel",
    category: "towels",
    collection: "bath-towels",
    tagline: "Our bestseller. Heavy Turkish cotton with a sunny woven stripe.",
    description:
      "Named after the ocean pool where we swim most mornings. The Coogee is woven from long-staple Turkish cotton at 600gsm, so it's thick and absorbent without taking three days to dry. The stripe is woven in, not printed, so it won't fade on the line.",
    details: [
      "600gsm long-staple Turkish cotton",
      "Woven stripe that won't fade in the sun",
      "Double-stitched hems and a hanging loop",
      "Gets softer with every wash",
      "Add a monogram for a gift they'll keep for years",
    ],
    material: "100% Turkish cotton, 600gsm",
    care: "Machine wash warm (40°C) with like colours. Skip the fabric softener — it coats the fibres and makes towels less absorbent. Line dry in the shade or tumble dry low.",
    pattern: "stripe",
    colours: [C.harbour, C.eucalypt, C.ochre],
    sizes: [
      { label: "Hand towel 50×90cm", price: 2495 },
      { label: "Bath towel 70×140cm", price: 4995 },
      { label: "Bath sheet 90×160cm", price: 6495 },
    ],
    bestseller: true,
    featured: true,
    monogramable: true,
    reviews: [
      { name: "Kate", location: "Randwick, NSW", rating: 5, title: "Worth every cent", body: "I bought two in Harbour Blue and went back for two more. They're thick, dry fast and the stripe is still bright after months of line drying." },
      { name: "Tom", location: "Geelong, VIC", rating: 5, title: "Hotel towels at home", body: "Properly heavy towels. Took two washes to lose the lint but now they're perfect." },
      { name: "Priya", location: "Paddington, QLD", rating: 4, title: "Lovely, bath sheet is huge", body: "Beautiful quality. The bath sheet is massive — go the regular bath towel if your rail is small." },
    ],
  },
  {
    slug: "salt-pan-waffle-towel",
    name: "Salt Pan Waffle Towel",
    category: "towels",
    collection: "bath-towels",
    tagline: "Light, quick-drying waffle weave for humid bathrooms.",
    description:
      "If your towels never quite dry between showers, this is the one. The deep waffle weave has less fabric against your skin and more air in between, so it dries in a fraction of the time — perfect for Queensland summers and small apartments.",
    details: [
      "Deep-pocket waffle weave",
      "Dries up to twice as fast as terry",
      "Lightweight — great for travel and the gym",
      "Pre-washed for softness from day one",
    ],
    material: "100% cotton waffle weave",
    care: "Machine wash warm. Tumble dry low or line dry. Waffle weave shrinks slightly on the first wash — that's what makes it plump up.",
    pattern: "waffle",
    colours: [C.saltpan, C.clay, C.charcoal],
    sizes: [
      { label: "Bath towel 70×140cm", price: 4495 },
      { label: "Bath sheet 90×160cm", price: 5995 },
    ],
    isNew: true,
    monogramable: true,
    reviews: [
      { name: "Hannah", location: "Cairns, QLD", rating: 5, title: "Finally a towel that dries", body: "Our bathroom has no window and these are dry by lunchtime. Game changer in the wet season." },
      { name: "Jess", location: "Newtown, NSW", rating: 4, title: "Takes some getting used to", body: "Feels different to fluffy towels but I'm converted. The Clay colour is gorgeous." },
    ],
  },
  {
    slug: "everyday-plush-towel",
    name: "Everyday Plush Towel",
    category: "towels",
    collection: "bath-towels",
    tagline: "The thick, fluffy staple. Five calm colours to mix and match.",
    description:
      "No stripes, no fuss — just a deeply soft 650gsm towel in colours that sit quietly in any bathroom. Made with zero-twist cotton loops that stay fluffy wash after wash.",
    details: [
      "650gsm zero-twist cotton",
      "Extra-absorbent long loops",
      "Five colours designed to mix and match",
      "Monogramming available",
    ],
    material: "100% cotton, 650gsm",
    care: "Machine wash warm with like colours. Avoid fabric softener. Tumble dry low for maximum fluff.",
    pattern: "plain",
    colours: [C.white, C.sandstone, C.sage, C.ironbark, C.coral],
    sizes: [
      { label: "Hand towel 50×90cm", price: 1995 },
      { label: "Bath towel 70×140cm", price: 3995 },
      { label: "Bath sheet 90×160cm", price: 5495 },
    ],
    bestseller: true,
    monogramable: true,
    reviews: [
      { name: "Linda", location: "Norwood, SA", rating: 5, title: "So soft", body: "Bought the full set in Sage for our guest room. Guests keep asking where they're from." },
      { name: "Marcus", location: "Hobart, TAS", rating: 5, title: "Great value", body: "Better than the department store towels at twice the price." },
    ],
  },
  // ─── Hand towels ─────────────────────────────────────────────
  {
    slug: "kingscliff-face-washers",
    name: "Kingscliff Face Washers (Set of 4)",
    category: "towels",
    collection: "hand-towels",
    tagline: "Four soft face washers in a mixed or matching set.",
    description:
      "Small but mighty. These plush face washers are the same 650gsm cotton as our Everyday towels, cut to a handy 30×30cm with a hanging loop on each.",
    details: ["Set of four", "650gsm cotton", "30×30cm each", "Hanging loop on every washer"],
    material: "100% cotton, 650gsm",
    care: "Machine wash warm. Tumble dry low.",
    pattern: "plain",
    colours: [C.white, C.sage, C.sandstone],
    sizes: [{ label: "Set of 4 · 30×30cm", price: 2295 }],
  },
  {
    slug: "guest-towel-pair",
    name: "Stripe Guest Towel Pair",
    category: "towels",
    collection: "hand-towels",
    tagline: "A pair of striped hand towels for the powder room.",
    description:
      "The Coogee stripe in a smaller size, sold as a pair. Hang them by the basin or roll them in a basket for guests.",
    details: ["Set of two hand towels", "600gsm Turkish cotton", "50×90cm each"],
    material: "100% Turkish cotton, 600gsm",
    care: "Machine wash warm. Line dry in the shade.",
    pattern: "stripe",
    colours: [C.harbour, C.ochre, C.eucalypt],
    sizes: [{ label: "Pair · 50×90cm", price: 3995, compareAt: 4990 }],
    monogramable: true,
  },
  // ─── Beach towels ────────────────────────────────────────────
  {
    slug: "bondi-beach-towel",
    name: "Bondi Beach Towel",
    category: "towels",
    collection: "beach-towels",
    tagline: "Flat-woven so sand shakes straight off. Big enough for two.",
    description:
      "Our answer to the sandy car boot. The flat jacquard weave doesn't trap sand the way terry loops do — one shake and it's clean. It's light enough to throw in a tote and dries in the time it takes to eat a Paddle Pop.",
    details: [
      "Sand-shedding flat weave",
      "Oversized 90×180cm",
      "Quick-drying and lightweight",
      "Folds down small for bags and suitcases",
    ],
    material: "Cotton-linen blend flat weave",
    care: "Machine wash cold. Line dry. Rinse after salt water to keep colours bright.",
    pattern: "stripe",
    colours: [C.harbour, C.coral, C.wattle],
    sizes: [{ label: "Beach towel 90×180cm", price: 5995 }],
    bestseller: true,
    featured: true,
    monogramable: true,
    reviews: [
      { name: "Chloe", location: "Manly, NSW", rating: 5, title: "Sand really does come off", body: "Was sceptical but it's true — shook it at the car and there was nothing left. Kids fight over the Wattle one." },
      { name: "Ben", location: "Scarborough, WA", rating: 5, title: "Beach essential", body: "Dries so fast. Took it to Bali and back, still looks new." },
    ],
  },
  {
    slug: "byron-fouta-towel",
    name: "Byron Fouta Towel",
    category: "towels",
    collection: "beach-towels",
    tagline: "A fringed Turkish peshtemal. Towel, sarong, picnic rug.",
    description:
      "Hand-loomed in the traditional peshtemal style, the Byron is thin, strong and ridiculously versatile. Use it as a beach towel, a sarong, a throw on the couch or a picnic blanket at the Sunday markets.",
    details: [
      "Traditional hand-loomed peshtemal",
      "Hand-knotted fringe",
      "Thin, strong and quick-drying",
      "Doubles as a sarong, throw or picnic rug",
    ],
    material: "100% Turkish cotton",
    care: "Machine wash cold on a gentle cycle. Line dry. It gets softer and more absorbent with every wash.",
    pattern: "fouta",
    colours: [C.ocean, C.terracotta, C.olive],
    sizes: [{ label: "100×180cm", price: 5495 }],
    isNew: true,
  },
  {
    slug: "rottnest-oversized-beach-towel",
    name: "Rottnest Oversized Beach Towel",
    category: "towels",
    collection: "beach-towels",
    tagline: "Extra-long plush terry for serious sunbaking.",
    description:
      "For those who like their beach towel thick and their lie-downs long. The Rottnest is a plush 500gsm terry at a full two metres long, with a bold woven band at each end.",
    details: ["Extra-long 100×200cm", "500gsm cotton terry", "Woven end bands", "Handy hanging loop"],
    material: "100% cotton terry, 500gsm",
    care: "Machine wash warm. Line dry in the shade to keep colours bright.",
    pattern: "stripe",
    colours: [C.pinklake, C.seafoam, C.ochre],
    sizes: [{ label: "100×200cm", price: 6995 }],
    monogramable: true,
  },
  // ─── Bath mats ───────────────────────────────────────────────
  {
    slug: "cloud-bath-mat",
    name: "Cloud Bath Mat",
    category: "rugs",
    collection: "bath-mats",
    tagline: "Thick tufted cotton with a non-slip backing.",
    description:
      "Step out of the shower onto something that feels like a cloud. Deep tufted cotton soaks up drips, and the latex-free non-slip backing keeps it where you left it on wet tiles.",
    details: ["Thick tufted cotton pile", "Latex-free non-slip backing", "Machine washable", "50×80cm"],
    material: "100% cotton pile, TPR non-slip backing",
    care: "Machine wash cold, gentle. Line dry — do not tumble dry, as heat damages the backing.",
    pattern: "plain",
    colours: [C.white, C.sage, C.clay],
    sizes: [{ label: "50×80cm", price: 3995 }],
    bestseller: true,
  },
  {
    slug: "ribbed-bath-mat",
    name: "Ribbed Cotton Bath Mat",
    category: "rugs",
    collection: "bath-mats",
    tagline: "A reversible ribbed mat that dries flat and fast.",
    description:
      "A thinner, reversible mat woven in chunky ribs. It lies flat, dries fast and suits bathrooms where the door needs to swing over it.",
    details: ["Reversible", "Thin enough to fit under doors", "Machine washable", "55×85cm"],
    material: "100% cotton",
    care: "Machine wash warm. Tumble dry low.",
    pattern: "stripe",
    colours: [C.saltpan, C.charcoal],
    sizes: [{ label: "55×85cm", price: 3495 }],
  },
  // ─── Area rugs ───────────────────────────────────────────────
  {
    slug: "kimberley-wool-rug",
    name: "Kimberley Hand-Woven Wool Rug",
    category: "rugs",
    collection: "area-rugs",
    tagline: "A hand-woven wool rug in the colours of the north-west.",
    description:
      "The deep ochres and red earth of the Kimberley, hand-woven in thick New Zealand wool. Wool is naturally stain-resistant and flame-retardant, and it'll outlast every synthetic rug you've owned. This is a rug to keep.",
    details: [
      "Hand-woven by artisans",
      "Thick New Zealand wool pile",
      "Naturally stain-resistant and hard-wearing",
      "Finished with a hand-knotted fringe",
      "Some shedding in the first months is normal",
    ],
    material: "80% New Zealand wool, 20% cotton warp",
    care: "Vacuum weekly without the beater bar. Blot spills immediately — never rub. Professional clean yearly. Rotate every six months so it wears evenly.",
    pattern: "diamond",
    colours: [C.redearth, C.charcoal],
    sizes: [
      { label: "160×230cm", price: 59900 },
      { label: "200×300cm", price: 89900 },
    ],
    featured: true,
    reviews: [
      { name: "Sophie", location: "Broome, WA", rating: 5, title: "Stunning", body: "Even more beautiful in person. Feels incredible underfoot and the colour is perfect in our living room." },
      { name: "Daniel", location: "Fitzroy, VIC", rating: 4, title: "Beautiful rug, shed a bit", body: "Shed a lot the first month (they warned me) but it's settled now. Quality is obvious." },
    ],
  },
  {
    slug: "nullarbor-jute-rug",
    name: "Nullarbor Jute Rug",
    category: "rugs",
    collection: "area-rugs",
    tagline: "Natural hand-braided jute with a contrast border.",
    description:
      "Wide open, warm and grounding — like the plain it's named after. Braided from natural jute fibre with a woven cotton border, the Nullarbor adds texture to any room and looks better the more it's lived on.",
    details: [
      "Hand-braided natural jute",
      "Contrast cotton border",
      "Biodegradable, renewable fibre",
      "Best for low-to-medium traffic, dry areas",
    ],
    material: "100% natural jute, cotton border",
    care: "Vacuum regularly. Jute doesn't love water — blot spills with a dry cloth and avoid steam cleaning. Keep out of damp areas.",
    pattern: "border",
    colours: [C.jute, C.jutewhite],
    sizes: [
      { label: "120×170cm", price: 24900 },
      { label: "160×230cm", price: 44900 },
      { label: "200×300cm", price: 69900 },
    ],
    bestseller: true,
    reviews: [
      { name: "Olivia", location: "Brunswick Heads, NSW", rating: 5, title: "Exactly what I wanted", body: "Great texture, lovely natural colour. The border makes it look much more expensive." },
      { name: "Aaron", location: "Canberra, ACT", rating: 4, title: "Solid rug", body: "Has a natural smell for the first week which faded. Would buy again." },
    ],
  },
  {
    slug: "daintree-flatweave-rug",
    name: "Daintree Washable Flatweave Rug",
    category: "rugs",
    collection: "area-rugs",
    tagline: "A cotton flatweave you can throw in the washing machine.",
    description:
      "Designed for families, pets and people who spill things. The Daintree is a reversible cotton flatweave light enough for most front-loaders, so red wine and muddy paws are a wash cycle away from gone.",
    details: [
      "Machine washable (120×180 size in most front-loaders)",
      "Reversible for twice the wear",
      "Soft cotton flatweave",
      "Use with a rug underlay on hard floors",
    ],
    material: "100% cotton flatweave",
    care: "Machine wash cold, gentle, in a large-capacity machine. Line dry flat in the shade. Larger sizes may need a laundromat.",
    pattern: "stripe",
    colours: [C.rainforest, C.dusk],
    sizes: [
      { label: "120×180cm", price: 21900 },
      { label: "160×230cm", price: 34900 },
    ],
    isNew: true,
  },
  {
    slug: "harbour-check-rug",
    name: "Harbour Check Rug",
    category: "rugs",
    collection: "area-rugs",
    tagline: "A soft wool-blend check that works in every room.",
    description:
      "A relaxed hand-loomed check in a soft wool and cotton blend. Calm enough for bedrooms, tough enough for the living room.",
    details: ["Hand-loomed", "Wool and cotton blend", "Low pile — doors swing over easily"],
    material: "70% wool, 30% cotton",
    care: "Vacuum weekly without the beater bar. Spot clean with mild wool detergent.",
    pattern: "check",
    colours: [{ ...C.harbour, accent: "#EFE8DC" }, { ...C.sage, accent: "#F7F4EC" }],
    sizes: [
      { label: "160×230cm", price: 47900 },
      { label: "200×290cm", price: 69900 },
    ],
  },
  // ─── Runners ─────────────────────────────────────────────────
  {
    slug: "mallee-hallway-runner",
    name: "Mallee Hallway Runner",
    category: "rugs",
    collection: "runners",
    tagline: "A long wool runner for hardworking hallways.",
    description:
      "Named for the tough little eucalypts of the Mallee. A dense wool runner built for the busiest strip of floor in the house — from the front door to the kitchen.",
    details: ["Dense wool pile", "Two lengths to suit most hallways", "Hand-knotted fringe"],
    material: "100% New Zealand wool",
    care: "Vacuum weekly. Blot spills immediately. Rotate end-to-end every few months.",
    pattern: "stripe",
    colours: [C.ochre, C.eucalypt],
    sizes: [
      { label: "80×300cm", price: 22900 },
      { label: "80×400cm", price: 29900 },
    ],
    reviews: [
      { name: "Grace", location: "Subiaco, WA", rating: 5, title: "Perfect for our long hallway", body: "The 4m length fits our federation hallway perfectly. Colour is spot on." },
    ],
  },
  {
    slug: "coastline-washable-runner",
    name: "Coastline Washable Runner",
    category: "rugs",
    collection: "runners",
    tagline: "Machine-washable runner for kitchens and entries.",
    description:
      "A slim, washable cotton runner for the spots that get grubby fastest — the kitchen sink, the back door, the laundry.",
    details: ["Machine washable", "Non-slip underlay recommended", "Low profile"],
    material: "100% cotton",
    care: "Machine wash cold, gentle. Line dry flat.",
    pattern: "diamond",
    colours: [C.saltpan, C.harbour],
    sizes: [
      { label: "70×200cm", price: 14900 },
      { label: "70×300cm", price: 19900 },
    ],
  },
];

// Deterministic "stock levels" so the demo shows in-stock, low-stock and sold-out states.
function stockFor(i: number, j: number) {
  const n = (i * 7 + j * 13) % 23;
  if (n === 5) return 0;
  if (n < 4) return 3;
  return 10 + n * 2;
}

function skuPart(s: string) {
  return s.replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase();
}

async function main() {
  for (const [i, p] of products.entries()) {
    const { colours, sizes, reviews, details, ...rest } = p;
    const data = { ...rest, details: JSON.stringify(details) };
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      create: data,
      update: data,
    });

    await prisma.variant.deleteMany({
      where: { productId: product.id, orderItems: { none: {} } },
    });
    let j = 0;
    for (const colour of colours) {
      for (const size of sizes) {
        const sku = `WW-${skuPart(p.slug)}-${skuPart(colour.name)}-${skuPart(size.label)}-${i}${j}`;
        await prisma.variant.upsert({
          where: { sku },
          create: {
            productId: product.id,
            sku,
            colourName: colour.name,
            colourHex: colour.hex,
            accentHex: colour.accent,
            size: size.label,
            priceCents: size.price,
            compareAtCents: size.compareAt ?? null,
            stock: stockFor(i, j),
            sortOrder: j,
          },
          update: { priceCents: size.price, compareAtCents: size.compareAt ?? null },
        });
        j++;
      }
    }

    await prisma.review.deleteMany({ where: { productId: product.id } });
    for (const [k, r] of (reviews ?? []).entries()) {
      await prisma.review.create({
        data: {
          ...r,
          productId: product.id,
          approved: true,
          createdAt: new Date(Date.now() - (k * 17 + i * 3 + 4) * 86400000),
        },
      });
    }
  }

  await prisma.discountCode.upsert({
    where: { code: "WELCOME10" },
    create: { code: "WELCOME10", percentOff: 10, oncePerEmail: true },
    update: {},
  });

  console.log(`Seeded ${products.length} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
