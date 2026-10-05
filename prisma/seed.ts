/**
 * Seeds the starter catalogue. Safe to re-run: products are upserted by slug
 * and their variants, images and reviews replaced. Orders, subscribers and
 * messages are never touched.
 *
 * BEFORE LAUNCH
 * - Photos are free-licence Unsplash stand-ins (https://unsplash.com/license).
 *   They are not photos of your stock. Replace them with your own before you
 *   sell anything, or product pages will misrepresent what people receive.
 * - Product copy (materials, GSM, sizes) must match the real products.
 * - Run with SEED_REVIEWS=false. Fake reviews breach the Australian Consumer Law.
 */
import { config } from "dotenv";
config({ path: [".env.local", ".env"], quiet: true });

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "../app/generated/prisma/client";

const SEED_REVIEWS = process.env.SEED_REVIEWS !== "false";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./prisma/dev.db" }),
});

const u = (id: string) => `https://images.unsplash.com/photo-${id}`;

type Colour = { name: string; hex: string; accent?: string; images: [string, string][] };
type Size = { label: string; price: number; compareAt?: number };
type Seed = {
  slug: string;
  name: string;
  category: "bath" | "bedding" | "rugs" | "leather";
  collection: string;
  tagline: string;
  description: string;
  details: string[];
  material: string;
  care: string;
  colours: Colour[];
  sizes: Size[];
  /** Shots that apply to every colour (lifestyle, detail) as [photo id, alt] */
  shared?: [string, string][];
  featured?: boolean;
  bestseller?: boolean;
  isNew?: boolean;
  monogramable?: boolean;
  reviews?: { name: string; location: string; rating: number; title: string; body: string }[];
};

const TOWEL_CARE =
  "Wash warm (40°C) with similar colours. Use half the usual detergent and skip fabric softener, which makes towels less absorbent. Line dry in the shade or tumble dry low.";

const products: Seed[] = [
  // ── Bath towels ─────────────────────────────────────────────
  {
    slug: "everyday-bath-towel",
    name: "Everyday Bath Towel",
    category: "bath",
    collection: "bath-towels",
    tagline: "Heavy cotton terry. Soft from the first wash and still soft years later.",
    description:
      "Our most popular towel. 600gsm long-loop cotton, woven with a flat dobby border so it hangs straight on the rail. It's absorbent without being so thick that it never dries.",
    details: ["600gsm cotton terry", "Flat dobby border", "Hanging loop", "Pre-washed to reduce lint"],
    material: "100% cotton, 600gsm",
    care: TOWEL_CARE,
    colours: [
      { name: "White", hex: "#F3F1EC", images: [["1760722974657-f64bce2f9cc5", "Stack of white bath towels"], ["1724847885015-be191f1a47ef", "White towels folded on a rack"], ["1596683705523-eb49540c3934", "White towel hanging in morning light"]] },
      { name: "Stone", hex: "#B8B4AD", images: [["1728034261564-18930dcb2c8e", "Folded stone grey towels"], ["1638232928539-6e91c47ddec5", "Rolled grey towel showing the terry loops"]] },
      { name: "Mocha", hex: "#6D5646", images: [["1650481093978-6cc58e4649f4", "Mocha and stone towels on a timber stool"], ["1608651061499-ff031fbf6645", "Mocha towel on a heated rail"]] },
      { name: "Rust", hex: "#A1472B", images: [["1628602813528-0264682cdc87", "Rust towels rolled on a rail"]] },
    ],
    sizes: [
      { label: "Hand towel 50 × 90cm", price: 2200 },
      { label: "Bath towel 70 × 140cm", price: 4500 },
      { label: "Bath sheet 90 × 165cm", price: 5900 },
    ],
    bestseller: true,
    featured: true,
    monogramable: true,
    reviews: [
      { name: "Kate M.", location: "Randwick NSW", rating: 5, title: "Bought four more", body: "Thick without being heavy, and they dry overnight in our bathroom. Bought two in White, went back for four in Stone." },
      { name: "Tom", location: "Geelong VIC", rating: 4, title: "Good towels", body: "Some lint for the first couple of washes, which they warn you about. Fine after that." },
      { name: "Priya S.", location: "Paddington QLD", rating: 5, title: "Bath sheet is big", body: "The bath sheet is properly big. Order the bath towel if your rail is short." },
    ],
  },
  {
    slug: "stripe-bath-towel",
    name: "Stripe Bath Towel",
    category: "bath",
    collection: "bath-towels",
    tagline: "A wide navy stripe, woven in rather than printed.",
    description:
      "Same weight and feel as our Everyday towel, with a yarn-dyed stripe that won't fade on the line. Works in a white bathroom, a beach house or a kid's room.",
    details: ["600gsm cotton terry", "Yarn-dyed stripe", "Hanging loop"],
    material: "100% cotton, 600gsm",
    care: TOWEL_CARE,
    colours: [
      { name: "Navy Stripe", hex: "#2F4A7A", accent: "#F4F2EC", images: [["1635353059173-461b9c459f2a", "Folded navy and white striped towels"], ["1740031071401-1ed240e00b7a", "Rolled navy stripe towels"]] },
    ],
    sizes: [
      { label: "Hand towel 50 × 90cm", price: 2500 },
      { label: "Bath towel 70 × 140cm", price: 4900 },
      { label: "Bath sheet 90 × 165cm", price: 6500 },
    ],
    bestseller: true,
    monogramable: true,
    reviews: [{ name: "Chloe", location: "Manly NSW", rating: 5, title: "Stripe hasn't faded", body: "Six months of line drying and the navy is still dark." }],
  },
  {
    slug: "waffle-towel",
    name: "Waffle Towel",
    category: "bath",
    collection: "bath-towels",
    tagline: "Lightweight waffle weave that dries fast in humid bathrooms.",
    description:
      "Less fabric against your skin and more air in the weave, so it dries in a few hours instead of a day. Good for small bathrooms without a window, the gym bag, and travel.",
    details: ["Deep waffle weave", "Dries much faster than terry", "Packs down small", "Shrinks slightly on first wash, which tightens the weave"],
    material: "100% cotton waffle",
    care: "Wash warm. Tumble dry low or line dry. Expect around 3% shrinkage on the first wash.",
    colours: [
      { name: "Oat", hex: "#D6C4A6", images: [["1758192496546-dc59dd3baa59", "Oat waffle towel hanging on a tiled wall"], ["1626325138381-c6b2309e3da4", "Oat waffle towel on a timber hanger"]] },
      { name: "Blush", hex: "#E8C8C1", images: [["1787074614697-dadf1123b83f", "Two folded blush waffle towels"]] },
    ],
    sizes: [
      { label: "Bath towel 70 × 140cm", price: 4200 },
      { label: "Bath sheet 90 × 165cm", price: 5500 },
    ],
    isNew: true,
    monogramable: true,
    reviews: [
      { name: "Hannah", location: "Cairns QLD", rating: 5, title: "Actually dries", body: "Our bathroom has no window and these are dry by lunchtime." },
      { name: "Jess", location: "Newtown NSW", rating: 4, title: "Different feel", body: "Thinner than a normal towel, takes a week to get used to. I prefer them now." },
    ],
  },
  // ── Hand towels ─────────────────────────────────────────────
  {
    slug: "hand-towel-pair",
    name: "Hand Towel Pair",
    category: "bath",
    collection: "hand-towels",
    tagline: "Two hand towels for the basin or the guest bathroom.",
    description: "Cut from the same 600gsm cotton as our Everyday towel, sold as a pair.",
    details: ["Set of two", "50 × 90cm each", "600gsm cotton"],
    material: "100% cotton, 600gsm",
    care: TOWEL_CARE,
    colours: [
      { name: "White", hex: "#F3F1EC", images: [["1620000190821-abd8f262b86f", "White hand towel on a ring against stone"]] },
      { name: "Charcoal", hex: "#3B3B3D", images: [["1616663717839-2fea42e1a1f6", "Charcoal and white towels hanging by a bath"]] },
    ],
    sizes: [{ label: "Pair · 50 × 90cm", price: 3500, compareAt: 4400 }],
    monogramable: true,
  },
  {
    slug: "face-washer-set",
    name: "Face Washer Set",
    category: "bath",
    collection: "hand-towels",
    tagline: "Four face washers with hanging loops.",
    description: "Small, soft, and the towel that gets used most. Four 30 × 30cm washers in one colour.",
    details: ["Set of four", "30 × 30cm each", "Hanging loop on each"],
    material: "100% cotton, 600gsm",
    care: TOWEL_CARE,
    colours: [{ name: "Forest", hex: "#2E4A39", images: [["1574421233376-06f2ccf017f7", "Forest green and white face washers folded"]] }],
    sizes: [{ label: "Set of 4 · 30 × 30cm", price: 2400 }],
  },
  // ── Beach towels ────────────────────────────────────────────
  {
    slug: "pool-stripe-beach-towel",
    name: "Pool Stripe Beach Towel",
    category: "bath",
    collection: "beach-towels",
    tagline: "Thick cabana-stripe terry, long enough for a banana lounge.",
    description:
      "A proper plush beach towel at 90 × 180cm with a wide woven stripe. Heavier than our flat-weave, so better for the pool than a long beach walk.",
    details: ["500gsm cotton terry", "90 × 180cm", "Woven cabana stripe"],
    material: "100% cotton terry, 500gsm",
    care: "Rinse in fresh water after salt or chlorine. Wash warm, line dry in the shade.",
    colours: [
      { name: "Sky Stripe", hex: "#7EA6D4", accent: "#F4F6F8", images: [["1764114656382-6ad79e1a6b42", "Sky blue striped towel on a pool lounger"], ["1562953223-1b8b9e9870b4", "Striped towel on the sand"]] },
    ],
    sizes: [{ label: "90 × 180cm", price: 5900 }],
    bestseller: true,
    monogramable: true,
    reviews: [{ name: "Ben", location: "Scarborough WA", rating: 5, title: "Big and thick", body: "Fits the whole sun lounge. Takes a while to dry, but that's the trade-off for this thickness." }],
  },
  {
    slug: "flat-weave-beach-towel",
    name: "Flat-Weave Beach Towel",
    category: "bath",
    collection: "beach-towels",
    tagline: "Light, quick-drying, and sand shakes straight off.",
    description:
      "No loops for sand to get stuck in. It folds down to nothing, dries in an hour in the sun, and doubles as a picnic rug.",
    details: ["Flat cotton weave", "Sand shakes off", "Dries in about an hour in the sun", "Knotted fringe"],
    material: "100% cotton flat weave",
    care: "Wash cold and line dry. Gets softer with every wash.",
    colours: [
      { name: "Indigo Stripe", hex: "#3E5EA6", accent: "#F4F2EC", images: [["1760783320488-9af5d3217f50", "White towel with indigo stripes on coastal rocks"]] },
    ],
    shared: [["1716222165030-134497641aef", "Towel laid out on an empty beach"]],
    sizes: [{ label: "90 × 170cm", price: 5500 }],
  },
  {
    slug: "turkish-towel",
    name: "Turkish Towel",
    category: "bath",
    collection: "beach-towels",
    tagline: "Hand-loomed peshtemal. Beach towel, sarong or throw.",
    description:
      "Thin, strong and quick to dry, with a hand-knotted fringe. It takes up almost no room in a bag, and it gets softer and more absorbent the more you wash it.",
    details: ["Hand-loomed", "Hand-knotted fringe", "100 × 180cm", "Packs very small"],
    material: "100% Turkish cotton",
    care: "Wash cold on a gentle cycle. Line dry. Don't tumble dry, which frays the fringe.",
    colours: [
      { name: "Natural", hex: "#E4DAC7", images: [["1684248655527-46bee8e79029", "Rolled natural Turkish towels with fringe"], ["1719957770743-5040a9ed16d7", "Stack of natural Turkish towels"]] },
      { name: "Rose Stripe", hex: "#E0B3AE", accent: "#F6F1EA", images: [["1686125429003-f552c9f16504", "Rose striped Turkish towel with flowers on the sand"]] },
    ],
    shared: [["1703011512873-821e62ec001a", "Turkish towels hanging on a rack"]],
    sizes: [{ label: "100 × 180cm", price: 4900 }],
    isNew: true,
  },
  // ── Bath mats ───────────────────────────────────────────────
  {
    slug: "chenille-bath-mat",
    name: "Chenille Bath Mat",
    category: "rugs",
    collection: "bath-mats",
    tagline: "Deep chenille pile that soaks up water quickly.",
    description: "Thick, soft chenille loops on a non-slip backing. Throw it in the washing machine when it needs it.",
    details: ["Chenille pile", "Non-slip backing", "Machine washable", "50 × 80cm"],
    material: "Cotton-blend chenille, TPR backing",
    care: "Machine wash cold, gentle. Line dry. Don't tumble dry, as heat damages the backing.",
    colours: [
      { name: "White", hex: "#F1EFEA", images: [["1681742308509-e32e0a7c2cb8", "Close-up of white chenille bath mat"]] },
      { name: "Lagoon", hex: "#2BA3B8", images: [["1588425737388-0a32c46bd842", "Close-up of lagoon blue chenille bath mat"]] },
    ],
    sizes: [{ label: "50 × 80cm", price: 3900 }],
    bestseller: true,
  },
  {
    slug: "memory-foam-bath-mat",
    name: "Memory Foam Bath Mat",
    category: "rugs",
    collection: "bath-mats",
    tagline: "Cushioned and low enough for the door to swing over.",
    description: "A soft microfibre top over memory foam, with a grippy base. Low profile, so it works in front of the shower or the vanity.",
    details: ["Memory foam core", "Non-slip base", "Low profile", "50 × 80cm"],
    material: "Microfibre top, memory foam core",
    care: "Machine wash cold, gentle. Air dry flat.",
    colours: [{ name: "Grey", hex: "#6E7176", images: [["1687526360728-f1af24aac201", "Grey memory foam bath mat on a tiled floor"]] }],
    sizes: [{ label: "50 × 80cm", price: 3500 }],
  },
  // ── Area rugs ───────────────────────────────────────────────
  {
    slug: "braided-jute-rug",
    name: "Braided Jute Rug",
    category: "rugs",
    collection: "area-rugs",
    tagline: "Hand-braided natural jute. Warm, textured and hard-wearing.",
    description:
      "Jute is a fast-growing, biodegradable plant fibre with a coarse, warm texture. It suits living rooms and bedrooms. Keep it away from bathrooms and wet areas.",
    details: ["Hand-braided jute", "Low pile", "Best for dry, low-to-medium traffic areas", "Use with an underlay on hard floors"],
    material: "100% jute",
    care: "Vacuum regularly. Blot spills straight away with a dry cloth. Don't steam clean or shampoo.",
    colours: [{ name: "Natural", hex: "#C3A57A", images: [["1778088442792-29c430a4c93f", "Braided jute rug under a tan leather sofa"]] }],
    sizes: [
      { label: "160 × 230cm", price: 38900 },
      { label: "200 × 300cm", price: 59900 },
    ],
    bestseller: true,
    featured: true,
    reviews: [
      { name: "Olivia", location: "Brunswick Heads NSW", rating: 5, title: "Great texture", body: "Looks more expensive than it was. Smelled a bit earthy for the first week." },
      { name: "Aaron", location: "Canberra ACT", rating: 4, title: "Sheds a little", body: "Some fibres on the floor when you vacuum. Expected with jute." },
    ],
  },
  {
    slug: "round-jute-rug",
    name: "Round Jute Rug",
    category: "rugs",
    collection: "area-rugs",
    tagline: "A braided round rug for reading corners and entryways.",
    description: "Tightly braided jute in a round shape. Good under a small table, beside a bed, or anywhere a rectangle feels too formal.",
    details: ["Hand-braided jute", "Round", "Three sizes"],
    material: "100% jute",
    care: "Vacuum regularly. Blot spills with a dry cloth. Keep out of damp areas.",
    colours: [
      { name: "Natural", hex: "#C9A874", images: [["1762758889413-64d717f81b0d", "Round jute rug half rolled on a timber floor"], ["1762280237553-e58441808e0c", "Round jute rug under an armchair"]] },
      { name: "Espresso", hex: "#4E3A2B", images: [["1774574073159-7f1e4b9ca786", "Cat sitting on an espresso round jute rug"]] },
    ],
    sizes: [
      { label: "120cm round", price: 16900 },
      { label: "150cm round", price: 22900 },
      { label: "180cm round", price: 31900 },
    ],
  },
  {
    slug: "kilim-flatweave-rug",
    name: "Kilim Flatweave Rug",
    category: "rugs",
    collection: "area-rugs",
    tagline: "A hand-woven wool kilim with a knotted fringe.",
    description:
      "Traditional flat-woven wool in blues, reds and cream. Reversible, light enough to move around, and patterned enough to hide a lot of life.",
    details: ["Hand-woven wool", "Reversible", "Knotted fringe", "Each one varies slightly"],
    material: "Wool pile on a cotton warp",
    care: "Vacuum without the beater bar. Blot spills. Rotate every six months. Professional clean once a year.",
    colours: [
      { name: "Multi", hex: "#3C5E8A", accent: "#B23A2E", images: [["1594040226829-7f251ab46d80", "Kilim rug with fringe on a light floor"], ["1606885118474-c8baf907e998", "Close-up of the kilim weave"]] },
    ],
    sizes: [
      { label: "120 × 180cm", price: 28900 },
      { label: "160 × 230cm", price: 45900 },
    ],
    featured: true,
    reviews: [{ name: "Sophie", location: "Broome WA", rating: 5, title: "Better in person", body: "The colours are richer than the photos. Really well made." }],
  },
  {
    slug: "indigo-flatweave-rug",
    name: "Indigo Flatweave Rug",
    category: "rugs",
    collection: "area-rugs",
    tagline: "A washable cotton flatweave in deep indigo.",
    description:
      "Reversible cotton with a fine texture and a short fringe. The 160 × 230 fits most large front-loaders, so spills are a wash cycle away from gone.",
    details: ["Cotton flatweave", "Reversible", "Machine washable (check your drum size)", "Short fringe"],
    material: "100% cotton",
    care: "Machine wash cold, gentle, in a large-capacity machine. Dry flat in the shade.",
    colours: [{ name: "Indigo", hex: "#2D4C84", images: [["1759146464279-af282e1d2c73", "Indigo flatweave rug on a timber floor"]] }],
    sizes: [
      { label: "160 × 230cm", price: 32900 },
      { label: "200 × 290cm", price: 47900 },
    ],
    isNew: true,
  },
  {
    slug: "geometric-flatweave-rug",
    name: "Geometric Flatweave Rug",
    category: "rugs",
    collection: "area-rugs",
    tagline: "Hand-drawn black lines on ivory wool.",
    description: "A simple zigzag pattern that works in new and old homes alike. Flat-woven, so doors swing over it easily.",
    details: ["Flat-woven wool", "Low profile", "Hand-finished edges"],
    material: "Wool and cotton blend",
    care: "Vacuum without the beater bar. Spot clean with wool detergent.",
    colours: [{ name: "Ivory / Black", hex: "#E9E5DC", accent: "#1F1F1F", images: [["1773423868661-44a3e7701ebb", "Ivory and black geometric flatweave rug"]] }],
    sizes: [{ label: "160 × 230cm", price: 39900 }],
  },
  {
    slug: "brushstroke-rug",
    name: "Brushstroke Rug",
    category: "rugs",
    collection: "area-rugs",
    tagline: "Ink-black strokes on a soft ivory ground.",
    description: "Graphic without being loud. A dense, hand-tufted wool rug that's soft enough to sit on.",
    details: ["Hand-tufted wool", "Medium pile", "Felt backing"],
    material: "Wool pile, cotton backing",
    care: "Vacuum without the beater bar. New wool rugs shed for the first few months.",
    colours: [{ name: "Ivory / Ink", hex: "#EEEBE4", accent: "#1C2430", images: [["1762356317094-5826049a3641", "Ivory rug with black brushstroke rectangles"]] }],
    sizes: [{ label: "160 × 230cm", price: 44900 }],
    isNew: true,
  },
  {
    slug: "cloud-shag-rug",
    name: "Cloud Shag Rug",
    category: "rugs",
    collection: "area-rugs",
    tagline: "Deep, soft pile you'll want to lie on.",
    description: "A plush cream shag for bedrooms and living rooms. Soft underfoot, and it quietens a room with hard floors.",
    details: ["Deep pile", "Soft underfoot", "Best in low-traffic rooms"],
    material: "Polyester shag, cotton backing",
    care: "Vacuum with suction only. Shake out outdoors. Spot clean.",
    colours: [
      { name: "Cream", hex: "#E8DFD0", images: [["1778936317684-291cfdbad2b5", "Cream shag rug in a light living room"], ["1745589720030-c32f81367a57", "Close-up of the shag pile in sunlight"]] },
    ],
    sizes: [
      { label: "160 × 230cm", price: 49900 },
      { label: "200 × 300cm", price: 74900 },
    ],
  },
  // ── Runners ─────────────────────────────────────────────────
  {
    slug: "textured-runner",
    name: "Textured Hallway Runner",
    category: "rugs",
    collection: "runners",
    tagline: "A neutral loop-pile runner for the busiest strip of floor.",
    description: "Dense and hard-wearing, in an oatmeal tone that hides dust and footprints. Two lengths to fit most hallways.",
    details: ["Loop pile", "Two lengths", "Use with a non-slip underlay"],
    material: "Wool and viscose blend",
    care: "Vacuum weekly. Rotate end to end every few months.",
    colours: [{ name: "Oatmeal", hex: "#CFC4B2", images: [["1766052409111-0bd046af4be1", "Oatmeal textured runner on a timber floor"]] }],
    sizes: [
      { label: "80 × 300cm", price: 21900 },
      { label: "80 × 400cm", price: 27900 },
    ],
    reviews: [{ name: "Grace", location: "Subiaco WA", rating: 5, title: "Fits our hallway", body: "The 4m length suits our old federation hallway. Doesn't show dirt." }],
  },
  {
    slug: "painted-stripe-runner",
    name: "Painted Stripe Runner",
    category: "rugs",
    collection: "runners",
    tagline: "Blocks of ochre, rust and ink on a pale ground.",
    description: "A runner with some personality. Flat-woven, reversible, and easy to lift and shake out.",
    details: ["Flat-woven", "Reversible", "70cm wide"],
    material: "Cotton and wool",
    care: "Vacuum regularly. Spot clean. Dry clean if needed.",
    colours: [{ name: "Ochre Multi", hex: "#D6A43A", accent: "#8A3C22", images: [["1765802536365-e2267a489a2c", "Runner with ochre, rust and black stripes"]] }],
    sizes: [{ label: "70 × 300cm", price: 24900 }],
    isNew: true,
  },
  // ── Quilts ──────────────────────────────────────────────────
  {
    slug: "merino-wool-quilt",
    name: "Australian Merino Wool Quilt",
    category: "bedding",
    collection: "quilts",
    tagline: "Merino wool fill in a cotton sateen shell. Warm in winter, never clammy.",
    description:
      "Wool breathes and moves moisture away from you, so you sleep warm without overheating. Filled with Australian merino wool at 500gsm, the all-season weight for most of the country, and stitched in boxes so the fill stays put.",
    details: ["Australian merino wool fill", "500gsm all-season weight", "Cotton sateen shell", "Box-stitched to stop the fill shifting", "Corner ties for your quilt cover"],
    material: "Fill: 100% Australian merino wool. Shell: 100% cotton sateen",
    care: "Air it in the shade every few weeks. Spot clean the shell. Professional wool clean when needed; do not machine wash.",
    colours: [
      { name: "White", hex: "#F4F2EC", images: [["1506720186575-11354d325017", "White wool quilt on a low bed by the window"], ["1517912181842-e5a9d4701a4e", "Wool quilt on a timber bed in soft light"], ["1542728929-2b5d9a0c8d48", "Close-up of the quilt's cotton sateen shell"]] },
    ],
    sizes: [
      { label: "Single 140 × 210cm", price: 22900 },
      { label: "Double 180 × 210cm", price: 26900 },
      { label: "Queen 210 × 210cm", price: 29900 },
      { label: "King 240 × 210cm", price: 34900 },
      { label: "Super King 270 × 240cm", price: 39900 },
    ],
    bestseller: true,
    featured: true,
    reviews: [
      { name: "Megan", location: "Ballarat VIC", rating: 5, title: "Best quilt we've owned", body: "Warm through a Ballarat winter but we don't wake up sweaty like we did with the down one." },
      { name: "Rob", location: "Launceston TAS", rating: 5, title: "Worth it", body: "Heavier than I expected in a good way. Airs out quickly on the line." },
    ],
  },
  {
    slug: "bamboo-summer-quilt",
    name: "Bamboo Summer Quilt",
    category: "bedding",
    collection: "quilts",
    tagline: "A light 250gsm quilt for hot, humid nights.",
    description:
      "Bamboo-blend fill in a soft cotton shell, light enough for a Brisbane January and breathable enough to stay on the bed. Machine washable at home.",
    details: ["Bamboo and polyester blend fill", "250gsm summer weight", "Cotton shell", "Machine washable"],
    material: "Fill: 50% bamboo-derived viscose, 50% polyester. Shell: 100% cotton",
    care: "Machine wash cold on a gentle cycle in a large-capacity machine. Line dry flat in the shade.",
    colours: [
      { name: "White", hex: "#F1F1EE", images: [["1688384452844-8364c3e2fc28", "Light bamboo quilt on a timber bed"], ["1601276174812-63280a55656e", "Summer quilt in afternoon sun"]] },
    ],
    sizes: [
      { label: "Queen 210 × 210cm", price: 19900 },
      { label: "King 240 × 210cm", price: 22900 },
      { label: "Super King 270 × 240cm", price: 25900 },
    ],
    isNew: true,
  },
  // ── Bed linen ───────────────────────────────────────────────
  {
    slug: "french-linen-quilt-cover",
    name: "French Linen Quilt Cover Set",
    category: "bedding",
    collection: "bed-linen",
    tagline: "Stonewashed French flax linen. Soft from day one, and it only gets better.",
    description:
      "Woven from French-grown flax and stonewashed for a soft, lived-in feel. Linen is breathable in summer and holds warmth in winter. The set includes a quilt cover with hidden button closure and two matching standard pillowcases.",
    details: ["100% French flax linen", "Stonewashed", "Quilt cover with hidden coconut-button closure", "Two standard pillowcases (48 × 73cm)", "Inner corner ties"],
    material: "100% linen from French flax",
    care: "Machine wash cold or warm on a gentle cycle. Line dry or tumble dry low. Linen is meant to look relaxed; no ironing needed.",
    colours: [
      { name: "White", hex: "#F3F1EB", images: [["1698746044395-85beb2b04522", "White linen quilt cover in a bright bedroom"], ["1597308451192-d17c89701ef5", "Close-up of white linen pillowcases"]] },
      { name: "Stone", hex: "#B8B2A8", images: [["1564019472231-4586c552dc27", "Stone grey linen bedding, unmade"], ["1614617021766-d00d5d28b1ab", "Stone linen in low morning light"]] },
      { name: "Sage", hex: "#7E8C74", images: [["1639813806536-11895df1ff64", "Sage linen bedding on a timber bed"], ["1640348307767-b8e8bc765ff5", "Sage linen quilt cover and pillows"]] },
      { name: "Mocha", hex: "#8A7765", images: [["1619001904482-b0628b82b3e9", "Mocha linen quilt cover, rumpled"]] },
    ],
    sizes: [
      { label: "Queen", price: 28900 },
      { label: "King", price: 32900 },
      { label: "Super King", price: 35900 },
    ],
    bestseller: true,
    reviews: [
      { name: "Alice", location: "Fremantle WA", rating: 5, title: "Softer than expected", body: "No break-in period at all. The Sage is a lovely muted green." },
      { name: "James", location: "Paddington NSW", rating: 4, title: "Great linen, runs slightly big", body: "Quality is excellent. Our King cover is a touch generous on the quilt, which I actually prefer." },
    ],
  },
  {
    slug: "linen-sheet-set",
    name: "Linen Sheet Set",
    category: "bedding",
    collection: "bed-linen",
    tagline: "Flat sheet, fitted sheet and two pillowcases in stonewashed linen.",
    description:
      "The same French flax linen as our quilt covers. The fitted sheet has a 40cm wall with elastic all the way around, so it stays on thicker mattresses and toppers.",
    details: ["100% French flax linen", "Fitted sheet with 40cm wall", "Flat sheet", "Two standard pillowcases"],
    material: "100% linen from French flax",
    care: "Machine wash cold or warm on a gentle cycle. Line dry or tumble dry low.",
    colours: [
      { name: "White", hex: "#F3F1EB", images: [["1617325247661-675ab4b64ae2", "White linen sheets on a timber bed with cushions"], ["1606855637183-ea2a00b6f15f", "White linen bed in a bright room"]] },
      { name: "Oat", hex: "#E6DCC6", images: [["1634665810235-011d663754e7", "Close-up of oat linen sheet"], ["1653601983541-a70f6f1e715b", "Oat linen pillowcases by the window"]] },
    ],
    sizes: [
      { label: "Queen", price: 24900 },
      { label: "King", price: 27900 },
    ],
  },
  {
    slug: "mulberry-silk-pillowcase",
    name: "Mulberry Silk Pillowcase",
    category: "bedding",
    collection: "bed-linen",
    tagline: "22 momme mulberry silk. Kinder to hair and skin.",
    description:
      "Silk creates less friction than cotton, so there's less frizz and fewer creases in the morning. Made from 22 momme mulberry silk with a hidden zip.",
    details: ["22 momme mulberry silk", "Hidden zip closure", "Standard size 48 × 73cm", "Sold individually, gift boxed"],
    material: "100% mulberry silk, 22 momme",
    care: "Hand wash cold or machine wash cold in a laundry bag with silk detergent. Dry flat in the shade.",
    colours: [
      { name: "Ivory", hex: "#EFE7D8", images: [["1606259457945-67dc66271ee6", "Ivory mulberry silk in soft folds"]] },
      { name: "Silver", hex: "#C9C7C4", images: [["1620770511161-f36f500b60cd", "Silver mulberry silk close up"]] },
      { name: "Blush", hex: "#DDB9B5", images: [["1606603049694-941214e2ac34", "Blush mulberry silk close up"]] },
    ],
    sizes: [{ label: "Standard 48 × 73cm", price: 7900 }],
    isNew: true,
  },
  // ── Throws & blankets ───────────────────────────────────────
  {
    slug: "chunky-knit-throw",
    name: "Chunky Knit Throw",
    category: "bedding",
    collection: "throws-blankets",
    tagline: "Hand-knitted in thick, soft chenille yarn.",
    description:
      "Big loops, real weight, and a throw that looks as good folded at the end of the bed as it does on the couch. Knitted by hand, so no two are exactly the same.",
    details: ["Hand-knitted", "Chenille yarn, won't shed or pill like wool roving", "120 × 150cm", "Weighs about 2.5kg"],
    material: "100% polyester chenille",
    care: "Hand wash cold or machine wash cold in a large laundry bag. Dry flat.",
    colours: [
      { name: "Cream", hex: "#EFE9DD", images: [["1674475762498-75310193b4f4", "Cream chunky knit throw folded on a bench"], ["1674475760738-8c7af859f821", "Cream chunky knit throw over a sofa"]] },
      { name: "Charcoal", hex: "#55575A", images: [["1674475760615-73cb0da3796a", "Charcoal chunky knit throw at the end of a bed"]] },
      { name: "Navy", hex: "#23304A", images: [["1674475761234-e6d3c4fe7b52", "Navy chunky knit throw on a timber chair"]] },
    ],
    sizes: [{ label: "120 × 150cm", price: 16900 }],
    bestseller: true,
  },
  {
    slug: "merino-wool-throw",
    name: "Merino Wool Throw",
    category: "bedding",
    collection: "throws-blankets",
    tagline: "Fine merino with a hand-twisted fringe.",
    description:
      "A lightweight woven throw in soft merino wool. Warm enough for a cold evening on the couch, light enough to take in the car.",
    details: ["100% merino wool", "Hand-twisted fringe", "130 × 180cm"],
    material: "100% merino wool",
    care: "Hand wash cold with wool wash, or dry clean. Dry flat in the shade.",
    colours: [
      { name: "Oat", hex: "#C9B79A", images: [["1637819976869-928427bd7380", "Oat merino throw with fringe, folded"]] },
      { name: "Denim", hex: "#6F7F9A", images: [["1608158222851-af032106bca9", "Denim blue merino throw with fringe"]] },
    ],
    sizes: [{ label: "130 × 180cm", price: 21900 }],
  },
  {
    slug: "woven-wool-blanket",
    name: "Woven Wool Blanket",
    category: "bedding",
    collection: "throws-blankets",
    tagline: "A heavyweight woven blanket for the end of the bed.",
    description:
      "Dense, woven wool in a classic check or herringbone. The kind of blanket you keep for decades and pass on.",
    details: ["Woven wool", "Blanket-stitched edges", "Two sizes"],
    material: "90% wool, 10% nylon",
    care: "Dry clean, or hand wash cold with wool wash. Dry flat.",
    colours: [
      { name: "Tobacco Check", hex: "#5C4432", accent: "#B89B7A", images: [["1730705123286-fc037477e7dd", "Tobacco check wool blanket close up"]] },
      { name: "Mustard Herringbone", hex: "#C99A2E", images: [["1734553529922-bc020a21643b", "Stack of mustard herringbone wool blankets"]] },
    ],
    sizes: [
      { label: "Throw 130 × 180cm", price: 19900 },
      { label: "Queen 230 × 250cm", price: 32900 },
    ],
  },
  // ── Leather: bags ───────────────────────────────────────────
  {
    slug: "leather-weekender",
    name: "The Weekender",
    category: "leather",
    collection: "bags",
    tagline: "A full-grain leather duffel sized for two or three nights away.",
    description:
      "Cut from thick full-grain leather that darkens and softens with use. Solid brass hardware, a cotton-lined interior with a zip pocket, and a detachable shoulder strap. It fits in most overhead lockers.",
    details: ["Full-grain cowhide leather", "Solid brass hardware", "Cotton canvas lining, internal zip pocket", "Detachable padded shoulder strap", "50 × 26 × 28cm, about 36 litres"],
    material: "Full-grain cowhide, brass, cotton canvas lining",
    care: "Wipe with a dry cloth. Condition with a leather balm every few months. Keep out of prolonged direct sun. Marks and creases are part of how full-grain leather ages.",
    colours: [
      { name: "Espresso", hex: "#3E2419", images: [["1525103504173-8dc1582c7430", "Espresso leather weekender on an open road"]] },
      { name: "Tan", hex: "#9A5F32", images: [["1781514041306-489a8d346265", "Tan leather weekender on stone steps"]] },
    ],
    sizes: [{ label: "One size", price: 44900 }],
    featured: true,
    monogramable: true,
    reviews: [
      { name: "Daniel", location: "Surry Hills NSW", rating: 5, title: "Beautiful bag", body: "Heavier than nylon, obviously, but it looks better every trip. Initials were a nice touch." },
    ],
  },
  {
    slug: "leather-satchel",
    name: "Leather Satchel",
    category: "leather",
    collection: "bags",
    tagline: "Buckled flap satchel that fits a 14-inch laptop.",
    description:
      "A classic two-buckle satchel in full-grain leather with a padded laptop sleeve, two front pockets and an adjustable strap.",
    details: ["Full-grain leather", "Fits a 14-inch laptop", "Two front pockets", "Adjustable shoulder strap", "38 × 28 × 10cm"],
    material: "Full-grain cowhide, brass buckles",
    care: "Wipe with a dry cloth and condition every few months.",
    colours: [
      { name: "Tan", hex: "#A5652F", images: [["1517612228538-cefdbc2c01e7", "Tan leather satchel close up"]] },
      { name: "Chestnut", hex: "#6B3A22", images: [["1473188588951-666fce8e7c68", "Chestnut leather satchel on stone"]] },
      { name: "Dark Brown", hex: "#3A2419", images: [["1603219527847-24c87f552a77", "Dark brown leather satchel on a timber stool"]] },
    ],
    sizes: [{ label: "One size", price: 38900 }],
    monogramable: true,
  },
  {
    slug: "leather-tote",
    name: "Leather Tote",
    category: "leather",
    collection: "bags",
    tagline: "An unlined, everyday tote in soft tan leather.",
    description:
      "A simple open tote with long handles that sit comfortably on the shoulder. Unlined, so it stays light and shows the natural back of the hide.",
    details: ["Full-grain leather", "Unlined", "Internal slip pocket", "36 × 40 × 12cm"],
    material: "Full-grain cowhide",
    care: "Wipe with a dry cloth and condition every few months.",
    colours: [{ name: "Tan", hex: "#A8622C", images: [["1624687943971-e86af76d57de", "Tan leather tote hanging on a wall"]] }],
    sizes: [{ label: "One size", price: 29900 }],
    isNew: true,
    monogramable: true,
  },
  {
    slug: "leather-dopp-kit",
    name: "Leather Toiletry Bag",
    category: "leather",
    collection: "bags",
    tagline: "A zip-top toiletry bag with a water-resistant lining.",
    description:
      "Wide enough to see everything at a glance, with a wipe-clean lining for the inevitable leaking bottle.",
    details: ["Full-grain leather", "Water-resistant lining", "Brass zip", "25 × 13 × 14cm"],
    material: "Full-grain cowhide, nylon lining",
    care: "Wipe the lining clean. Condition the leather occasionally.",
    colours: [
      { name: "Chestnut", hex: "#7A3F22", images: [["1644258559678-2eac1b8b79b6", "Chestnut leather toiletry bag with shaving brush"]] },
      { name: "Black", hex: "#1E1C1B", images: [["1585687635785-994bda55c78e", "Black leather toiletry bag"]] },
    ],
    sizes: [{ label: "One size", price: 12900 }],
    bestseller: true,
    monogramable: true,
  },
  // ── Leather: small goods ────────────────────────────────────
  {
    slug: "leather-card-holder",
    name: "Card Holder",
    category: "leather",
    collection: "small-leather-goods",
    tagline: "Four card slots and a centre pocket. Hand-stitched edges.",
    description: "Slim enough for a front pocket. Vegetable-tanned leather that develops a rich patina over time.",
    details: ["Vegetable-tanned leather", "Four card slots, one centre pocket", "Hand-stitched", "10 × 7cm"],
    material: "Vegetable-tanned cowhide, waxed linen thread",
    care: "Keep dry. Condition occasionally.",
    colours: [
      { name: "Tan", hex: "#B06A33", images: [["1628483211662-9bcc692c46dc", "Tan leather card holder on a workbench"]] },
      { name: "Oxblood", hex: "#5A1E1C", images: [["1512414947060-048d53abb081", "Oxblood leather card holder on concrete"]] },
      { name: "Black", hex: "#1C1B1A", images: [["1629958317491-bd40c9fa757e", "Black leather card wallet, open"]] },
    ],
    sizes: [{ label: "One size", price: 6900 }],
    bestseller: true,
    monogramable: true,
  },
  {
    slug: "leather-bifold-wallet",
    name: "Bifold Wallet",
    category: "leather",
    collection: "small-leather-goods",
    tagline: "A slim bifold with six card slots and a note pocket.",
    description: "Classic, slim and built to last years in a back pocket.",
    details: ["Full-grain leather", "Six card slots", "Full-length note pocket", "11 × 9cm closed"],
    material: "Full-grain cowhide",
    care: "Keep dry. Condition occasionally.",
    colours: [{ name: "Chestnut", hex: "#6E3D23", images: [["1635100299010-0410d7434a93", "Chestnut leather bifold wallet with an awl"], ["1627123424574-724758594e93", "Chestnut bifold wallet in mid-air"]] }],
    sizes: [{ label: "One size", price: 11900 }],
    monogramable: true,
  },
  {
    slug: "leather-zip-wallet",
    name: "Zip Wallet & Key Fob",
    category: "leather",
    collection: "small-leather-goods",
    tagline: "A compact zip wallet with a matching key fob.",
    description: "Room for cards, notes and coins behind a smooth metal zip, plus a leather key fob in the same hide.",
    details: ["Full-grain leather", "L-shaped zip", "Matching key fob", "11 × 9cm"],
    material: "Full-grain cowhide",
    care: "Keep dry. Condition occasionally.",
    colours: [
      { name: "Tan", hex: "#B36C35", images: [["1689844496310-b261f7602bc2", "Tan zip wallet and key fob"]] },
      { name: "Black", hex: "#1C1B1A", images: [["1689844496219-7afba91f51ef", "Black zip wallet and key strap"]] },
    ],
    sizes: [{ label: "One size", price: 9900 }],
    isNew: true,
    monogramable: true,
  },
  {
    slug: "leather-belt",
    name: "Leather Belt",
    category: "leather",
    collection: "small-leather-goods",
    tagline: "A 35mm belt cut from a single strip of bridle leather.",
    description: "No layers glued together, so it won't split or peel. Solid brass buckle, held with screws so it can be replaced.",
    details: ["Single-piece leather", "Solid brass buckle", "35mm wide", "Sizes 80 to 100cm"],
    material: "Cowhide, solid brass",
    care: "Condition occasionally.",
    colours: [{ name: "Tan", hex: "#9C6A3C", images: [["1705493655920-20c572928501", "Tan leather belt with brass buckle"]] }],
    sizes: [
      { label: "80cm", price: 12900 },
      { label: "90cm", price: 12900 },
      { label: "100cm", price: 12900 },
    ],
    monogramable: true,
  },
  // ── Leather: home ───────────────────────────────────────────
  {
    slug: "leather-pouf",
    name: "Leather Pouf",
    category: "leather",
    collection: "leather-home",
    tagline: "A stitched leather pouf with a firm, supportive fill.",
    description: "Extra seating, a footrest or a side table. Real leather rather than PU, so it wears in rather than cracking.",
    details: ["Genuine leather cover", "Firm foam and fibre fill", "45cm diameter, 45cm high"],
    material: "Cowhide leather cover, foam fill",
    care: "Wipe with a dry cloth. Condition every six months.",
    colours: [{ name: "Cognac", hex: "#8A4A28", images: [["1690618299438-cb453b14bab3", "Cognac leather pouf on a concrete floor"], ["1690618299433-8d0ba9a0f341", "Cognac leather pouf from above"]] }],
    sizes: [{ label: "45 × 45cm", price: 54900 }],
  },
  {
    slug: "leather-oak-stool",
    name: "Leather & Oak Stool",
    category: "leather",
    collection: "leather-home",
    tagline: "A padded leather seat on turned oak legs.",
    description: "A small stool for the end of the bed, the entry or the dressing table.",
    details: ["Leather seat", "Solid oak legs", "40cm diameter, 45cm high"],
    material: "Cowhide leather, solid oak",
    care: "Wipe the leather with a dry cloth. Condition every six months.",
    colours: [{ name: "Brown", hex: "#4F3528", images: [["1757862351226-61b214cb5252", "Leather stool with oak legs and a book"]] }],
    sizes: [{ label: "One size", price: 38900 }],
    isNew: true,
  },
  {
    slug: "leather-desk-tray",
    name: "Leather Desk Tray",
    category: "leather",
    collection: "leather-home",
    tagline: "A stitched leather tray for keys, notebooks and the things you lose.",
    description: "Made from a single piece of vegetable-tanned leather, folded and stitched at the corners.",
    details: ["Vegetable-tanned leather", "Hand-stitched corners", "28 × 19 × 5cm"],
    material: "Vegetable-tanned cowhide",
    care: "Wipe with a dry cloth. Condition occasionally.",
    colours: [{ name: "Tan", hex: "#A8733F", images: [["1751564360679-33a47cdc151d", "Tan leather tray holding notebooks"]] }],
    sizes: [{ label: "28 × 19cm", price: 8900 }],
  },
];

// Deterministic stock so the demo shows in-stock, low-stock and sold-out.
function stockFor(i: number, j: number) {
  const n = (i * 7 + j * 13) % 23;
  if (n === 5) return 0;
  if (n < 3) return 3;
  return 8 + n * 2;
}

/** Readable, unique SKU: XO-EVERYDAY-BATH-TOWEL-STONE-BATH-TOWEL-70-X-140CM */
const skuFor = (...parts: string[]) =>
  "XO-" + parts.map((p) => p.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "")).join("-");

async function main() {
  let skipped = 0;
  for (const [i, p] of products.entries()) {
    const { colours, sizes, reviews, details, shared, ...rest } = p;
    const data = { ...rest, details: JSON.stringify(details), fromSeed: true };

    // Products made or edited in /admin belong to the shop owner: never overwrite them
    const owned = await prisma.product.findFirst({ where: { slug: p.slug, fromSeed: false } });
    if (owned) {
      skipped++;
      continue;
    }
    const product = await prisma.product.upsert({ where: { slug: p.slug }, create: data, update: data });

    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    let order = 0;
    for (const c of colours) {
      for (const [id, alt] of c.images) {
        await prisma.productImage.create({
          data: { productId: product.id, url: u(id), alt, colourName: c.name, credit: "Unsplash", sortOrder: order++ },
        });
      }
    }
    for (const [id, alt] of shared ?? []) {
      await prisma.productImage.create({ data: { productId: product.id, url: u(id), alt, credit: "Unsplash", sortOrder: 100 + order++ } });
    }

    // Match existing variants by colour and size, so variant ids (and anyone's
    // cart) survive a reseed. Stock is only set when a variant is first created.
    const existing = await prisma.variant.findMany({ where: { productId: product.id } });
    const kept: string[] = [];
    let j = 0;
    for (const c of colours) {
      for (const s of sizes) {
        const v = {
          sku: skuFor(p.slug, c.name, s.label),
          colourName: c.name,
          colourHex: c.hex,
          accentHex: c.accent ?? c.hex,
          size: s.label,
          priceCents: s.price,
          compareAtCents: s.compareAt ?? null,
          sortOrder: j,
          archived: false,
        };
        const match = existing.find((e) => e.colourName === c.name && e.size === s.label);
        const saved = match
          ? await prisma.variant.update({ where: { id: match.id }, data: v })
          : await prisma.variant.create({ data: { ...v, productId: product.id, stock: stockFor(i, j) } });
        kept.push(saved.id);
        j++;
      }
    }
    // Variants that were dropped: delete them, or archive them if they've been ordered
    await prisma.variant.deleteMany({ where: { productId: product.id, id: { notIn: kept }, orderItems: { none: {} } } });
    await prisma.variant.updateMany({ where: { productId: product.id, id: { notIn: kept } }, data: { stock: 0, archived: true } });

    // Only ever touch the sample reviews below; real customer reviews are left alone
    for (const r of reviews ?? []) {
      await prisma.review.deleteMany({ where: { productId: product.id, name: r.name, title: r.title } });
    }
    if (SEED_REVIEWS) {
      for (const [k, r] of (reviews ?? []).entries()) {
        await prisma.review.create({
          data: { ...r, productId: product.id, approved: true, createdAt: new Date(Date.now() - (k * 19 + i * 3 + 6) * 86400000) },
        });
      }
    }
  }

  // Drop sample products no longer in the catalogue (unless they've been ordered).
  // Only ever sample products: anything made in /admin is left alone.
  await prisma.product.deleteMany({
    where: { fromSeed: true, slug: { notIn: products.map((p) => p.slug) }, orderItems: { none: {} } },
  });

  await prisma.discountCode.upsert({
    where: { code: "WELCOME10" },
    create: { code: "WELCOME10", percentOff: 10, oncePerEmail: true },
    update: {},
  });

  console.log(
    `Seeded ${products.length - skipped} products${SEED_REVIEWS ? " with demo reviews" : ""}` +
      (skipped ? `; left ${skipped} edited in /admin untouched.` : ".")
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
