import { dataPath, READ_ONLY, readJson, writeJson } from "./data-files";
import { BLOCKS, type BlockType } from "./blocks/registry";
import type { AdminUser } from "./staff";

// Who did what in /admin. Shown to the superadmin in the Activity tab.

export interface ActivityEntry {
  at: string;
  userId: string;
  userName: string;
  action: string; // e.g. "Saved changes", "Logged in"
  details: string[]; // e.g. ["Air rate 3 lb: J$1,800 → J$1,850"]
}

const KEEP = 2000;
const MAX_DETAILS = 40;
const file = () => dataPath("activity.json");

export async function readActivity(): Promise<ActivityEntry[]> {
  return readJson<ActivityEntry[]>(file(), []);
}

export async function logActivity(user: Pick<AdminUser, "id" | "name">, action: string, details: string[] = []): Promise<void> {
  const entry: ActivityEntry = {
    at: new Date().toISOString(),
    userId: user.id,
    userName: user.name,
    action,
    details: details.length > MAX_DETAILS ? [...details.slice(0, MAX_DETAILS), `…and ${details.length - MAX_DETAILS} more changes`] : details,
  };
  if (READ_ONLY) return;
  try {
    const list = await readActivity();
    await writeJson(file(), [entry, ...list].slice(0, KEEP));
  } catch (err) {
    console.error("Couldn't write the activity log", err); // never block a login or save over the log
  }
}

/** The most recent save, used to tell an editor who saved before them. */
export async function lastSave(): Promise<ActivityEntry | undefined> {
  return (await readActivity()).find((e) => e.action === "Saved changes");
}

// ---- Describing content changes in plain words ----

const SECTION: Record<string, string> = {
  notice: "Notice bar",
  airRates: "Air rate",
  processingFees: "Processing fee",
  fees: "Other charges",
  serviceCharge: "Service charge",
  usaAir: "Air schedule",
  warehouseHours: "Florida warehouse hours",
  ocean: "USA Ocean",
  china: "China Direct",
  hours: "Opening hours",
  branches: "Branch",
  contact: "Contact",
  faqs: "FAQ",
  chinaWarehouses: "China address",
  socials: "Social link",
};

function words(key: string): string {
  return key.replace(/([a-z])([A-Z0-9])/g, "$1 $2").replace(/Usd$/, "(US$)").toLowerCase();
}

function show(v: unknown): string {
  if (typeof v === "string") return `“${v.length > 70 ? `${v.slice(0, 67)}…` : v}”`;
  if (typeof v === "number") return v.toLocaleString("en-US");
  if (typeof v === "boolean") return v ? "on" : "off";
  if (v === undefined) return "(none)";
  return JSON.stringify(v).slice(0, 70);
}

function label(path: (string | number)[]): string {
  const [top, ...rest] = path;
  if (top === "airRates") return `Air rate ${rest[0] === 0 ? "0.1–0.5" : rest[0]} lb`;
  const parts = [SECTION[String(top)] ?? words(String(top))];
  for (const p of rest) parts.push(typeof p === "number" ? `#${p + 1}` : words(p));
  return parts.join(" › ");
}

type PageLike = { id: string; name: string; sections: { id: string; type: string; hidden: boolean; tone: string; anchor: string; props: unknown }[] } & Record<string, unknown>;

/** Page edits in plain words, e.g. "Page Home › Page banner › heading: “A” → “B”". */
function describePages(before: PageLike[], after: PageLike[]): string[] {
  const out: string[] = [];
  const old = new Map(before.map((p) => [p.id, p]));
  for (const p of after) {
    const o = old.get(p.id);
    if (!o) {
      out.push(`Added the page “${p.name}”`);
      continue;
    }
    const page = `Page ${p.name}`;
    for (const k of ["name", "slug", "seoTitle", "seoDescription", "published", "showInFooter"]) {
      if (o[k] !== p[k]) out.push(`${page} › ${words(k)}: ${show(o[k])} → ${show(p[k])}`);
    }
    const oldSections = new Map(o.sections.map((s) => [s.id, s]));
    for (const s of p.sections) {
      const name = BLOCKS[s.type as BlockType]?.name ?? s.type;
      const os = oldSections.get(s.id);
      if (!os) {
        out.push(`${page}: added a “${name}” section`);
        continue;
      }
      const where = `${page} › ${name}`;
      if (os.hidden !== s.hidden) out.push(`${where}: ${s.hidden ? "hidden" : "shown again"}`);
      if (os.tone !== s.tone) out.push(`${where}: background ${os.tone} → ${s.tone}`);
      if (os.anchor !== s.anchor) out.push(`${where}: section name ${show(os.anchor)} → ${show(s.anchor)}`);
      out.push(...describeChanges(os.props, s.props).map((line) => `${where} › ${line}`));
    }
    const kept = new Set(p.sections.map((s) => s.id));
    for (const s of o.sections) if (!kept.has(s.id)) out.push(`${page}: removed a “${BLOCKS[s.type as BlockType]?.name ?? s.type}” section`);
    const order = (list: { id: string }[]) => list.map((s) => s.id).filter((id) => kept.has(id) && oldSections.has(id)).join();
    if (order(o.sections) !== order(p.sections)) out.push(`${page}: sections moved`);
  }
  const now = new Set(after.map((p) => p.id));
  for (const p of before) if (!now.has(p.id)) out.push(`Deleted the page “${p.name}”`);
  return out;
}

/** Lists the differences between two versions of the site content. */
export function describeChanges(before: unknown, after: unknown, path: (string | number)[] = []): string[] {
  if (path.length === 0 && before && after && typeof before === "object" && typeof after === "object" && "pages" in after) {
    const { pages: bp, ...b } = before as Record<string, unknown>;
    const { pages: ap, ...a } = after as Record<string, unknown>;
    return [...describeChanges(b, a), ...describePages((bp ?? []) as PageLike[], (ap ?? []) as PageLike[])];
  }
  if (Array.isArray(before) && Array.isArray(after)) {
    const out: string[] = [];
    if (before.length !== after.length) out.push(`${label(path)}: ${before.length} → ${after.length} items`);
    for (let i = 0; i < Math.min(before.length, after.length); i++) out.push(...describeChanges(before[i], after[i], [...path, i]));
    return out;
  }
  if (before && after && typeof before === "object" && typeof after === "object") {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    const out: string[] = [];
    for (const k of keys) out.push(...describeChanges((before as Record<string, unknown>)[k], (after as Record<string, unknown>)[k], [...path, k]));
    return out;
  }
  return before === after ? [] : [`${label(path)}: ${show(before)} → ${show(after)}`];
}
