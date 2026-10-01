import { ImageResponse } from "next/og";

// Home-screen icon for iPhone and iPad (they ignore SVG favicons). Same drawing
// as app/icon.svg, on a full-bleed square because iOS rounds the corners itself.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#1d4d3f" }}>
        <svg width="180" height="180" viewBox="0 0 64 64">
          <path d="M18 18l28 28M46 18L18 46" stroke="#f4f6f4" strokeWidth="6" strokeLinecap="round" />
          <circle cx="32" cy="32" r="7" fill="#a9822f" />
        </svg>
      </div>
    ),
    size,
  );
}
