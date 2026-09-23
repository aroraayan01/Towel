import { ImageResponse } from "next/og";

import { store } from "@/lib/store";

export const alt = `${store.name}: ${store.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PHOTO = "https://images.unsplash.com/photo-1596683705523-eb49540c3934?w=1200&h=630&fit=crop&q=75";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={PHOTO} alt="" width={1200} height={630} style={{ position: "absolute", inset: 0, objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0))" }} />
        <div style={{ position: "absolute", left: 64, bottom: 56, display: "flex", flexDirection: "column", color: "white" }}>
          <div style={{ fontSize: 34, letterSpacing: 8, textTransform: "uppercase" }}>{store.name}</div>
          <div style={{ fontSize: 64, marginTop: 12 }}>Made to be used.</div>
        </div>
      </div>
    ),
    size
  );
}
