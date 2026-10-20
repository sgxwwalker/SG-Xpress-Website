import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { z } from "zod";
import { dataPath, readJson, writeJson } from "./data-files";

// Admin accounts.
// - One superadmin, defined by server settings (SUPERADMIN_USERNAME + ADMIN_PASSWORD_HASH_B64),
//   so it can never be deleted or locked out from the admin page. Its email, and a password it
//   changes or resets from the admin, are kept in superadmin.json. Deleting that file on the
//   server brings back the password from the server settings.
// - Staff accounts, created by the superadmin and stored in staff.json.

export type Role = "superadmin" | "staff";

export interface AdminUser {
  id: string;
  name: string;
  username: string;
  role: Role;
  email?: string; // where password-reset links are sent
}

export interface StaffRecord extends AdminUser {
  role: "staff";
  passwordHash: string;
  active: boolean;
  createdAt: string;
  createdBy: string;
  lastLoginAt?: string;
}

/** An account plus a fingerprint of its current password, stored in the session. */
export type SessionUser = AdminUser & { pv: string };

/** Changes whenever the password changes, so older sessions stop working. */
function passwordVersion(hash: string): string {
  return createHash("sha256").update(hash).digest("hex").slice(0, 16);
}

interface SuperadminFile {
  email?: string;
  passwordHash?: string;
}

const superadminFile = () => dataPath("superadmin.json");

async function readSuperadminFile(): Promise<SuperadminFile> {
  return readJson<SuperadminFile>(superadminFile(), {});
}

/** The superadmin's password: one changed in the admin wins over the server setting. */
async function superadminHash(): Promise<string> {
  return (await readSuperadminFile()).passwordHash || serverSuperadminHash();
}

function serverSuperadminHash(): string {
  // Forgive common copy-paste slips in hosting dashboards: surrounding spaces or quotes,
  // the whole "ADMIN_PASSWORD_HASH_B64=…" line pasted as the value, or a plain bcrypt hash.
  const value = (process.env.ADMIN_PASSWORD_HASH_B64 ?? "")
    .trim()
    .replace(/^ADMIN_PASSWORD_HASH_B64=/, "")
    .replace(/^["']|["']$/g, "")
    .trim();
  if (!value) throw new Error("ADMIN_PASSWORD_HASH_B64 is not set. Run `npm run hash-password`.");
  if (value.startsWith("$2")) return value;
  return Buffer.from(value, "base64").toString("utf8");
}

/** Staff details safe to send to the browser (no password hash). */
export type StaffSummary = Omit<StaffRecord, "passwordHash">;

export const SUPERADMIN_ID = "superadmin";
export const MIN_PASSWORD = 10;

const staffFile = () => dataPath("staff.json");

export function superadmin(): AdminUser {
  return {
    id: SUPERADMIN_ID,
    name: process.env.SUPERADMIN_NAME || "Superadmin",
    username: (process.env.SUPERADMIN_USERNAME || "admin").toLowerCase(),
    role: "superadmin",
  };
}

export function normaliseUsername(u: string): string {
  return u.trim().toLowerCase();
}

const emailSchema = z.string().trim().toLowerCase().max(200).email("Enter a valid email address, e.g. name@sgxpressja.com.");

/** "" (no email) or a valid, lower-cased address. Throws a plain-English message otherwise. */
function cleanEmail(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const res = emailSchema.safeParse(raw);
  if (!res.success) throw new Error(res.error.issues[0].message);
  return res.data;
}

async function emailTaken(email: string, exceptId: string): Promise<boolean> {
  if (!email) return false;
  const sa = await readSuperadminFile();
  if (exceptId !== SUPERADMIN_ID && sa.email === email) return true;
  return (await readStaff()).some((s) => s.id !== exceptId && s.email === email);
}

function checkPassword(password: unknown): string {
  if (typeof password !== "string" || password.length < MIN_PASSWORD) throw new Error(`Passwords need at least ${MIN_PASSWORD} characters.`);
  return password;
}

export async function readStaff(): Promise<StaffRecord[]> {
  return readJson<StaffRecord[]>(staffFile(), []);
}

async function writeStaff(list: StaffRecord[]): Promise<void> {
  await writeJson(staffFile(), list);
}

export function summarise(s: StaffRecord): StaffSummary {
  const { passwordHash: _hash, ...rest } = s; // eslint-disable-line @typescript-eslint/no-unused-vars
  return rest;
}

/** Checks a username + password. Returns the account, or null. */
// Compared against when a username doesn't exist, so a wrong username takes as long as a wrong password.
const DUMMY_HASH = "$2b$12$CwTycUXWue0Thq9StjUM0uJ8DPLKXt1FYlwYpQW2G3cAwjKoh2WZe";

export async function verifyLogin(username: string, password: string): Promise<SessionUser | null> {
  const u = normaliseUsername(username);
  const sa = superadmin();
  if (u === sa.username) {
    const hash = await superadminHash();
    return (await bcrypt.compare(password, hash)) ? { ...sa, pv: passwordVersion(hash) } : null;
  }
  const list = await readStaff();
  const rec = list.find((s) => s.username === u && s.active);
  if (!rec) {
    await bcrypt.compare(password, DUMMY_HASH);
    return null;
  }
  if (!(await bcrypt.compare(password, rec.passwordHash))) return null;
  rec.lastLoginAt = new Date().toISOString();
  await writeStaff(list).catch((err) => console.error("Couldn't record the login time", err));
  return { id: rec.id, name: rec.name, username: rec.username, role: "staff", pv: passwordVersion(rec.passwordHash) };
}

/** The current account for a session id, or null if it was removed or switched off. */
export async function findActiveUser(id: string): Promise<SessionUser | null> {
  if (id === SUPERADMIN_ID) {
    const file = await readSuperadminFile();
    return { ...superadmin(), email: file.email, pv: passwordVersion(file.passwordHash || serverSuperadminHash()) };
  }
  const rec = (await readStaff()).find((s) => s.id === id && s.active);
  return rec ? { id: rec.id, name: rec.name, username: rec.username, role: "staff", email: rec.email, pv: passwordVersion(rec.passwordHash) } : null;
}

/** The account a "forgot password" request is for (by username or email), if it can receive a reset email. */
export async function findForReset(login: string): Promise<AdminUser | null> {
  const key = normaliseUsername(login);
  if (!key) return null;
  const sa = superadmin();
  const file = await readSuperadminFile();
  if (file.email && (key === sa.username || key === file.email)) return { ...sa, email: file.email };
  const rec = (await readStaff()).find((s) => s.active && s.email && (s.username === key || s.email === key));
  return rec ? { id: rec.id, name: rec.name, username: rec.username, role: "staff", email: rec.email } : null;
}

/** Sets a new password for any account (used by password reset and "change my password"). */
export async function setPassword(id: string, password: string): Promise<void> {
  const hash = await bcrypt.hash(checkPassword(password), 12);
  if (id === SUPERADMIN_ID) {
    await writeJson(superadminFile(), { ...(await readSuperadminFile()), passwordHash: hash });
    return;
  }
  const list = await readStaff();
  const rec = list.find((s) => s.id === id && s.active);
  if (!rec) throw new Error("That account no longer exists.");
  rec.passwordHash = hash;
  await writeStaff(list);
}

/** Sets (or clears, with "") the email address an account's reset links go to. */
export async function setEmail(id: string, value: string): Promise<string> {
  const email = cleanEmail(value);
  if (await emailTaken(email, id)) throw new Error("Another account already uses that email address.");
  if (id === SUPERADMIN_ID) {
    const { email: _old, ...rest } = await readSuperadminFile(); // eslint-disable-line @typescript-eslint/no-unused-vars
    await writeJson(superadminFile(), email ? { ...rest, email } : rest);
    return email;
  }
  const list = await readStaff();
  const rec = list.find((s) => s.id === id);
  if (!rec) throw new Error("That staff account no longer exists.");
  if (email) rec.email = email;
  else delete rec.email;
  await writeStaff(list);
  return email;
}

export async function createStaff(input: { name: string; username: string; password: string; email?: string }, by: AdminUser): Promise<StaffSummary> {
  const username = normaliseUsername(String(input.username ?? ""));
  if (!/^[a-z0-9._-]{3,30}$/.test(username)) throw new Error("Usernames are 3–30 characters: letters, numbers, dots, dashes or underscores.");
  if (username === superadmin().username) throw new Error("That username is reserved for the superadmin.");
  if (typeof input.name !== "string" || typeof input.password !== "string") throw new Error("Fill in every field.");
  if (input.name.trim().length < 2) throw new Error("Enter the staff member's name.");
  if (input.password.length < MIN_PASSWORD) throw new Error(`Passwords need at least ${MIN_PASSWORD} characters.`);
  const email = cleanEmail(input.email);
  const list = await readStaff();
  if (list.some((s) => s.username === username)) throw new Error("That username is already taken.");
  if (await emailTaken(email, "")) throw new Error("Another account already uses that email address.");
  const rec: StaffRecord = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    username,
    role: "staff",
    passwordHash: await bcrypt.hash(input.password, 12),
    active: true,
    createdAt: new Date().toISOString(),
    createdBy: by.name,
    ...(email ? { email } : {}),
  };
  await writeStaff([...list, rec]);
  return summarise(rec);
}

export async function updateStaff(id: string, change: { active?: boolean; password?: string; remove?: boolean; email?: string }): Promise<StaffRecord> {
  if (change.email !== undefined) await setEmail(id, change.email);
  const list = await readStaff();
  const rec = list.find((s) => s.id === id);
  if (!rec) throw new Error("That staff account no longer exists.");
  if (change.password !== undefined) {
    if (typeof change.password !== "string" || change.password.length < MIN_PASSWORD) throw new Error(`Passwords need at least ${MIN_PASSWORD} characters.`);
    rec.passwordHash = await bcrypt.hash(change.password, 12);
  }
  if (change.active !== undefined) rec.active = change.active;
  await writeStaff(change.remove ? list.filter((s) => s.id !== id) : list);
  return rec;
}

export async function changeOwnPassword(id: string, current: string, next: string): Promise<void> {
  const hash = id === SUPERADMIN_ID ? await superadminHash() : (await readStaff()).find((s) => s.id === id && s.active)?.passwordHash;
  if (!hash) throw new Error("Your account could not be found.");
  if (!(await bcrypt.compare(String(current ?? ""), hash))) throw new Error("Your current password isn't right.");
  await setPassword(id, next);
}
