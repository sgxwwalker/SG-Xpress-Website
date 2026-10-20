import { createHash, randomBytes } from "crypto";
import { dataPath, readJson, writeJson } from "./data-files";
import { setPassword } from "./staff";

// "Forgot password" links. Only a fingerprint of each link is stored, so the file alone
// can't be used to reset anyone's password. A link works once and expires after 30 minutes;
// asking again replaces the earlier link.

const RESET_MINUTES = 30;
export const RESET_MINUTES_TEXT = `${RESET_MINUTES} minutes`;

interface ResetRecord {
  userId: string;
  hash: string;
  expires: number;
}

const resetsFile = () => dataPath("password-resets.json");

const fingerprint = (token: string) => createHash("sha256").update(token).digest("hex");

async function readLive(): Promise<ResetRecord[]> {
  const now = Date.now();
  return (await readJson<ResetRecord[]>(resetsFile(), [])).filter((r) => r.expires > now);
}

/** Makes a new one-time link token for an account. */
export async function createResetToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const list = (await readLive()).filter((r) => r.userId !== userId);
  list.push({ userId, hash: fingerprint(token), expires: Date.now() + RESET_MINUTES * 60 * 1000 });
  await writeJson(resetsFile(), list);
  return token;
}

/** True while the link can still be used (to show the form or an "expired" message). */
export async function resetTokenValid(token: string): Promise<boolean> {
  if (!token) return false;
  const hash = fingerprint(token);
  return (await readLive()).some((r) => r.hash === hash);
}

/** Sets the new password and uses up the link. Returns the account id, or null if the link is no good. */
export async function redeemResetToken(token: string, password: string): Promise<string | null> {
  if (!token) return null;
  const hash = fingerprint(token);
  const list = await readLive();
  const rec = list.find((r) => r.hash === hash);
  if (!rec) return null;
  await setPassword(rec.userId, password); // throws a plain message if the password is too short
  await writeJson(resetsFile(), list.filter((r) => r.userId !== rec.userId));
  return rec.userId;
}
