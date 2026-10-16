import type { SiteContent } from "@/lib/content/schema";
import { LOGIN_URL, REGISTER_URL, telHref, whatsappUrl } from "@/lib/site";
import type { LinkValue } from "./fields";
import { fill } from "./tokens";

/** Where a link goes, and which click it counts as in Google Analytics. */
export function resolveLink(link: LinkValue, c: SiteContent): { href: string; track?: string } | null {
  const message = fill(link.message, c);
  switch (link.type) {
    case "none":
      return null;
    case "page":
      return link.value ? { href: link.value } : null;
    case "register":
      return { href: REGISTER_URL, track: "register_click" };
    case "login":
      return { href: LOGIN_URL, track: "login_click" };
    case "whatsapp-general":
      return { href: whatsappUrl(c.contact.whatsapp, message || undefined), track: "whatsapp_click" };
    case "whatsapp-china":
      return { href: whatsappUrl(c.contact.chinaWhatsapp, message || undefined), track: "whatsapp_click" };
    case "whatsapp-quotes":
      return { href: whatsappUrl(c.contact.quotesWhatsapp, message || undefined), track: "whatsapp_click" };
    case "phone":
      return link.value ? { href: telHref(link.value), track: "call_click" } : null;
    case "email":
      return { href: `mailto:${link.value || c.contact.email}` };
    case "web":
      return /^https?:\/\//i.test(link.value) ? { href: link.value } : null;
  }
}

export function isExternal(href: string): boolean {
  return /^(https?:|tel:|mailto:)/.test(href);
}
