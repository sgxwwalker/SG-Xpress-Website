import type { Metadata } from "next";
import { PageRenderer } from "@/components/blocks/PageRenderer";
import { businessData, JsonLd } from "@/components/StructuredData";
import { findPage, pageMetadata } from "@/lib/content/pages";
import { getContent } from "@/lib/content/store";

// Sections, text and pictures are edited in /admin → Pages.
export function generateMetadata(): Promise<Metadata> {
  return pageMetadata("contact");
}

export default async function ContactPage() {
  const c = await getContent();
  return (
    <>
      <JsonLd data={businessData(c)} />
      <PageRenderer page={findPage(c, "contact")!} content={c} />
    </>
  );
}
