import { logActivity } from "@/lib/activity";
import { readCv } from "@/lib/applications";
import { currentUser } from "@/lib/auth";

// CVs are never public: only a logged-in admin can download one, and each download is logged.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return new Response("Not signed in", { status: 401 });

  const { id } = await params;
  const found = await readCv(id);
  if (!found) return new Response("Not found", { status: 404 });

  await logActivity(user, "Downloaded a CV", [`${found.app.name} · ${found.app.jobTitle}`]);
  const safeName = found.app.cv.fileName.replace(/[^\w.\- ]+/g, "_");
  return new Response(new Uint8Array(found.bytes), {
    headers: {
      "Content-Type": found.app.cv.type,
      "Content-Disposition": `attachment; filename="${safeName}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
