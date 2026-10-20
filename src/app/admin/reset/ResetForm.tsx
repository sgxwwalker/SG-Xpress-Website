"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPassword } from "../actions";

const field = "h-12 rounded-xl border-2 border-line px-3 focus:border-navy focus:outline-none";

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPassword, undefined);
  if (state?.expired) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5">
        <p role="alert" className="text-sm">This reset link has expired or has already been used. Links work once and only for a short time.</p>
        <Link href="/admin/forgot" className="flex h-12 items-center justify-center rounded-xl bg-navy font-semibold text-white">Send a new link</Link>
      </div>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5">
      <input type="hidden" name="token" value={token} />
      <label htmlFor="password" className="text-sm font-semibold">New password</label>
      <input id="password" name="password" type="password" autoComplete="new-password" minLength={10} required className={field} />
      <label htmlFor="confirm" className="text-sm font-semibold">Type it again</label>
      <input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={10} required className={field} />
      {state?.error ? <p role="alert" className="text-sm font-medium text-red-700">{state.error}</p> : null}
      <button type="submit" disabled={pending} className="h-12 rounded-xl bg-navy font-semibold text-white disabled:opacity-60">
        {pending ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}
