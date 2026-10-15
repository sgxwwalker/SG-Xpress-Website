"use client";

import { useActionState } from "react";
import { login } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5">
      <label htmlFor="username" className="text-sm font-semibold">Username</label>
      <input
        id="username"
        name="username"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        required
        className="h-12 rounded-xl border-2 border-line px-3 focus:border-navy focus:outline-none"
      />
      <label htmlFor="password" className="text-sm font-semibold">Password</label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        className="h-12 rounded-xl border-2 border-line px-3 focus:border-navy focus:outline-none"
      />
      {state?.error ? <p role="alert" className="text-sm font-medium text-red-700">{state.error}</p> : null}
      <button type="submit" disabled={pending} className="h-12 rounded-xl bg-navy font-semibold text-white disabled:opacity-60">
        {pending ? "Checking…" : "Log in"}
      </button>
    </form>
  );
}
