import { redirect } from "next/navigation";
import { readActivity } from "@/lib/activity";
import { currentUser } from "@/lib/auth";
import { contentVersion, getContent, listVersions } from "@/lib/content/store";
import { READ_ONLY } from "@/lib/data-files";
import { builtinImages, readMedia, toLibraryImage } from "@/lib/media";
import type { VersionInfo } from "./_editor/HistoryPanel";
import { readMessages } from "@/lib/messages";
import { readApplications } from "@/lib/applications";
import { readStaff, summarise } from "@/lib/staff";
import { AdminEditor } from "./AdminEditor";

export default async function AdminPage() {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  const isSuper = user.role === "superadmin";

  const [content, version, messages, applications, staff, activity, uploads, builtin, backups] = await Promise.all([
    getContent(),
    contentVersion(),
    readMessages(),
    readApplications(),
    isSuper ? readStaff() : Promise.resolve([]),
    readActivity(),
    readMedia(),
    builtinImages(),
    listVersions(),
  ]);

  // Who saved each earlier version: the last save before it was replaced.
  const saves = activity.filter((a) => a.action === "Saved changes" || a.action === "Restored an earlier version");
  const versions: VersionInfo[] = backups.map((v) => {
    const by = saves.find((a) => a.at < v.replacedAt);
    const replacer = [...saves].reverse().find((a) => a.at >= v.replacedAt);
    return { file: v.file, replacedAt: v.replacedAt, savedBy: by?.userName ?? null, savedAt: by?.at ?? null, replacedBy: replacer?.userName ?? null };
  });

  return (
    <AdminEditor
      user={user}
      initial={content}
      version={version}
      messages={messages}
      applications={applications}
      staff={staff.map(summarise)}
      activity={isSuper ? activity : []}
      images={[...uploads.map(toLibraryImage), ...builtin]}
      versions={versions}
      readOnly={READ_ONLY}
    />
  );
}
