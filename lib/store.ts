/**
 * Business details and shop settings. Change them here and the header,
 * footer, emails, policies and structured data all follow.
 *
 * TODO before launch: every value marked PLACEHOLDER.
 */
export const store = {
  name: "xomexo",
  tagline: "Bath, bedding, rugs and leather",
  description: "Towels, bedding, rugs and full-grain leather goods, designed in Australia. Free delivery over $150.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",

  legalName: "Xomexo Pty Ltd", // PLACEHOLDER
  abn: "00 000 000 000", // PLACEHOLDER — must appear on tax invoices
  email: "hello@xomexo.com", // PLACEHOLDER
  phone: "1300 000 000", // PLACEHOLDER
  phoneHref: "tel:1300000000",
  address: {
    street: "12 Example Street", // PLACEHOLDER
    suburb: "Fremantle",
    state: "WA",
    postcode: "6160",
  },
  /** Traditional Custodians of the land at the address above (update if you move) */
  traditionalCustodians: "the Whadjuk Noongar people",
  hours: "Monday to Friday, 9am to 4pm AWST",
  instagram: "xomexo", // PLACEHOLDER handle, without the @

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
