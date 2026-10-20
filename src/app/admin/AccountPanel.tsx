"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { AdminUser } from "@/lib/staff";
import { changeMyPassword, setMyEmail } from "./actions";

const input = "h-11 w-full rounded-lg border-2 border-line bg-white px-3 focus:border-navy focus:outline-none";

export function AccountPanel({ user }: { user: AdminUser }) {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const [email, setEmailValue] = useState(user.email ?? "");
  const [savedEmail, setSavedEmail] = useState(user.email ?? "");
  const [emailMsg, setEmailMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-4 md:p-5">
      <div>
        <h2 className="text-xl font-bold">My account</h2>
        <p className="text-sm text-muted">
          {user.name} · username <strong className="text-navy">{user.username}</strong> · {user.role === "superadmin" ? "Superadmin" : "Staff"}
        </p>
      </div>

      <form
        className="grid max-w-md gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setEmailMsg(null);
          start(async () => {
            const res = await setMyEmail(email);
            if (res.ok) {
              setEmailValue(res.email);
              setSavedEmail(res.email);
              router.refresh(); // updates the "add your email" reminder
              setEmailMsg({ kind: "ok", text: res.email ? "Email saved. Password reset links will go here." : "Email removed." });
            } else setEmailMsg({ kind: "error", text: res.error });
          });
        }}
      >
        <h3 className="font-bold">Your email</h3>
        <p className="text-sm text-muted">If you forget your password, use &ldquo;Forgot password?&rdquo; on the login page and we&apos;ll email a reset link here.</p>
        {!savedEmail ? (
          <p className="rounded-lg bg-gold-soft px-3 py-2 text-sm text-navy">You haven&apos;t added an email yet, so you can&apos;t reset your password by yourself.</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <input
            className={`${input} min-w-0 flex-1`}
            type="email"
            autoComplete="email"
            maxLength={200}
            aria-label="Your email"
            placeholder="name@sgxpressja.com"
            value={email}
            onChange={(e) => setEmailValue(e.target.value)}
          />
          <button type="submit" disabled={pending || email.trim().toLowerCase() === savedEmail} className="h-11 rounded-xl bg-navy px-5 font-semibold text-white disabled:opacity-60">
            Save email
          </button>
        </div>
        {emailMsg ? <p role="status" className={`text-sm font-medium ${emailMsg.kind === "error" ? "text-red-700" : "text-green-800"}`}>{emailMsg.text}</p> : null}
      </form>

      <h3 className="border-t border-line pt-4 font-bold">Change your password</h3>
      {user.role === "superadmin" ? (
        <p className="max-w-md text-sm text-muted">
          If you&apos;re ever locked out completely, the website&apos;s developer can bring back the password from the server settings.
        </p>
      ) : null}
      <form
        className="grid max-w-md gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setMsg(null);
          if (form.next !== form.confirm) return setMsg({ kind: "error", text: "The new passwords don't match." });
          start(async () => {
            const res = await changeMyPassword(form.current, form.next);
            if (res.ok) {
              setForm({ current: "", next: "", confirm: "" });
              setMsg({ kind: "ok", text: "Password changed." });
            } else setMsg({ kind: "error", text: res.error });
          });
        }}
      >
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Current password
          <input className={input} type="password" autoComplete="current-password" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} required />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          New password (at least 10 characters)
          <input className={input} type="password" autoComplete="new-password" minLength={10} value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} required />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Type the new password again
          <input className={input} type="password" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
        </label>
        <button type="submit" disabled={pending} className="h-11 justify-self-start rounded-xl bg-navy px-5 font-semibold text-white disabled:opacity-60">
          {pending ? "Saving…" : "Change password"}
        </button>
        {msg ? <p role="status" className={`text-sm font-medium ${msg.kind === "error" ? "text-red-700" : "text-green-800"}`}>{msg.text}</p> : null}
      </form>
    </section>
  );
}
