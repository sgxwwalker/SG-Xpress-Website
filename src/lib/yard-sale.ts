import type { SiteContent, YardItem } from "@/lib/content/schema";

/** Items for the public Yard Sale page, newest first. Drafts stay hidden; sold items
 *  show with a "Sold" badge for `yardSaleSoldDays` days after the sale date, then hide. */
export function shownYardItems(c: SiteContent, now = new Date()): YardItem[] {
  const days = c.yardSaleSoldDays;
  const cutoff = new Date(now.getTime() - days * 86_400_000).toISOString().slice(0, 10);
  const recentlySold = (i: YardItem) => i.status === "sold" && days > 0 && i.soldAt !== "" && i.soldAt > cutoff;
  return c.yardSale
    .filter((i) => i.status === "available" || i.status === "reserved" || recentlySold(i))
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt));
}
