"use client";

import Link from "next/link";
import Script from "next/script";
import { useActionState, useEffect, useRef } from "react";
import { applyForJob, type ApplyState } from "@/app/(site)/careers/actions";
import { track } from "./Analytics";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const PARISHES = [
  "Kingston", "St. Andrew", "St. Thomas", "Portland", "St. Mary", "St. Ann", "Trelawny",
  "St. James", "Hanover", "Westmoreland", "St. Elizabeth", "Manchester", "Clarendon", "St. Catherine",
];

const inputCls =
  "w-full rounded-xl border-2 border-line bg-white px-4 text-base text-navy placeholder:text-[#8a94a8] focus:border-navy focus:outline-none aria-[invalid=true]:border-red-600";

export function ApplicationForm({ jobId, jobTitle }: { jobId: string; jobTitle: string }) {
  const [state, action, pending] = useActionState<ApplyState | undefined, FormData>(applyForJob, undefined);
  const startedRef = useRef<HTMLInputElement>(null);
  const firstSeen = useRef(0);
  useEffect(() => {
    if (!firstSeen.current) firstSeen.current = Date.now();
    if (startedRef.current) startedRef.current.value = String(firstSeen.current);
  });
  useEffect(() => {
    if (state?.ok) track("job_application", { job: jobTitle });
  }, [state?.ok, jobTitle]);

  if (state?.ok) {
    return (
      <div role="status" className="rounded-2xl bg-mist p-6">
        <h3 className="text-xl font-bold">Application received. Thank you!</h3>
        <p className="mt-2 text-muted">We&apos;ve received your application for <strong className="text-navy">{jobTitle}</strong>. If you&apos;re shortlisted, we&apos;ll contact you by phone or email.</p>
        <Link href="/careers" className="mt-4 inline-flex min-h-11 items-center font-semibold">← Back to all openings</Link>
      </div>
    );
  }

  const err = state?.fieldErrors ?? {};
  const v = state?.values ?? {};
  const aria = (name: keyof typeof err) => ({ "aria-invalid": Boolean(err[name]), "aria-describedby": err[name] ? `af-${name}-error` : undefined });
  const field = (name: keyof typeof err, label: string, input: React.ReactNode, hint?: string) => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`af-${name}`} className="text-sm font-semibold">{label}</label>
      {input}
      {err[name] ? <p id={`af-${name}-error`} className="text-sm font-medium text-red-700">{err[name]}</p> : hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="jobId" value={jobId} />
      <div className="grid gap-5 sm:grid-cols-2">
        {field("name", "Full name", <input id="af-name" name="name" required autoComplete="name" defaultValue={v.name} className={`${inputCls} h-12`} {...aria("name")} />)}
        {field("email", "Email", <input id="af-email" name="email" type="email" required autoComplete="email" defaultValue={v.email} className={`${inputCls} h-12`} {...aria("email")} />)}
        {field("phone", "Phone", <input id="af-phone" name="phone" type="tel" required autoComplete="tel" placeholder="(876) 000-0000" defaultValue={v.phone} className={`${inputCls} h-12`} {...aria("phone")} />)}
        {field(
          "parish",
          "Parish (optional)",
          <select id="af-parish" name="parish" defaultValue={v.parish ?? ""} className={`${inputCls} h-12`} {...aria("parish")}>
            <option value="">Choose…</option>
            {PARISHES.map((p) => <option key={p}>{p}</option>)}
          </select>,
        )}
      </div>
      {field(
        "cv",
        "CV / résumé",
        <input
          id="af-cv"
          name="cv"
          type="file"
          required
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="w-full rounded-xl border-2 border-dashed border-line bg-white px-4 py-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-navy file:px-4 file:py-2 file:font-semibold file:text-white aria-[invalid=true]:border-red-600"
          {...aria("cv")}
        />,
        state?.error ? "Please attach your CV again." : "PDF or Word document, up to 5 MB.",
      )}
      {field(
        "message",
        "Cover note (optional)",
        <textarea id="af-message" name="message" rows={5} defaultValue={v.message} placeholder="Tell us briefly why you're a good fit." className={`${inputCls} py-3`} {...aria("message")} />,
      )}
      <div className="flex flex-col gap-1.5">
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="consent" className="mt-0.5 h-5 w-5 flex-none" {...aria("consent")} />
          <span>
            I agree that SG Xpress may keep my application and CV to consider me for this and future roles, as described in the{" "}
            <Link href="/privacy" className="font-semibold underline">privacy notice</Link>.
          </span>
        </label>
        {err.consent ? <p id="af-consent-error" className="text-sm font-medium text-red-700">{err.consent}</p> : null}
      </div>

      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="af-website">Website</label>
        <input id="af-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <input ref={startedRef} type="hidden" name="started" defaultValue="" />

      {TURNSTILE_SITE_KEY ? (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
          <div className="cf-turnstile" data-sitekey={TURNSTILE_SITE_KEY} />
        </>
      ) : null}

      {state?.error ? <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{state.error}</p> : null}

      <button type="submit" disabled={pending} className="inline-flex min-h-14 items-center justify-center self-start rounded-xl bg-gold px-8 text-lg font-semibold text-navy transition hover:brightness-95 disabled:opacity-60 max-sm:w-full">
        {pending ? "Sending…" : "Submit application"}
      </button>
    </form>
  );
}
