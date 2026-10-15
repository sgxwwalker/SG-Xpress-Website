import { redirect } from "next/navigation";
import { readActivity } from "@/lib/activity";
import { currentUser } from "@/lib/auth";
import { contentVersion, getContent } from "@/lib/content/store";
import { readMessages } from "@/lib/messages";
import { readApplications } from "@/lib/applications";
import { readStaff, summarise } from "@/lib/staff";
import { AdminEditor } from "./AdminEditor";

export default async function AdminPage() {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  const isSuper = user.role === "superadmin";

  const [content, version, messages, applications, staff, activity] = await Promise.all([
    getContent(),
    contentVersion(),
    readMessages(),
    readApplications(),
    isSuper ? readStaff() : Promise.resolve([]),
    isSuper ? readActivity() : Promise.resolve([]),
  ]);

  return (
    <AdminEditor
      user={user}
      initial={content}
      version={version}
      messages={messages}
      applications={applications}
      staff={staff.map(summarise)}
      activity={activity.slice(0, 300)}
    />
  );
}
