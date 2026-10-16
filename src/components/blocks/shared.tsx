import Image from "next/image";
import Link from "next/link";
import type { ButtonValue, IconName, ImageValue, LinkValue } from "@/lib/blocks/fields";
import { isExternal, resolveLink } from "@/lib/blocks/links";
import { fill } from "@/lib/blocks/tokens";
import type { SiteContent } from "@/lib/content/schema";
import {
  IconAlert, IconArrow, IconBarrel, IconBox, IconCart, IconChat, IconCheck, IconClock, IconDocCheck, IconGlobe,
  IconHelp, IconInfo, IconMail, IconPhone, IconPin, IconPlane, IconShip, IconTag, IconUser, IconUsers,
} from "../Icons";
import { Button } from "../ui";

// Small helpers shared by every section on a page.

export type BlockProps<P> = { p: P; c: SiteContent; id: string; anchor?: string; tone: "white" | "mist" | "navy" | "gold"; first: boolean };

export const ICONS: Record<IconName, (props: { className?: string }) => React.ReactNode> = {
  plane: IconPlane, ship: IconShip, globe: IconGlobe, barrel: IconBarrel, cart: IconCart, pin: IconPin, phone: IconPhone,
  chat: IconChat, check: IconCheck, arrow: IconArrow, alert: IconAlert, info: IconInfo, box: IconBox, doc: IconDocCheck,
  clock: IconClock, users: IconUsers, user: IconUser, help: IconHelp, tag: IconTag, mail: IconMail,
};

export function Icon({ name, className }: { name: IconName; className?: string }) {
  const C = ICONS[name] ?? IconBox;
  return <C className={className} />;
}

/** A button from the editor: label, where it goes, colour and icon. Renders nothing if it has no link. */
export function LinkButton({ b, c, where, size = "md", className = "" }: { b: ButtonValue; c: SiteContent; where: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const to = resolveLink(b.link, c);
  if (!to || !b.label) return null;
  return (
    <Button href={to.href} variant={b.style} size={size} className={className} track={to.track} trackLocation={where}>
      {b.icon === "chat" ? <IconChat className="h-5 w-5" /> : null}
      {fill(b.label, c)}
      {b.icon === "arrow" ? <IconArrow className="h-5 w-5" /> : null}
    </Button>
  );
}

/** A plain text link ("See air rates →"). */
export function TextLink({ link, label, c, where, className = "inline-flex min-h-11 items-center font-semibold" }: { link: LinkValue; label: string; c: SiteContent; where: string; className?: string }) {
  const to = resolveLink(link, c);
  if (!to || !label) return null;
  const text = `${fill(label, c).replace(/\s*→$/, "")} →`;
  const data = to.track ? { "data-track": to.track, "data-track-location": where } : {};
  return isExternal(to.href) ? (
    <a href={to.href} className={className} {...data}>{text}</a>
  ) : (
    <Link href={to.href} className={className} {...data}>{text}</Link>
  );
}

/** Wraps children in a link when one is set (e.g. a tappable poster). */
export function MaybeLink({ link, c, where, label, className, children }: { link: LinkValue; c: SiteContent; where: string; label?: string; className?: string; children: React.ReactNode }) {
  const to = resolveLink(link, c);
  if (!to) return <div className={className}>{children}</div>;
  const data = to.track ? { "data-track": to.track, "data-track-location": where } : {};
  return isExternal(to.href) ? (
    <a href={to.href} aria-label={label} className={className} {...data}>{children}</a>
  ) : (
    <Link href={to.href} aria-label={label} className={className} {...data}>{children}</Link>
  );
}

/** A picture from the media library or the built-in images. */
export function Picture({ image, sizes, className, priority }: { image: ImageValue; sizes: string; className?: string; priority?: boolean }) {
  if (!image.src) return null;
  return (
    <Image
      src={image.src}
      alt={image.alt}
      width={image.width || 800}
      height={image.height || 800}
      sizes={sizes}
      priority={priority}
      unoptimized={image.src.startsWith("/media/")}
      className={className}
    />
  );
}

export function muted(tone: string) {
  return tone === "navy" ? "text-on-navy" : tone === "gold" ? "text-navy" : "text-muted";
}
