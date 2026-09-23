const aud = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});

const audWhole = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0,
});

/** 4995 -> "$49.95"; whole-dollar amounts drop the cents ("$599"). */
export function formatPrice(cents: number) {
  return cents % 100 === 0 ? audWhole.format(cents / 100) : aud.format(cents / 100);
}

/** Always two decimals — for totals, invoices and anywhere alignment matters. */
export function formatMoney(cents: number) {
  return aud.format(cents / 100);
}

/** GST included in a GST-inclusive amount (10% GST => 1/11th). */
export function gstIncluded(cents: number) {
  return Math.round(cents / 11);
}

/** Afterpay splits into four fortnightly payments. */
export function afterpayInstalment(cents: number) {
  return Math.ceil(cents / 4);
}
