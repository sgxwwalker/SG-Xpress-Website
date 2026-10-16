import Link from "next/link";
import { isBuiltin, type Page } from "@/lib/content/pages-schema";
import type { SiteContent } from "@/lib/content/schema";
import { NAV, telHref } from "@/lib/site";
import { SocialLinks } from "./SocialLinks";

const HELP = [
  { href: "/restricted-items", label: "Restricted items" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function Footer({ content }: { content: SiteContent }) {
  // Extra pages staff chose to list in the footer (/admin → Pages).
  const extra = (content.pages as Page[])
    .filter((p) => !isBuiltin(p.id) && p.published && p.showInFooter)
    .map((p) => ({ href: `/${p.slug}`, label: p.name }));
  return (
    <footer className="bg-navy-deep pb-28 pt-10 text-on-navy md:pb-12">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-4 md:px-6">
        <nav aria-label="Company">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gold">Company</h2>
          <ul>
            {[...NAV.slice(1), { href: "/careers", label: "Careers" }].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="flex min-h-10 items-center text-white hover:underline">{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Help">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gold">Help</h2>
          <ul>
            {[...HELP, ...extra].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="flex min-h-10 items-center text-white hover:underline">{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gold">Contact</h2>
          <ul className="space-y-1">
            {content.contact.phones.map((p) => (
              <li key={p}>
                <a href={telHref(p)} data-track="call_click" data-track-location="footer" className="flex min-h-10 items-center text-white hover:underline">{p}</a>
              </li>
            ))}
            <li>
              <a href={`mailto:${content.contact.email}`} className="flex min-h-10 items-center text-white hover:underline">{content.contact.email}</a>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gold">Follow us</h2>
          <SocialLinks socials={content.socials} />
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-6xl px-4 text-xs text-on-navy/80 md:px-6">© {new Date().getFullYear()} SG Xpress Jamaica Limited. All rights reserved.</p>
    </footer>
  );
}
