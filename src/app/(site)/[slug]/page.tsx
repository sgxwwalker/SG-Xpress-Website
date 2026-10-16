import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageRenderer } from "@/components/blocks/PageRenderer";
import { isBuiltin, type Page } from "@/lib/content/pages-schema";
import type { SiteContent } from "@/lib/content/schema";
import { getContent } from "@/lib/content/store";

// Extra pages staff create in /admin → Pages (e.g. a promotion). Built-in pages have
// their own folders, which always take priority over this one.

type Props = { params: Promise<{ slug: string }> };

function customPage(c: SiteContent, slug: string): Page | undefined {
  return (c.pages as Page[]).find((p) => !isBuiltin(p.id) && p.slug === slug && p.published);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = customPage(await getContent(), slug);
  if (!p) return {};
  return {
    title: p.seoTitle || p.name,
    ...(p.seoDescription ? { description: p.seoDescription } : {}),
    alternates: { canonical: `/${p.slug}` },
  };
}

export default async function CustomPage({ params }: Props) {
  const { slug } = await params;
  const c = await getContent();
  const p = customPage(c, slug);
  if (!p) notFound();
  return <PageRenderer page={p} content={c} />;
}
