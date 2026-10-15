import type { MetadataRoute } from "next";
import { NAV } from "@/lib/site";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sgxpressja.com";
const EXTRA = ["/careers", "/restricted-items", "/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  return [...NAV.map((n) => n.href), ...EXTRA].map((path) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    changeFrequency: path === "/rates" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
