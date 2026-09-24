import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native SQLite driver: load it from node_modules at runtime, don't bundle it.
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3"],

  // Product photos are resized by their own CDN (see lib/image-loader.ts)
  images: { loader: "custom", loaderFile: "./lib/image-loader.ts" },

  // The towels category became "bath" when bedding and leather were added
  async redirects() {
    return [{ source: "/shop/towels", destination: "/shop/bath", permanent: true }];
  },

  // Basic hardening headers for every route.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
