"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { checkCv, emailApplication, saveApplication } from "@/lib/applications";
import { getContent } from "@/lib/content/store";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(100),
  email: z.string().trim().email("Please enter a valid email address.").max(200),
  phone: z.string().trim().min(7, "Please enter a phone number we can reach you on.").max(40),
  parish: z.string().trim().max(60),
  message: z.string().trim().max(3000, "Please keep your note under 3,000 characters."),
  consent: z.literal("on", { message: "Please confirm we may keep your details for recruitment." }),
});

type Field = keyof z.infer<typeof schema> | "cv";
export type ApplyState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Partial<Record<Field, string>>;
  values?: Partial<Record<Exclude<Field, "cv" | "consent">, string>>;
};

// Same light spam control as the contact form.
const recent = new Map<string, number[]>();
const LIMIT = 3;
const WINDOW_MS = 30 * 60 * 1000;

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

export async function applyForJob(_prev: ApplyState | undefined, form: FormData): Promise<ApplyState> {
  const values = Object.fromEntries((["name", "email", "phone", "parish", "message"] as const).map((k) => [k, String(form.get(k) ?? "")])) as ApplyState["values"];
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "unknown";

  if (String(form.get("website") ?? "") !== "") return { ok: true }; // bot trap
  const started = Number(form.get("started") ?? 0);
  if (!started || Date.now() - started < 5000) return { error: "Please take a moment to fill in the form, then send it again.", values };

  const now = Date.now();
  const times = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (times.length >= LIMIT) return { error: "You've sent several applications already. Please try again later.", values };
  if (!(await turnstileOk(String(form.get("cf-turnstile-response") ?? ""), ip))) {
    return { error: "Please complete the security check and try again.", values };
  }

  // Which job? "" means a general application.
  const jobId = String(form.get("jobId") ?? "");
  let jobTitle = "General application";
  if (jobId) {
    const job = (await getContent()).jobs.find((j) => j.id === jobId);
    if (!job || !job.open) return { error: "Sorry, this position is no longer open. You can still send a general application.", values };
    jobTitle = job.title;
  }

  const parsed = schema.safeParse({
    name: form.get("name"),
    email: form.get("email"),
    phone: form.get("phone"),
    parish: form.get("parish") ?? "",
    message: form.get("message") ?? "",
    consent: form.get("consent") ?? undefined,
  });
  const fieldErrors: ApplyState["fieldErrors"] = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) fieldErrors[issue.path[0] as Field] ??= issue.message;
  }

  const file = form.get("cv");
  let cvBytes: Uint8Array | null = null;
  if (!(file instanceof File) || file.size === 0) {
    fieldErrors.cv = "Please attach your CV.";
  } else {
    cvBytes = new Uint8Array(await file.arrayBuffer());
    const problem = checkCv(file.name, cvBytes);
    if (problem) fieldErrors.cv = problem;
  }

  if (!parsed.success || fieldErrors.cv) return { error: "Please check the highlighted fields.", fieldErrors, values };

  times.push(now);
  recent.set(ip, times);
  const { consent: _consent, ...details } = parsed.data; // eslint-disable-line @typescript-eslint/no-unused-vars
  const saved = await saveApplication({ ...details, jobId, jobTitle }, { fileName: (file as File).name, bytes: cvBytes! });
  await emailApplication(saved, cvBytes!);
  return { ok: true };
}
