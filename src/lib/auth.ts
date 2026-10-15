import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { findActiveUser, type AdminUser } from "./staff";

const COOKIE = "sgx_admin";
const SESSION_SECONDS = 8 * 60 * 60;

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET is missing or too short. Generate one with `openssl rand -base64 32`.");
  }
  return new TextEncoder().encode(secret);
}

export async function startSession(user: AdminUser): Promise<void> {
  const token = await new SignJWT({ name: user.name, role: user.role })
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
 * The signed-in account, or null. The account is re-checked on every request,
 * so switching a staff member off or removing them logs them out straight away.
 */
export async function currentUser(): Promise<AdminUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload.sub ? await findActiveUser(payload.sub) : null;
  } catch {
    return null; // expired or tampered
  }
}

export async function endSession(): Promise<void> {
  (await cookies()).delete({ name: COOKIE, path: "/admin" });
}
