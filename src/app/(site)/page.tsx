import type { Metadata } from "next";
import { PageRenderer } from "@/components/blocks/PageRenderer";
import { businessData, JsonLd } from "@/components/StructuredData";
import { findPage, pageMetadata } from "@/lib/content/pages";
import { getContent } from "@/lib/content/store";

// Sections, text and pictures are edited in /admin → Pages.
export function generateMetadata(): Promise<Metadata> {
  return pageMetadata("home");
}

export default async function HomePage() {
  const c = await getContent();
  return (
    <>
      <JsonLd data={businessData(c)} />
      <PageRenderer page={findPage(c, "home")!} content={c} />
    </>
  );
}
