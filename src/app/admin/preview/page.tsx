import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getContent } from "@/lib/content/store";
import { PreviewClient } from "./PreviewClient";

// The live preview shown beside the page editor. It starts with the saved page, then
// shows unsaved edits sent from the editor. Only signed-in staff can open it.

export default async function PreviewPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!(await currentUser())) redirect("/admin/login");
  const { page } = await searchParams;
  return <PreviewClient initial={await getContent()} pageId={typeof page === "string" ? page : "home"} />;
}
