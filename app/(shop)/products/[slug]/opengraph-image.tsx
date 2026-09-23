import { ImageResponse } from "next/og";

import { formatPrice } from "@/lib/money";
import { getProduct } from "@/lib/products";
import { store } from "@/lib/store";

export const alt = "Product image";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function ProductOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProduct(slug);
  const colours = [...new Map((p?.variants ?? []).map((v) => [v.colourName, v])).values()];
  const from = p ? Math.min(...p.variants.map((v) => v.priceCents)) : 0;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#faf6f0" }}>
        <div style={{ display: "flex", width: 420, flexDirection: "column" }}>
          {colours.map((c) => (
            <div key={c.colourName} style={{ flex: 1, display: "flex", background: c.colourHex, alignItems: "flex-end" }}>
              <div style={{ height: 18, width: "100%", background: c.accentHex, marginBottom: 22 }} />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: 70, flex: 1 }}>
          <div style={{ fontSize: 26, color: "#3f5b4a", letterSpacing: 4, textTransform: "uppercase" }}>{store.name}</div>
          <div style={{ fontSize: 66, color: "#2b2622", lineHeight: 1.05, marginTop: 20 }}>{p?.name ?? store.name}</div>
          <div style={{ fontSize: 28, color: "#6e645b", marginTop: 20 }}>{p?.tagline ?? store.tagline}</div>
          {p && <div style={{ fontSize: 36, color: "#2b2622", marginTop: 30 }}>From {formatPrice(from)}</div>}
        </div>
      </div>
    ),
    size
  );
}
