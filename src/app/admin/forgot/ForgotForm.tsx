"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "../actions";

export function ForgotForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);
  if (state?.kind === "sent") {
    return <p role="status" className="rounded-2xl border border-line bg-white p-5 text-sm">{state.text}</p>;
  }
  return (
    <form action={action} className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5">
      <label htmlFor="login" className="text-sm font-semibold">Username or email</label>
      <input
        id="login"
        name="login"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        required
        maxLength={200}
        className="h-12 rounded-xl border-2 border-line px-3 focus:border-navy focus:outline-none"
      />
      {state?.kind === "error" ? <p role="alert" className="text-sm font-medium text-red-700">{state.text}</p> : null}
      <button type="submit" disabled={pending} className="h-12 rounded-xl bg-navy font-semibold text-white disabled:opacity-60">
        {pending ? "Sending…" : "Email me a reset link"}
      </button>
    </form>
  );
}
