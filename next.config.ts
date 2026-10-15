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
