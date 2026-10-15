import { promises as fs } from "fs";
import path from "path";
import { cache } from "react";
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
  const parsed = contentSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    // A hand-edited or corrupted file must never take the public site down.
    console.error("content.json is invalid; serving defaults instead", parsed.error.issues);
    return defaultContent;
  }
  return parsed.data;
});

/** Validates and saves content atomically, keeping timestamped backups of earlier versions. */
export async function saveContent(next: SiteContent): Promise<void> {
  const file = contentFile();
  const dir = path.dirname(file);
  const backups = path.join(dir, "backups");
  await fs.mkdir(/*turbopackIgnore: true*/ backups, { recursive: true });

  try {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    await fs.copyFile(/*turbopackIgnore: true*/ file, path.join(backups, `content-${stamp}.json`));
    const old = (await fs.readdir(/*turbopackIgnore: true*/ backups)).filter((f) => f.startsWith("content-")).sort();
    await Promise.all(old.slice(0, Math.max(0, old.length - BACKUPS_TO_KEEP)).map((f) => fs.unlink(/*turbopackIgnore: true*/ path.join(backups, f))));
  } catch {
    // first save: nothing to back up
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
