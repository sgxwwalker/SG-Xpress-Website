"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { clientIp } from "@/lib/client-ip";
import { describeChanges, lastSave, logActivity } from "@/lib/activity";
import { currentUser, endSession, startSession } from "@/lib/auth";
import { BLOCKS, type BlockType } from "@/lib/blocks/registry";
import { contentSchema } from "@/lib/content/schema";
import { READ_ONLY, READ_ONLY_MESSAGE } from "@/lib/data-files";
import { contentVersion, getContent, listVersions, readVersion, saveContent } from "@/lib/content/store";
import { checkUpload, deleteMedia as removeMedia, MAX_UPLOAD_BYTES, saveMedia, toLibraryImage, updateMediaAlt, type LibraryImage } from "@/lib/media";
import { deleteMessage as removeMessage, readMessages } from "@/lib/messages";
import { APPLICATION_STATUSES, deleteApplication as removeApplication, setApplicationStatus, type ApplicationStatus } from "@/lib/applications";
import { mailConfigured, mailToConsole, sendMail } from "@/lib/mailer";
import { createResetToken, RESET_MINUTES_TEXT, redeemResetToken } from "@/lib/password-reset";
import {
  changeOwnPassword as setOwnPassword, createStaff, findActiveUser, findForReset, setEmail, summarise, updateStaff, verifyLogin, type StaffSummary,
} from "@/lib/staff";

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

// ---- Forgotten passwords ----

// At most 3 reset emails an hour per username/email typed, and per connection.
const resetRequests = new Map<string, number[]>();
const RESET_LIMIT = 3;
const RESET_WINDOW_MS = 60 * 60 * 1000;

export type ResetRequestState = { kind: "sent" | "error"; text: string };

async function siteOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (configured) return configured;
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host") ?? "localhost:3000"}`;
}

export async function requestPasswordReset(_prev: ResetRequestState | undefined, formData: FormData): Promise<ResetRequestState> {
  if (READ_ONLY) return { kind: "error", text: READ_ONLY_MESSAGE };
  if (!mailConfigured() && !mailToConsole()) {
    return { kind: "error", text: "Password reset by email isn't set up on this website yet. Ask the superadmin to reset your password." };
  }
  const login = String(formData.get("login") ?? "").trim().toLowerCase().slice(0, 200);
  if (!login) return { kind: "error", text: "Enter your username or email address." };

  const now = Date.now();
  const keys = [`r:${login}`, `ip:${await clientIp()}`];
  const recent = keys.map((k) => {
    const list = (resetRequests.get(k) ?? []).filter((t) => now - t < RESET_WINDOW_MS);
    resetRequests.set(k, list);
    return list;
  });
  if (recent.some((list) => list.length >= RESET_LIMIT)) {
    return { kind: "error", text: "Too many reset requests. Please wait an hour and try again, or ask the superadmin." };
  }
  recent.forEach((list) => list.push(now));

  const user = await findForReset(login);
  if (user?.email) {
    const link = `${await siteOrigin()}/admin/reset?token=${await createResetToken(user.id)}`;
    const mail = {
      to: user.email,
      subject: "Reset your SG Xpress website password",
      text: [
        `Hi ${user.name},`,
        "",
        "Someone (hopefully you) asked to reset the password for your SG Xpress website admin account.",
        "",
        "Choose a new password here:",
        link,
        "",
        `This link works once and expires in ${RESET_MINUTES_TEXT}.`,
        "",
        "If you didn't ask for this, ignore this email; your password hasn't changed.",
      ].join("\n"),
    };
    if (mailToConsole()) console.log(`\n[password reset email, not sent: no SMTP settings]\nTo: ${mail.to}\n${mail.text}\n`);
    else await sendMail(mail);
    await logActivity(user, "Asked for a password reset email");
  }
  await new Promise((r) => setTimeout(r, 800)); // same wait whether or not the account exists
  return {
    kind: "sent",
    text: "If that account has an email address, we've sent it a link to reset the password. Check your inbox (and spam folder). The link expires in " + RESET_MINUTES_TEXT + ".",
  };
}

export async function resetPassword(_prev: { error?: string; expired?: boolean } | undefined, formData: FormData): Promise<{ error?: string; expired?: boolean }> {
  if (READ_ONLY) return { error: READ_ONLY_MESSAGE };
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  if (password !== String(formData.get("confirm") ?? "")) return { error: "The two passwords don't match." };
  let userId: string | null;
  try {
    userId = await redeemResetToken(token, password);
  } catch (e) {
    return { error: (e as Error).message };
  }
  if (!userId) return { expired: true };
  const user = await findActiveUser(userId);
  if (user) {
    const { pv: _pv, ...who } = user; // eslint-disable-line @typescript-eslint/no-unused-vars
    await logActivity(who, "Reset their password by email");
  }
  redirect("/admin/login?reset=1");
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

/** Turns the validator's technical wording into plain English. */
function plain(message: string, path: PropertyKey[]): string {
  const field = [...path].reverse().find((p) => typeof p === "string");
  const name = field ? String(field).replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase() : "a field";
  const tooLong = message.match(/Too big: expected string to have <=\s*(\d+) characters/);
  if (tooLong) return `the ${name} is too long. Keep it to ${tooLong[1]} characters or fewer.`;
  const tooShort = message.match(/Too small: expected string to have >=\s*(\d+) characters?/);
  if (tooShort) return `the ${name} is empty. Please fill it in.`;
  const tooMany = message.match(/Too big: expected array to have <=\s*(\d+) items/);
  if (tooMany) return `too many items in ${name}. The most allowed is ${tooMany[1]}.`;
  return message;
}

/** "Pages › Home › section 3 (Cards): Every button needs a label." */
function friendlyError(raw: { path: PropertyKey[]; message: string }, input: unknown): string {
  const issue = { ...raw, message: plain(raw.message, raw.path) };
  const [top, pageIndex, part, sectionIndex] = issue.path;
  if (top === "pages" && typeof pageIndex === "number") {
    const page = (input as { pages?: { name?: string; sections?: { type?: string }[] }[] }).pages?.[pageIndex];
    let where = `Pages › ${page?.name ?? `page ${pageIndex + 1}`}`;
    if (part === "sections" && typeof sectionIndex === "number") {
      const type = page?.sections?.[sectionIndex]?.type as BlockType | undefined;
      where += ` › section ${sectionIndex + 1}${type && BLOCKS[type] ? ` (${BLOCKS[type].name})` : ""}`;
    }
    return `${where}: ${issue.message}`;
  }
  if (top === "jobs" && typeof pageIndex === "number") {
    const job = (input as { jobs?: { title?: string }[] }).jobs?.[pageIndex];
    return `Careers › ${job?.title?.trim() || `job ${pageIndex + 1}`}: ${issue.message}`;
  }
  return `${SECTION_NAMES[String(top)] ?? String(top)}: ${issue.message}`;
}

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
  if (!parsed.success) return { ok: false, error: friendlyError(parsed.error.issues[0], input) };

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

export async function addStaff(input: { name: string; username: string; password: string; email?: string }): Promise<AccountResult> {
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

export async function manageStaff(id: string, change: { active?: boolean; password?: string; remove?: boolean; email?: string }): Promise<AccountResult> {
  const sa = await requireSuperadmin();
  if (!sa) return { ok: false, error: "Only the superadmin can manage staff." };
  if (READ_ONLY) return { ok: false, error: READ_ONLY_MESSAGE };
  try {
    const rec = await updateStaff(id, change);
    const what = change.remove
      ? "Removed a staff account"
      : change.password
        ? "Reset a staff password"
        : change.email !== undefined
          ? "Changed a staff email"
          : change.active
            ? "Switched a staff account on"
            : "Switched a staff account off";
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

export async function setMyEmail(email: string): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Your session has ended. Log in again." };
  if (READ_ONLY) return { ok: false, error: READ_ONLY_MESSAGE };
  try {
    const saved = await setEmail(user.id, email);
    await logActivity(user, saved ? "Changed their email" : "Removed their email", saved ? [saved] : []);
    return { ok: true, email: saved };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ---- Media library ----

export type UploadResult = { ok: true; image: LibraryImage } | { ok: false; error: string };

export async function uploadMedia(form: FormData): Promise<UploadResult> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Your session has ended. Log in again." };
  if (READ_ONLY) return { ok: false, error: READ_ONLY_MESSAGE };
  const file = form.get("file");
  if (!(file instanceof File)) return { ok: false, error: "Choose a picture to upload." };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: "That picture is larger than 5 MB. Please use a smaller one." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const problem = checkUpload(bytes);
  if (problem) return { ok: false, error: problem };
  try {
    const item = await saveMedia(bytes, file.name, String(form.get("alt") ?? ""), user.name);
    await logActivity(user, "Uploaded a picture", [item.name]);
    return { ok: true, image: toLibraryImage(item) };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function setMediaAlt(id: string, alt: string): Promise<{ ok: boolean }> {
  const user = await currentUser();
  if (!user || READ_ONLY || typeof alt !== "string") return { ok: false };
  return { ok: Boolean(await updateMediaAlt(String(id), alt)) };
}

/** Deletes a picture, unless a page still uses it. */
export async function deleteMediaItem(id: string, file: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Your session has ended. Log in again." };
  if (READ_ONLY) return { ok: false, error: READ_ONLY_MESSAGE };
  const c = await getContent();
  const usedOn = c.pages.filter((p) => JSON.stringify(p.sections).includes(`/media/${file}`)).map((p) => p.name);
  if (usedOn.length) return { ok: false, error: `This picture is still used on: ${usedOn.join(", ")}. Replace it there first, then delete it.` };
  const item = await removeMedia(String(id));
  if (!item) return { ok: false, error: "That picture was already deleted." };
  await logActivity(user, "Deleted a picture", [item.name]);
  return { ok: true };
}

// ---- Version history ----

export async function restoreVersion(file: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Your session has ended. Log in again." };
  if (READ_ONLY) return { ok: false, error: READ_ONLY_MESSAGE };
  if (!(await listVersions()).some((v) => v.file === file)) return { ok: false, error: "That version is no longer available." };
  const version = await readVersion(file);
  if (!version) return { ok: false, error: "That version can't be restored because it doesn't match the website's current rules." };
  const changes = describeChanges(await getContent(), version);
  if (!changes.length) return { ok: false, error: "The website already matches that version." };
  await saveContent(version); // the current version is kept in the history too
  await logActivity(user, "Restored an earlier version", changes);
  revalidatePath("/", "layout");
  return { ok: true };
}
