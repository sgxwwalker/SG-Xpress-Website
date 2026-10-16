import { promises as fs } from "fs";
import path from "path";
import { cache } from "react";
import type { z } from "zod";
import { pageSchema, sectionSchema } from "./pages-schema";
import { contentSchema, type SiteContent } from "./schema";
import { defaultContent } from "./defaults";

// Staff edits live in one JSON file on the server. On the server, set CONTENT_FILE
// to a path outside the app folder so a redeploy never overwrites it. The path is
// only known at runtime, hence the turbopackIgnore hints on each fs call.
const BACKUPS_TO_KEEP = 20;

function contentFile(): string {
  return process.env.CONTENT_FILE || path.join(process.cwd(), "data", "content.json");
}

/** Reads the saved content, falling back to the defaults if there's no file yet. */
export const getContent = cache(async (): Promise<SiteContent> => {
  let raw: string;
  try {
    raw = await fs.readFile(/*turbopackIgnore: true*/ contentFile(), "utf8");
  } catch {
    return defaultContent; // nothing saved yet
  }
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    console.error("content.json is not valid JSON; serving defaults. Restore it from shared/data/backups/.");
    return defaultContent;
  }
  const parsed = contentSchema.safeParse(json);
  if (parsed.success) return parsed.data;

  // A hand-edited file, or a stricter rule added later, must never take the site down
  // or hide every saved edit: keep each valid section, use the default only for the bad one.
  const saved = (json && typeof json === "object" ? json : {}) as Record<string, unknown>;
  const merged: Record<string, unknown> = {};
  const bad: string[] = [];
  for (const [key, field] of Object.entries(contentSchema.shape)) {
    const one = (field as z.ZodType).safeParse(key === "pages" ? salvagePages(saved[key]) : saved[key]);
    if (one.success) merged[key] = one.data;
    else {
      merged[key] = defaultContent[key as keyof SiteContent];
      bad.push(key);
    }
  }
  console.error(`content.json: invalid section(s) ${bad.join(", ")}; using defaults for those only`, parsed.error.issues.slice(0, 5));
  const recheck = contentSchema.safeParse(merged);
  return recheck.success ? recheck.data : defaultContent;
});

/** Keeps every page and section that is still valid, dropping only the broken ones. */
function salvagePages(raw: unknown): unknown {
  if (!Array.isArray(raw)) return raw;
  return raw
    .map((p) => (p && typeof p === "object" && Array.isArray((p as { sections?: unknown }).sections)
      ? { ...p, sections: (p as { sections: unknown[] }).sections.filter((s) => sectionSchema.safeParse(s).success) }
      : p))
    .filter((p) => pageSchema.safeParse(p).success);
}

/** Validates and saves content atomically, keeping timestamped backups of earlier versions. */
export async function saveContent(next: SiteContent): Promise<void> {
  const file = contentFile();
  const dir = path.dirname(file);
  const backups = path.join(dir, "backups");
  await fs.mkdir(/*turbopackIgnore: true*/ backups, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = path.join(backups, `content-${stamp}.json`);
  try {
    await fs.copyFile(/*turbopackIgnore: true*/ file, backup);
  } catch {
    // First save ever: keep the website's starting content, so it can always be restored.
    await fs.writeFile(/*turbopackIgnore: true*/ backup, JSON.stringify(defaultContent, null, 2), "utf8");
  }
  try {
    const old = (await fs.readdir(/*turbopackIgnore: true*/ backups)).filter((f) => f.startsWith("content-")).sort();
    await Promise.all(old.slice(0, Math.max(0, old.length - BACKUPS_TO_KEEP)).map((f) => fs.unlink(/*turbopackIgnore: true*/ path.join(backups, f))));
  } catch {
    // pruning old versions is best-effort
  }

  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(/*turbopackIgnore: true*/ tmp, JSON.stringify(next, null, 2), "utf8");
  await fs.rename(/*turbopackIgnore: true*/ tmp, file); // atomic on the same disk: readers never see a half-written file
}

/** Changes whenever content.json is saved; lets the admin spot a save made by someone else. */
export async function contentVersion(): Promise<number> {
  try {
    return (await fs.stat(/*turbopackIgnore: true*/ contentFile())).mtimeMs;
  } catch {
    return 0;
  }
}

// ---- Version history (the last 20 versions, kept automatically on every save) ----

const BACKUP_NAME = /^content-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)\.json$/;

/** The saved earlier versions, newest first. `replacedAt` is when a newer save replaced it. */
export async function listVersions(): Promise<{ file: string; replacedAt: string }[]> {
  const dir = path.join(path.dirname(contentFile()), "backups");
  let files: string[] = [];
  try {
    files = await fs.readdir(/*turbopackIgnore: true*/ dir);
  } catch {
    return [];
  }
  return files
    .map((file) => {
      const m = file.match(BACKUP_NAME);
      if (!m) return null;
      const [d, t] = m[1].split("T");
      const [hh, mm, ss, ms] = t.replace("Z", "").split("-");
      return { file, replacedAt: `${d}T${hh}:${mm}:${ss}.${ms}Z` };
    })
    .filter((v): v is { file: string; replacedAt: string } => v !== null)
    .sort((a, b) => b.replacedAt.localeCompare(a.replacedAt));
}

/** One earlier version, checked against the current rules (broken parts fall back safely). */
export async function readVersion(file: string): Promise<SiteContent | null> {
  if (!BACKUP_NAME.test(file)) return null;
  try {
    const raw = await fs.readFile(/*turbopackIgnore: true*/ path.join(path.dirname(contentFile()), "backups", file), "utf8");
    const parsed = contentSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
