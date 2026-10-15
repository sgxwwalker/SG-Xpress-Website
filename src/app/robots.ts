import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sgxpressja.com";

export default function robots(): MetadataRoute.Robots {
  // Staging copies must never show up in Google.
  if (process.env.NEXT_PUBLIC_SITE_ENV === "staging") return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/admin" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
