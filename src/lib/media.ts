import { promises as fs } from "fs";
import path from "path";
import { dataPath, readJson, writeJson } from "./data-files";

// The media library: pictures staff upload in /admin. Files live in a "media" folder next
// to content.json (so they're in the nightly backup) and are served at /media/<file>.

export type MediaItem = {
  id: string;
  file: string; // e.g. "3f2a9c1e5b7d.webp", served at /media/<file>
  name: string; // original file name, for staff
  alt: string; // default description, copied into a section when chosen
  width: number;
  height: number;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
};

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_SIDE = 2000;
const KEEP = 500;
export const MEDIA_FILE = /^[a-f0-9]{12,40}\.(webp|jpg|png|gif)$/;

const listFile = () => dataPath("media.json");
const mediaDir = () => dataPath("media");

export async function readMedia(): Promise<MediaItem[]> {
  return readJson<MediaItem[]>(listFile(), []);
}

/** The real type of an image from its first bytes (never trust the file name). */
function sniff(b: Uint8Array): "jpg" | "png" | "webp" | "gif" | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return "gif";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "webp";
  return null;
}

export function checkUpload(bytes: Uint8Array): string | null {
  if (bytes.length === 0) return "Choose a picture to upload.";
  if (bytes.length > MAX_UPLOAD_BYTES) return "That picture is larger than 5 MB. Please use a smaller one.";
  if (!sniff(bytes)) return "Upload a JPG, PNG, WebP or GIF picture.";
  return null;
}

/**
 * Saves an upload. Photos are resized to at most 2000 px and re-saved as WebP, which keeps
 * pages fast and strips hidden data (like a phone's GPS location). GIFs are kept as they are.
 */
export async function saveMedia(bytes: Uint8Array, name: string, alt: string, by: string): Promise<MediaItem> {
  const problem = checkUpload(bytes);
  if (problem) throw new Error(problem);
  const type = sniff(bytes)!;

  let out: Buffer = Buffer.from(bytes);
  let ext: string = type;
  let width = 0;
  let height = 0;
  try {
    const sharp = (await import("sharp")).default;
    if (type === "gif") {
      const meta = await sharp(out).metadata();
      width = meta.width ?? 0;
      height = meta.pageHeight ?? meta.height ?? 0;
    } else {
      const { data, info } = await sharp(out)
        .rotate() // respect the phone's orientation before the data is stripped
        .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer({ resolveWithObject: true });
      out = data;
      ext = "webp";
      width = info.width;
      height = info.height;
    }
  } catch (err) {
    // Image tools unavailable on this server: keep the checked original as uploaded.
    console.error("Couldn't process the uploaded picture; saving the original.", err);
  }

  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const file = `${id}.${ext}`;
  await fs.mkdir(/*turbopackIgnore: true*/ mediaDir(), { recursive: true });
  await fs.writeFile(/*turbopackIgnore: true*/ path.join(mediaDir(), file), out);

  const item: MediaItem = {
    id,
    file,
    name: path.basename(name).slice(0, 120) || file,
    alt: alt.trim().slice(0, 300),
    width,
    height,
    size: out.length,
    uploadedAt: new Date().toISOString(),
    uploadedBy: by,
  };
  const list = await readMedia();
  await writeJson(listFile(), [item, ...list].slice(0, KEEP));
  return item;
}

export async function updateMediaAlt(id: string, alt: string): Promise<MediaItem | null> {
  const list = await readMedia();
  const item = list.find((m) => m.id === id);
  if (!item) return null;
  item.alt = alt.trim().slice(0, 300);
  await writeJson(listFile(), list);
  return item;
}

export async function deleteMedia(id: string): Promise<MediaItem | null> {
  const list = await readMedia();
  const item = list.find((m) => m.id === id);
  if (!item) return null;
  if (MEDIA_FILE.test(item.file)) await fs.rm(/*turbopackIgnore: true*/ path.join(mediaDir(), item.file), { force: true });
  await writeJson(listFile(), list.filter((m) => m.id !== id));
  return item;
}

export async function readMediaFile(file: string): Promise<Buffer | null> {
  if (!MEDIA_FILE.test(file)) return null;
  try {
    return await fs.readFile(/*turbopackIgnore: true*/ path.join(mediaDir(), file));
  } catch {
    return null;
  }
}

// ---- Built-in pictures (the ones that came with the site) ----

export type LibraryImage = { src: string; name: string; alt: string; width: number; height: number; builtin: boolean; id?: string; uploadedAt?: string; size?: number };

let builtinCache: LibraryImage[] | null = null;

/** Pictures in /public/images, so staff can reuse them. Store badges are left out. */
export async function builtinImages(): Promise<LibraryImage[]> {
  if (builtinCache) return builtinCache;
  const dir = path.join(process.cwd(), "public", "images");
  let files: string[] = [];
  try {
    files = (await fs.readdir(/*turbopackIgnore: true*/ dir)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f) && !f.startsWith("badge-"));
  } catch {
    return [];
  }
  const out: LibraryImage[] = [];
  for (const f of files.sort()) {
    let width = 800;
    let height = 800;
    try {
      const sharp = (await import("sharp")).default;
      const meta = await sharp(path.join(dir, f)).metadata();
      width = meta.width ?? width;
      height = meta.height ?? height;
    } catch {
      // size unknown: a square is a safe guess for layout
    }
    out.push({ src: `/images/${f}`, name: f, alt: "", width, height, builtin: true });
  }
  builtinCache = out;
  return out;
}

export function toLibraryImage(m: MediaItem): LibraryImage {
  return { src: `/media/${m.file}`, name: m.name, alt: m.alt, width: m.width, height: m.height, builtin: false, id: m.id, uploadedAt: m.uploadedAt, size: m.size };
}
