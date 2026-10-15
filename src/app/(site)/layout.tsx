import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { IconChat, IconInfo } from "@/components/Icons";
import { getContent } from "@/lib/content/store";
import { whatsappUrl } from "@/lib/site";

// Read the saved content on every visit. Pages built ahead of time would show the
// content from build time (on the developer's computer) after each deploy, not what
// staff saved in /admin. content.json is small, so this costs almost nothing.
export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const content = await getContent();
  const { notice } = content;

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-gold focus:px-4 focus:py-2">
        Skip to content
      </a>
      <Header />
      {notice.enabled && notice.text ? (
        <div className="bg-gold text-navy">
          <p className="mx-auto flex max-w-6xl items-start gap-2 px-4 py-2.5 text-sm md:px-6">
            <IconInfo className="mt-0.5 h-4 w-4 flex-none" />
            <span>
              {notice.text}{" "}
              {notice.linkHref && notice.linkLabel ? (
                <Link href={notice.linkHref} className="font-semibold underline">{notice.linkLabel}</Link>
              ) : null}
            </span>
          </p>
        </div>
      ) : null}
      <main id="main">{children}</main>
      <Footer content={content} />
      <a
        href={whatsappUrl(content.contact.whatsapp)}
        aria-label="Chat with SG Xpress on WhatsApp"
        data-track="whatsapp_click"
        data-track-location="floating"
        className="fixed bottom-4 right-4 z-30 flex h-14 items-center gap-2 rounded-full bg-whatsapp pl-4 pr-5 font-semibold text-white shadow-lg shadow-navy-deep/30 hover:brightness-110"
      >
        <IconChat className="h-6 w-6" />
        WhatsApp
      </a>
    </>
  );
}
