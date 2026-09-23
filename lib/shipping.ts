import { store } from "./store";

export const STATES = [
  { code: "NSW", name: "New South Wales" },
  { code: "VIC", name: "Victoria" },
  { code: "QLD", name: "Queensland" },
  { code: "WA", name: "Western Australia" },
  { code: "SA", name: "South Australia" },
  { code: "TAS", name: "Tasmania" },
  { code: "ACT", name: "Australian Capital Territory" },
  { code: "NT", name: "Northern Territory" },
] as const;

export type StateCode = (typeof STATES)[number]["code"];

/** Australia Post postcode ranges, used to catch a mistyped state or postcode. */
const RANGES: [StateCode, number, number][] = [
  ["ACT", 200, 299],
  ["NT", 800, 999],
  ["NSW", 1000, 2599],
  ["ACT", 2600, 2618],
  ["NSW", 2619, 2899],
  ["ACT", 2900, 2920],
  ["NSW", 2921, 2999],
  ["VIC", 3000, 3999],
  ["QLD", 4000, 4999],
  ["SA", 5000, 5999],
  ["WA", 6000, 6999],
  ["TAS", 7000, 7999],
  ["VIC", 8000, 8999],
  ["QLD", 9000, 9999],
];

export function stateForPostcode(postcode: string): StateCode | null {
  if (!/^\d{4}$/.test(postcode)) return null;
  const n = Number(postcode);
  return RANGES.find(([, lo, hi]) => n >= lo && n <= hi)?.[0] ?? null;
}

export type ShippingMethod = "standard" | "express";
type Zone = "metro" | "regional" | "remote";

function zoneFor(state: StateCode | null): Zone {
  if (state === "WA" || state === "NT" || state === "TAS") return "remote";
  if (state === "QLD" || state === "SA") return "regional";
  return "metro";
}

const RATES: Record<Zone, Record<ShippingMethod, number>> = {
  metro: { standard: 995, express: 1695 },
  regional: { standard: 995, express: 1895 },
  remote: { standard: 1495, express: 2495 },
};

const ETA: Record<Zone, Record<ShippingMethod, string>> = {
  metro: { standard: "2–4 business days", express: "1–2 business days" },
  regional: { standard: "3–5 business days", express: "1–3 business days" },
  remote: { standard: "5–9 business days", express: "2–4 business days" },
};

export function shippingQuote(
  method: ShippingMethod,
  state: StateCode | null,
  merchandiseCents: number
) {
  const zone = zoneFor(state);
  const free =
    method === "standard" &&
    merchandiseCents >= store.commerce.freeShippingThresholdCents;
  return {
    method,
    label: method === "standard" ? "Standard delivery" : "Express delivery",
    cents: free ? 0 : RATES[zone][method],
    eta: ETA[zone][method],
    free,
  };
}

export function allQuotes(state: StateCode | null, merchandiseCents: number) {
  return (["standard", "express"] as const).map((m) =>
    shippingQuote(m, state, merchandiseCents)
  );
}
