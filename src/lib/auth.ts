import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { findActiveUser, type AdminUser, type SessionUser } from "./staff";

const COOKIE = "sgx_admin";
const SESSION_SECONDS = 8 * 60 * 60;

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET is missing or too short. Generate one with `openssl rand -base64 32`.");
  }
  return new TextEncoder().encode(secret);
}

export async function startSession(user: SessionUser): Promise<void> {
  // pv = password fingerprint: a password change or reset ends every older session.
  const token = await new SignJWT({ name: user.name, role: user.role, pv: user.pv })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .sign(secretKey());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SESSION_SECONDS,
    path: "/admin",
  });
}

/**
 * The signed-in account, or null. The account is re-checked on every request, so
 * switching a staff member off, removing them or changing their password logs them out straight away.
 */
export async function currentUser(): Promise<AdminUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const found = payload.sub ? await findActiveUser(payload.sub) : null;
    if (!found || payload.pv !== found.pv) return null;
    const { pv: _pv, ...user } = found; // eslint-disable-line @typescript-eslint/no-unused-vars
    return user;
  } catch {
    return null; // expired or tampered
  }
}

export async function endSession(): Promise<void> {
  (await cookies()).delete({ name: COOKIE, path: "/admin" });
}
