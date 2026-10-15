import { promises as fs } from "fs";
import path from "path";

// Small JSON files kept next to content.json (outside the code folder on the server).
// Paths are only known at runtime, hence the turbopackIgnore hints.

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
