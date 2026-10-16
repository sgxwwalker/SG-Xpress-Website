import type { Metadata } from "next";
import { PageRenderer } from "@/components/blocks/PageRenderer";
import { findPage, pageMetadata } from "@/lib/content/pages";
import { getContent } from "@/lib/content/store";

// Sections, text and pictures are edited in /admin → Pages.
export function generateMetadata(): Promise<Metadata> {
  return pageMetadata("privacy");
}

export default async function PrivacyPage() {
  const c = await getContent();
  return (
    <>
      <PageRenderer page={findPage(c, "privacy")!} content={c} />
    </>
  );
}
