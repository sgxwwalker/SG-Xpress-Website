import { headers } from "next/headers";

/**
 * The visitor's real IP, for rate limits. Nginx sets X-Real-IP to the connecting
 * address, which a visitor can't fake. The first X-Forwarded-For entry CAN be faked
 * (it's whatever the browser sent), so only the last one, added by Nginx, is trusted.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const real = h.get("x-real-ip")?.trim();
  if (real) return real;
  const forwarded = h.get("x-forwarded-for")?.split(",").map((s) => s.trim()).filter(Boolean);
  return forwarded?.at(-1) || "unknown";
}
