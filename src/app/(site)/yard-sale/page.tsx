import type { Metadata } from "next";
import { PageRenderer } from "@/components/blocks/PageRenderer";
import { findPage, pageMetadata } from "@/lib/content/pages";
import { getContent } from "@/lib/content/store";

// Items are managed in /admin → Yard Sale; the page's text in /admin → Pages.
export function generateMetadata(): Promise<Metadata> {
  return pageMetadata("yard-sale");
}

export default async function YardSalePage() {
  const c = await getContent();
  return <PageRenderer page={findPage(c, "yard-sale")!} content={c} />;
}
