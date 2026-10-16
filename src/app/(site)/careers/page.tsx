import type { Metadata } from "next";
import { PageRenderer } from "@/components/blocks/PageRenderer";
import { findPage, pageMetadata } from "@/lib/content/pages";
import { getContent } from "@/lib/content/store";

// Sections, text and pictures are edited in /admin → Pages.
export function generateMetadata(): Promise<Metadata> {
  return pageMetadata("careers");
}

export default async function CareersPage() {
  const c = await getContent();
  return (
    <>
      <PageRenderer page={findPage(c, "careers")!} content={c} />
    </>
  );
}
