import { ImageResponse } from "next/og";

import { store } from "@/lib/store";

export const alt = `${store.name} — ${store.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Social share card for the whole site
export default function OgImage() {
  const stripes = ["#3F6E8C", "#7C9A86", "#C0803F", "#E08E79", "#E3B23C", "#D9C3A0"];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#faf6f0" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, flex: 1 }}>
          <div style={{ fontSize: 30, color: "#3f5b4a", letterSpacing: 4, textTransform: "uppercase" }}>{store.name}</div>
          <div style={{ fontSize: 76, color: "#2b2622", lineHeight: 1.05, marginTop: 24 }}>Made for sandy feet &amp; slow Sundays.</div>
          <div style={{ fontSize: 30, color: "#6e645b", marginTop: 28 }}>{store.tagline}</div>
        </div>
        <div style={{ display: "flex", width: 330 }}>
          {stripes.map((c) => (
            <div key={c} style={{ flex: 1, background: c }} />
          ))}
        </div>
      </div>
    ),
    size
  );
}
