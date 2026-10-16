import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server build for the dedicated server (see deploy/README.md).
  output: "standalone",
  poweredByHeader: false,
  experimental: {
    // Room for a 5 MB CV upload on job applications, plus form overhead.
    serverActions: { bodySizeLimit: "6mb" },
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // Browser security headers on every page.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" }, // no one can embed the site (or the admin) in a frame
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        ],
      },
      { source: "/admin/:path*", headers: [{ key: "Cache-Control", value: "private, no-store" }] },
      // The page editor shows this preview in a frame, so only our own admin may embed it.
      {
        source: "/admin/preview",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'" },
        ],
      },
    ];
  },
  // Keep old WordPress links (Google results, saved bookmarks) working.
  async redirects() {
    return [
      { source: "/rate-sheet", destination: "/rates", permanent: true },
      { source: "/terms-and-conditions", destination: "/terms", permanent: true },
      { source: "/about-us", destination: "/about", permanent: true },
      { source: "/our-services", destination: "/#services", permanent: true },
      { source: "/services", destination: "/#services", permanent: true },
      { source: "/china", destination: "/china-direct", permanent: true },
    ];
  },
};

export default nextConfig;
