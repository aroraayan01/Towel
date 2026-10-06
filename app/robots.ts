import type { MetadataRoute } from "next";

import { store } from "@/lib/store";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/seller", "/checkout", "/cart", "/order/", "/api/"] },
    sitemap: `${store.url}/sitemap.xml`,
  };
}
