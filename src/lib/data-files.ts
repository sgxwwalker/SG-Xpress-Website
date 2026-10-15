import { promises as fs } from "fs";
import path from "path";

// Small JSON files kept next to content.json (outside the code folder on the server).
// Paths are only known at runtime, hence the turbopackIgnore hints.

/**
 * True on hosts that can't keep files between visits (Vercel). The site still shows
 * every page and the admin still signs in, but saving is switched off with a clear message.
 */
export const READ_ONLY = process.env.VERCEL === "1" || process.env.READ_ONLY_PREVIEW === "1";
export const READ_ONLY_MESSAGE = "This is a preview copy of the website, so saving is switched off here. Make changes on the staging or live site.";

export function dataPath(name: string): string {
  const content = process.env.CONTENT_FILE;
  return content ? path.join(path.dirname(content), name) : path.join(process.cwd(), "data", name);
}

export async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(/*turbopackIgnore: true*/ file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

/** Writes via a temp file + rename so readers never see a half-written file. */
export async function writeJson(file: string, data: unknown): Promise<void> {
  await fs.mkdir(/*turbopackIgnore: true*/ path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(/*turbopackIgnore: true*/ tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(/*turbopackIgnore: true*/ tmp, file);
}
