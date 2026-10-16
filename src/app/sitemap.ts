import type { MetadataRoute } from "next";
import { BUILTIN_PAGES, isBuiltin, type Page } from "@/lib/content/pages-schema";
import { getContent } from "@/lib/content/store";
import { isJobOpen } from "@/lib/jobs";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sgxpressja.com";

// Built fresh on each request, so new pages and jobs from /admin appear straight away.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const c = await getContent();
  const paths = [
    ...BUILTIN_PAGES.map((p) => p.path),
    ...(c.pages as Page[]).filter((p) => !isBuiltin(p.id) && p.published).map((p) => `/${p.slug}`),
    ...c.jobs.filter((j) => isJobOpen(j)).map((j) => `/careers/${j.id}`),
  ];
  return paths.map((path) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    changeFrequency: path === "/rates" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
