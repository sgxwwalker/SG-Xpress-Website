"use client";

import { useState, useTransition } from "react";
import type { AdminUser } from "@/lib/staff";
import { changeMyPassword } from "./actions";

const input = "h-11 w-full rounded-lg border-2 border-line bg-white px-3 focus:border-navy focus:outline-none";

export function AccountPanel({ user }: { user: AdminUser }) {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-4 md:p-5">
      <div>
        <h2 className="text-xl font-bold">My account</h2>
        <p className="text-sm text-muted">
          {user.name} · username <strong className="text-navy">{user.username}</strong> · {user.role === "superadmin" ? "Superadmin" : "Staff"}
        </p>
      </div>

      {user.role === "superadmin" ? (
        <p className="text-sm">
          The superadmin password is set on the server, not here. To change it, run <code className="rounded bg-mist px-1">npm run hash-password -- &quot;new password&quot;</code> and
          update <code className="rounded bg-mist px-1">ADMIN_PASSWORD_HASH_B64</code> in the server settings.
        </p>
      ) : (
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
      )}
    </section>
  );
}
