"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clientIp } from "@/lib/client-ip";
import { describeChanges, lastSave, logActivity } from "@/lib/activity";
import { currentUser, endSession, startSession } from "@/lib/auth";
import { contentSchema } from "@/lib/content/schema";
import { READ_ONLY, READ_ONLY_MESSAGE } from "@/lib/data-files";
import { contentVersion, getContent, saveContent } from "@/lib/content/store";
import { deleteMessage as removeMessage, readMessages } from "@/lib/messages";
import { APPLICATION_STATUSES, deleteApplication as removeApplication, setApplicationStatus, type ApplicationStatus } from "@/lib/applications";
import { changeOwnPassword as setOwnPassword, createStaff, findActiveUser, summarise, updateStaff, verifyLogin, type StaffSummary } from "@/lib/staff";

// ---- Logging in ----

// After 5 wrong passwords for a username (or from one connection), wait 10 minutes.
const failures = new Map<string, number[]>();
const LOCK_AFTER = 5;
const LOCK_MS = 10 * 60 * 1000;

function recentFailures(key: string): number[] {
  const now = Date.now();
  const list = (failures.get(key) ?? []).filter((t) => now - t < LOCK_MS);
  failures.set(key, list);
  return list;
}

export async function login(_prev: { error?: string } | undefined, formData: FormData): Promise<{ error?: string }> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const ip = await clientIp();
  const keys = [`u:${username}`, `ip:${ip}`];

  if (keys.some((k) => recentFailures(k).length >= LOCK_AFTER)) {
    return { error: "Too many wrong attempts. Please wait 10 minutes and try again." };
  }

  const user = username && password ? await verifyLogin(username, password) : null;
  if (!user) {
    keys.forEach((k) => recentFailures(k).push(Date.now()));
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return { error: "That username or password isn't right." };
  }

  keys.forEach((k) => failures.delete(k));
  await startSession(user);
  await logActivity(user, "Logged in");
  redirect("/admin");
}

export async function logout(): Promise<void> {
  const user = await currentUser();
  if (user) await logActivity(user, "Logged out");
  await endSession();
  redirect("/admin/login");
}

// ---- Content ----

const SECTION_NAMES: Record<string, string> = {
  notice: "Notice bar",
  airRates: "Air rates",
  processingFees: "Processing fee",
  fees: "Other charges",
  serviceCharge: "SG Xpress Service Charge",
  usaAir: "Air schedule",
  warehouseHours: "Florida warehouse hours",
  ocean: "USA Ocean",
  china: "China Direct",
  hours: "Opening hours",
  branches: "Branches",
  contact: "Contact details",
  faqs: "FAQs",
  chinaWarehouses: "China addresses",
  jobs: "Careers",
  socials: "Social links",
};

export type SaveResult = { ok: true; savedAt: string; version: number } | { ok: false; error: string };

/** Saves the site content. `baseVersion` is the version the editor loaded, to catch overlapping edits. */
export async function save(input: unknown, baseVersion: number): Promise<SaveResult> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Your session has ended. Log in again." };
  if (READ_ONLY) return { ok: false, error: READ_ONLY_MESSAGE };

  if ((await contentVersion()) !== baseVersion) {
    const last = await lastSave();
    const who = last && last.userId !== user.id ? `${last.userName} saved changes at ${new Date(last.at).toLocaleTimeString()}` : "Someone else saved changes";
    return { ok: false, error: `${who} while you were editing. Copy anything you need, then reload the page to see their changes before saving.` };
  }

  const parsed = contentSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = SECTION_NAMES[String(issue.path[0])] ?? String(issue.path[0]);
    return { ok: false, error: `${where}: ${issue.message}` };
  }

  const before = await getContent();
  const changes = describeChanges(before, parsed.data);
  if (!changes.length) return { ok: false, error: "There are no changes to save." };

  await saveContent(parsed.data);
  await logActivity(user, "Saved changes", changes);
  revalidatePath("/", "layout"); // rebuild every public page with the new content
  return { ok: true, savedAt: new Date().toISOString(), version: await contentVersion() };
}

export async function deleteMessage(id: string): Promise<{ ok: boolean }> {
  const user = await currentUser();
  if (!user || READ_ONLY) return { ok: false };
  // Describe it from the saved copy, not from what the browser sent.
  const msg = (await readMessages()).find((m) => m.id === id);
  if (!msg) return { ok: false };
  await removeMessage(id);
  await logActivity(user, "Deleted a message", [`${msg.name} (${msg.email}): ${msg.message.slice(0, 80)}`]);
  return { ok: true };
}

// ---- Job applications ----

export async function updateApplicationStatus(id: string, status: ApplicationStatus): Promise<{ ok: boolean }> {
  const user = await currentUser();
  if (!user || READ_ONLY || !APPLICATION_STATUSES.includes(status)) return { ok: false };
  const app = await setApplicationStatus(id, status);
  if (!app) return { ok: false };
  await logActivity(user, "Updated an application", [`${app.name} · ${app.jobTitle}: ${status}`]);
  return { ok: true };
}

export async function deleteApplication(id: string): Promise<{ ok: boolean }> {
  const user = await currentUser();
  if (!user || READ_ONLY) return { ok: false };
  const app = await removeApplication(id);
  if (!app) return { ok: false };
  await logActivity(user, "Deleted an application", [`${app.name} · ${app.jobTitle}`]);
  return { ok: true };
}

// ---- Accounts ----

export type AccountResult = { ok: true; staff?: StaffSummary } | { ok: false; error: string };

async function requireSuperadmin() {
  const user = await currentUser();
  return user?.role === "superadmin" ? user : null;
}

export async function addStaff(input: { name: string; username: string; password: string }): Promise<AccountResult> {
  const sa = await requireSuperadmin();
  if (!sa) return { ok: false, error: "Only the superadmin can add staff." };
  if (READ_ONLY) return { ok: false, error: READ_ONLY_MESSAGE };
  try {
    const staff = await createStaff(input, sa);
    await logActivity(sa, "Added a staff account", [`${staff.name} (${staff.username})`]);
    return { ok: true, staff };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function manageStaff(id: string, change: { active?: boolean; password?: string; remove?: boolean }): Promise<AccountResult> {
  const sa = await requireSuperadmin();
  if (!sa) return { ok: false, error: "Only the superadmin can manage staff." };
  if (READ_ONLY) return { ok: false, error: READ_ONLY_MESSAGE };
  try {
    const rec = await updateStaff(id, change);
    const what = change.remove ? "Removed a staff account" : change.password ? "Reset a staff password" : change.active ? "Switched a staff account on" : "Switched a staff account off";
    await logActivity(sa, what, [`${rec.name} (${rec.username})`]);
    return { ok: true, staff: change.remove ? undefined : summarise(rec) };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function changeMyPassword(current: string, next: string): Promise<AccountResult> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Your session has ended. Log in again." };
  if (READ_ONLY) return { ok: false, error: READ_ONLY_MESSAGE };
  if (user.role === "superadmin") {
    return { ok: false, error: `The superadmin password is set on the server. Run: npm run hash-password` };
  }
  try {
    await setOwnPassword(user.id, current, next);
    // The change ends every other session; keep this one signed in.
    const fresh = await findActiveUser(user.id);
    if (fresh) await startSession(fresh);
    await logActivity(user, "Changed their password");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
