import type { SiteContent } from "@/lib/content/schema";
import { flightDays, jmd } from "@/lib/rates";

// "Live values" staff can put in any text, e.g. "Flights {flight days}". They are filled
// in from the rates and settings, so the text stays right when those settings change.

export const TOKENS: { token: string; label: string; value: (c: SiteContent) => string }[] = [
  { token: "{branch count}", label: "Number of branches (updates when you add one)", value: (c) => String(c.branches.length) },
  { token: "{flights per week}", label: "USA air flights per week (from the schedule)", value: (c) => String(c.usaAir.schedule.length) },
  { token: "{flight days}", label: "USA air flight days (e.g. Tue, Thu & Sun)", value: (c) => flightDays(c.usaAir.schedule) },
  { token: "{air transit}", label: "USA air transit time", value: (c) => c.usaAir.transit },
  { token: "{ocean transit}", label: "USA ocean transit time", value: (c) => c.ocean.transit },
  { token: "{ocean small limit}", label: "Ocean small-item limit (cubic feet)", value: (c) => String(c.ocean.smallUnderCubicFeet) },
  { token: "{china air price}", label: "China air price per lb (US$)", value: (c) => `US$${c.china.airPerLbUsd}` },
  { token: "{china air transit}", label: "China air transit time", value: (c) => c.china.airTransit },
  { token: "{china sea transit}", label: "China sea transit time", value: (c) => c.china.seaTransit },
  { token: "{storage free days}", label: "Free storage days", value: (c) => String(c.fees.storageFreeDays) },
  { token: "{storage charge day}", label: "Day storage charges begin", value: (c) => String(c.fees.storageFreeDays + 1) },
  { token: "{storage fee}", label: "Storage fee per day", value: (c) => jmd(c.fees.storagePerDay) },
  { token: "{auction days}", label: "Days before auction", value: (c) => String(c.fees.auctionDays) },
  { token: "{processing fee under 10}", label: "Processing fee under 10 lb", value: (c) => jmd(c.processingFees.under10) },
  { token: "{processing fee 10 plus}", label: "Processing fee 10 lb and over", value: (c) => jmd(c.processingFees.from10) },
  { token: "{email}", label: "Main email address", value: (c) => c.contact.email },
];

const BY_TOKEN = new Map(TOKENS.map((t) => [t.token, t.value]));

/** Replaces {live values} in text. Unknown {words} are left as typed. */
export function fill(text: string, c: SiteContent): string {
  return text.replace(/\{[a-z0-9 ]+\}/gi, (m) => BY_TOKEN.get(m.toLowerCase())?.(c) ?? m);
}
