"use client";

import { useActionState, useEffect, useRef } from "react";
import { sendContactMessage, type ContactState } from "@/app/(site)/contact/actions";
import { CONTACT_TOPICS } from "@/lib/contact";
import { track } from "./Analytics";
import { Turnstile } from "./Turnstile";


const inputCls =
  "w-full rounded-xl border-2 border-line bg-white px-4 text-base text-navy placeholder:text-[#8a94a8] focus:border-navy focus:outline-none aria-[invalid=true]:border-red-600";

export function ContactForm() {
  const [state, action, pending] = useActionState<ContactState | undefined, FormData>(sendContactMessage, undefined);
  // When the form appeared (set after load, so the page itself can stay static).
  // Kept across error re-renders, because React clears form fields after each submit.
  const startedRef = useRef<HTMLInputElement>(null);
  const firstSeen = useRef(0);
  useEffect(() => {
    if (!firstSeen.current) firstSeen.current = Date.now();
    if (startedRef.current) startedRef.current.value = String(firstSeen.current);
  });
  useEffect(() => {
    if (state?.ok) track("contact_submit", { page: "/contact" });
  }, [state?.ok]);

  if (state?.ok) {
    return (
      <div role="status" className="rounded-2xl bg-mist p-6">
        <h3 className="text-xl font-bold">Message sent. Thank you!</h3>
        <p className="mt-2 text-muted">We&apos;ll get back to you as soon as we can, usually within one business day. For anything urgent, WhatsApp or call us.</p>
      </div>
    );
  }

  const err = state?.fieldErrors ?? {};
  const v = state?.values ?? {};
  const field = (name: keyof typeof err, label: string, input: React.ReactNode, hint?: string) => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`cf-${name}`} className="text-sm font-semibold">{label}</label>
      {input}
      {err[name] ? <p id={`cf-${name}-error`} className="text-sm font-medium text-red-700">{err[name]}</p> : hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
  const aria = (name: keyof typeof err) => ({
    "aria-invalid": Boolean(err[name]),
    "aria-describedby": err[name] ? `cf-${name}-error` : undefined,
  });

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        {field("name", "Name", <input id="cf-name" name="name" defaultValue={v.name} required autoComplete="name" placeholder="Your full name" className={`${inputCls} h-12`} {...aria("name")} />)}
        {field("email", "Email", <input id="cf-email" name="email" defaultValue={v.email} type="email" required autoComplete="email" placeholder="you@example.com" className={`${inputCls} h-12`} {...aria("email")} />)}
        {field("phone", "Phone (optional)", <input id="cf-phone" name="phone" defaultValue={v.phone} type="tel" autoComplete="tel" placeholder="(876) 000-0000" className={`${inputCls} h-12`} {...aria("phone")} />)}
        {field("sgxNumber", "SGX number (optional)", <input id="cf-sgxNumber" name="sgxNumber" defaultValue={v.sgxNumber} placeholder="e.g. SGX2222" className={`${inputCls} h-12`} {...aria("sgxNumber")} />)}
      </div>
      {field(
        "topic",
        "What's it about?",
        <select id="cf-topic" name="topic" defaultValue={v.topic || CONTACT_TOPICS[0]} className={`${inputCls} h-12`} {...aria("topic")}>
          {CONTACT_TOPICS.map((t) => <option key={t}>{t}</option>)}
        </select>,
      )}
      {field(
        "message",
        "Message",
        <textarea id="cf-message" name="message" defaultValue={v.message} required rows={5} placeholder="Tell us how we can help. Include a tracking number if it's about a package." className={`${inputCls} py-3`} {...aria("message")} />,
      )}

      {/* Spam traps: bots fill hidden fields; humans take a few seconds. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="cf-website">Website</label>
        <input id="cf-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <input ref={startedRef} type="hidden" name="started" defaultValue="" />

      <Turnstile resetKey={state} />

      {state?.error ? <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{state.error}</p> : null}

      <button type="submit" disabled={pending} className="inline-flex min-h-14 items-center justify-center gap-2 self-start rounded-xl bg-navy px-8 text-lg font-semibold text-white transition hover:bg-navy-soft disabled:opacity-60 max-sm:w-full">
        {pending ? "Sending…" : "Send message"}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />
        </svg>
      </button>
    </form>
  );
}
