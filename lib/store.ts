/**
 * Everything that makes this shop *yours* lives here. Change the name,
 * contact details, ABN and the founders' note in one place and the whole site
 * follows — header, footer, emails, policies, structured data.
 *
 * Values marked TODO are placeholders that must be replaced before launch.
 */
export const store = {
  name: "Wattle & Weave",
  shortName: "W&W",
  tagline: "Towels and rugs for Australian homes",
  description:
    "Soft, honest towels and hard-wearing rugs, designed in Australia for the way we actually live — sandy feet, salty hair, and a lot of sunshine.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",

  // TODO: real business details. An ABN must appear on tax invoices.
  legalName: "Wattle & Weave Pty Ltd",
  abn: "00 000 000 000",
  email: "hello@wattleandweave.com.au",
  phone: "1300 000 000",
  phoneHref: "tel:1300000000",
  address: {
    street: "12 Example Street",
    suburb: "Fremantle",
    state: "WA",
    postcode: "6160",
  },
  hours: "Mon–Fri, 9am–4pm AWST",

  social: {
    instagram: "https://instagram.com/",
    facebook: "https://facebook.com/",
    pinterest: "https://pinterest.com/",
  },

  // The founders' note — the single most "personal" thing on the site.
  // TODO: replace with your own words and names.
  founders: {
    names: "Mia & Sam",
    signOff: "Mia & Sam, founders",
    note: "We started Wattle & Weave at our kitchen table after one too many towels went scratchy after a summer of beach days. Every piece we sell is something we use at home first — if it doesn't survive our two kids and a kelpie, it doesn't make the shop.",
  },

  /** All money in cents, AUD, GST-inclusive. */
  commerce: {
    currency: "AUD",
    freeShippingThresholdCents: 15000,
    monogramCents: 1200,
    giftWrapCents: 800,
    returnDays: 30,
    /** Afterpay's usual AU order range. Turn off if not enabled in Stripe. */
    afterpay: { enabled: true, minCents: 100, maxCents: 200000 },
    welcomeCode: "WELCOME10",
  },
} as const;

export type Store = typeof store;
