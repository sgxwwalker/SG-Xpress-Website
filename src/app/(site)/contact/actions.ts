"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { CONTACT_TOPICS } from "@/lib/contact";
import { emailMessage, saveMessage } from "@/lib/messages";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(100),
  email: z.string().trim().email("Please enter a valid email address.").max(200),
  phone: z.string().trim().max(40),
  sgxNumber: z.string().trim().max(40),
  topic: z.enum(CONTACT_TOPICS),
  message: z.string().trim().min(10, "Please tell us a little more (at least 10 characters).").max(4000),
});

type Field = keyof z.infer<typeof schema>;
export type ContactState = { ok?: boolean; error?: string; fieldErrors?: Partial<Record<Field, string>>; values?: Partial<Record<Field, string>> };

// Light spam control: a hidden "website" field bots fill in, a minimum time on the page,
// a per-IP limit, and Cloudflare Turnstile when its keys are configured.
const recent = new Map<string, number[]>();
const LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;

async function turnstileOk(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    });
    return Boolean(((await res.json()) as { success?: boolean }).success);
  } catch {
    return false;
  }
}

export async function sendContactMessage(_prev: ContactState | undefined, form: FormData): Promise<ContactState> {
  // Echo what was typed so the form can refill itself after an error.
  const values = Object.fromEntries(
    (["name", "email", "phone", "sgxNumber", "topic", "message"] as const).map((k) => [k, String(form.get(k) ?? "")]),
  ) as ContactState["values"];
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "unknown";

  // Bots: pretend success so they don't retry.
  if (String(form.get("website") ?? "") !== "") return { ok: true };
  const started = Number(form.get("started") ?? 0);
  if (!started || Date.now() - started < 3000) return { error: "Please take a moment to fill in the form, then send it again.", values };

  const now = Date.now();
  const times = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (times.length >= LIMIT) return { error: "You've sent several messages already. Please WhatsApp or call us instead.", values };

  if (!(await turnstileOk(String(form.get("cf-turnstile-response") ?? ""), ip))) {
    return { error: "Please complete the security check and try again.", values };
  }

  const parsed = schema.safeParse({
    name: form.get("name"),
    email: form.get("email"),
    phone: form.get("phone") ?? "",
    sgxNumber: form.get("sgxNumber") ?? "",
    topic: form.get("topic"),
    message: form.get("message"),
  });
  if (!parsed.success) {
    const fieldErrors: ContactState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof NonNullable<ContactState["fieldErrors"]>;
      fieldErrors[key] ??= issue.message;
    }
    return { error: "Please check the highlighted fields.", fieldErrors, values };
  }

  times.push(now);
  recent.set(ip, times);
  const saved = await saveMessage(parsed.data);
  await emailMessage(saved);
  return { ok: true };
}
