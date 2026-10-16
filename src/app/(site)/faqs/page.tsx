import type { Metadata } from "next";
import { PageRenderer } from "@/components/blocks/PageRenderer";
import { faqData, JsonLd } from "@/components/StructuredData";
import { findPage, pageMetadata } from "@/lib/content/pages";
import { getContent } from "@/lib/content/store";

// Sections, text and pictures are edited in /admin → Pages.
export function generateMetadata(): Promise<Metadata> {
  return pageMetadata("faqs");
}

export default async function FaqsPage() {
  const c = await getContent();
  return (
    <>
      <JsonLd data={faqData(c.faqs)} />
      <PageRenderer page={findPage(c, "faqs")!} content={c} />
    </>
  );
}
