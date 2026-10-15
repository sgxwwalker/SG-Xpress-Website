import bcrypt from "bcryptjs";
import { dataPath, readJson, writeJson } from "./data-files";

// Admin accounts.
// - One superadmin, defined only by server settings (SUPERADMIN_USERNAME + ADMIN_PASSWORD_HASH_B64),
//   so it can never be deleted or locked out from the admin page.
// - Staff accounts, created by the superadmin and stored in staff.json.

export type Role = "superadmin" | "staff";

export interface AdminUser {
  id: string;
  name: string;
  username: string;
  role: Role;
}

export interface StaffRecord extends AdminUser {
  role: "staff";
  passwordHash: string;
  active: boolean;
  createdAt: string;
  createdBy: string;
  lastLoginAt?: string;
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
export async function verifyLogin(username: string, password: string): Promise<AdminUser | null> {
  const u = normaliseUsername(username);
  const sa = superadmin();
  if (u === sa.username) {
    const b64 = process.env.ADMIN_PASSWORD_HASH_B64;
    if (!b64) throw new Error("ADMIN_PASSWORD_HASH_B64 is not set. Run `npm run hash-password -- \"…\"`.");
    return (await bcrypt.compare(password, Buffer.from(b64, "base64").toString("utf8"))) ? sa : null;
  }
  const list = await readStaff();
  const rec = list.find((s) => s.username === u && s.active);
  if (!rec || !(await bcrypt.compare(password, rec.passwordHash))) return null;
  rec.lastLoginAt = new Date().toISOString();
  await writeStaff(list);
  return { id: rec.id, name: rec.name, username: rec.username, role: "staff" };
}

/** The current account for a session id, or null if it was removed or switched off. */
export async function findActiveUser(id: string): Promise<AdminUser | null> {
  if (id === SUPERADMIN_ID) return superadmin();
  const rec = (await readStaff()).find((s) => s.id === id && s.active);
  return rec ? { id: rec.id, name: rec.name, username: rec.username, role: "staff" } : null;
}

export async function createStaff(input: { name: string; username: string; password: string }, by: AdminUser): Promise<StaffSummary> {
  const username = normaliseUsername(input.username);
  if (!/^[a-z0-9._-]{3,30}$/.test(username)) throw new Error("Usernames are 3–30 characters: letters, numbers, dots, dashes or underscores.");
  if (username === superadmin().username) throw new Error("That username is reserved for the superadmin.");
  if (input.name.trim().length < 2) throw new Error("Enter the staff member's name.");
  if (input.password.length < MIN_PASSWORD) throw new Error(`Passwords need at least ${MIN_PASSWORD} characters.`);
  const list = await readStaff();
  if (list.some((s) => s.username === username)) throw new Error("That username is already taken.");
  const rec: StaffRecord = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    username,
    role: "staff",
    passwordHash: await bcrypt.hash(input.password, 12),
    active: true,
    createdAt: new Date().toISOString(),
    createdBy: by.name,
  };
  await writeStaff([...list, rec]);
  return summarise(rec);
}

export async function updateStaff(id: string, change: { active?: boolean; password?: string; remove?: boolean }): Promise<StaffRecord> {
  const list = await readStaff();
  const rec = list.find((s) => s.id === id);
  if (!rec) throw new Error("That staff account no longer exists.");
  if (change.password !== undefined) {
    if (change.password.length < MIN_PASSWORD) throw new Error(`Passwords need at least ${MIN_PASSWORD} characters.`);
    rec.passwordHash = await bcrypt.hash(change.password, 12);
  }
  if (change.active !== undefined) rec.active = change.active;
  await writeStaff(change.remove ? list.filter((s) => s.id !== id) : list);
  return rec;
}

export async function changeOwnPassword(id: string, current: string, next: string): Promise<void> {
  const list = await readStaff();
  const rec = list.find((s) => s.id === id && s.active);
  if (!rec) throw new Error("Your account could not be found.");
  if (!(await bcrypt.compare(current, rec.passwordHash))) throw new Error("Your current password isn't right.");
  if (next.length < MIN_PASSWORD) throw new Error(`Passwords need at least ${MIN_PASSWORD} characters.`);
  rec.passwordHash = await bcrypt.hash(next, 12);
  await writeStaff(list);
}
