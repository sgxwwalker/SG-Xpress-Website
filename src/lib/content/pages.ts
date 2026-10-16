import type { Metadata } from "next";
import { defaultPages } from "./pages-default";
import { pagePath, type Page } from "./pages-schema";
import type { SiteContent } from "./schema";
import { getContent } from "./store";

// Looking up a page's sections and its Google title and description.

export function findPage(c: SiteContent, id: string): Page | undefined {
  return (c.pages as Page[]).find((p) => p.id === id) ?? defaultPages().find((p) => p.id === id);
}

export async function pageMetadata(id: string): Promise<Metadata> {
  const p = findPage(await getContent(), id);
  if (!p) return {};
  const title = p.seoTitle || p.name;
  return {
    title: id === "home" ? { absolute: `${title} | SG Xpress` } : title,
    ...(p.seoDescription ? { description: p.seoDescription } : {}),
    alternates: { canonical: pagePath(p) },
  };
}
