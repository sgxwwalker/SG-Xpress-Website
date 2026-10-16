import { MEDIA_FILE, readMediaFile } from "@/lib/media";

// Serves pictures uploaded in /admin → Media library. File names are random and never
// reused, so browsers can keep them for a year.

const TYPES: Record<string, string> = { webp: "image/webp", jpg: "image/jpeg", png: "image/png", gif: "image/gif" };

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!MEDIA_FILE.test(file)) return new Response("Not found", { status: 404 });
  const bytes = await readMediaFile(file);
  if (!bytes) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": TYPES[file.split(".").pop()!],
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
