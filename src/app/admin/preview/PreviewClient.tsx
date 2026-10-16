"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageRenderer } from "@/components/blocks/PageRenderer";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { IconInfo } from "@/components/Icons";
import type { Page } from "@/lib/content/pages-schema";
import type { SiteContent } from "@/lib/content/schema";

export function PreviewClient({ initial, pageId: initialPage }: { initial: SiteContent; pageId: string }) {
  const [state, setState] = useState({ content: initial, pageId: initialPage });

  useEffect(() => {
    // Only the admin window that opened this preview may update it.
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== window.parent) return;
      if (e.data?.type === "sgx-preview" && e.data.content) setState({ content: e.data.content, pageId: String(e.data.pageId) });
    };
    // Links don't leave the preview: it always shows the page being edited.
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest("a")) e.preventDefault();
    };
    window.addEventListener("message", onMessage);
    document.addEventListener("click", onClick, true);
    window.parent.postMessage({ type: "sgx-preview-ready" }, window.location.origin);
    return () => {
      window.removeEventListener("message", onMessage);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  const { content, pageId } = state;
  const page = (content.pages as Page[]).find((p) => p.id === pageId);
  const { notice } = content;
  return (
    <div className="bg-white text-navy">
      <Header />
      {notice.enabled && notice.text ? (
        <div className="bg-gold text-navy">
          <p className="mx-auto flex max-w-6xl items-start gap-2 px-4 py-2.5 text-sm md:px-6">
            <IconInfo className="mt-0.5 h-4 w-4 flex-none" />
            <span>
              {notice.text} {notice.linkHref && notice.linkLabel ? <Link href={notice.linkHref} className="font-semibold underline">{notice.linkLabel}</Link> : null}
            </span>
          </p>
        </div>
      ) : null}
      <main>{page ? <PageRenderer page={page} content={content} /> : <p className="p-8">This page no longer exists.</p>}</main>
      <Footer content={content} />
    </div>
  );
}
