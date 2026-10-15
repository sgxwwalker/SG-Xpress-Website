"use client";

import { useState, useTransition } from "react";
import type { StaffSummary } from "@/lib/staff";
import { addStaff, manageStaff } from "./actions";

const input = "h-11 w-full rounded-lg border-2 border-line bg-white px-3 focus:border-navy focus:outline-none";
const card = "rounded-2xl border border-line bg-white p-4 md:p-5";

function when(iso?: string) {
  return iso ? new Date(iso).toLocaleString() : "Never";
}

export function StaffPanel({ initial, superadminUsername }: { initial: StaffSummary[]; superadminUsername: string }) {
  const [staff, setStaff] = useState(initial);
  const [form, setForm] = useState({ name: "", username: "", password: "" });
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();

  function run(fn: () => Promise<void>) {
    setMsg(null);
    start(fn);
  }

  return (
    <div className="flex flex-col gap-4">
      <section className={`${card} flex flex-col gap-1`}>
        <h2 className="text-xl font-bold">Superadmin</h2>
        <p className="text-sm text-muted">
          Username <strong className="text-navy">{superadminUsername}</strong>. This account is set on the server and can&apos;t be changed or removed here. It is
          the only account that can manage staff and see the activity log.
        </p>
      </section>

      <section className={`${card} flex flex-col gap-4`}>
        <h2 className="text-xl font-bold">Add a staff member</h2>
        <form
          className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              const res = await addStaff(form);
              if (res.ok && res.staff) {
                setStaff((s) => [...s, res.staff!]);
                setForm({ name: "", username: "", password: "" });
                setMsg({ kind: "ok", text: `Added ${res.staff.name}. Give them their username and password privately.` });
              } else if (!res.ok) setMsg({ kind: "error", text: res.error });
            });
          }}
        >
          <label className="flex flex-col gap-1 text-sm font-semibold">
            Full name
            <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            Username
            <input className={input} value={form.username} autoCapitalize="none" spellCheck={false} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            Starting password
            <input className={input} type="text" autoComplete="off" minLength={10} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </label>
          <button type="submit" disabled={pending} className="h-11 rounded-xl bg-navy px-5 font-semibold text-white disabled:opacity-60">
            Add staff
          </button>
        </form>
        <p className="text-xs text-muted">At least 10 characters. Staff can change it themselves under My account.</p>
        {msg ? <p role="status" className={`text-sm font-medium ${msg.kind === "error" ? "text-red-700" : "text-green-800"}`}>{msg.text}</p> : null}
      </section>

      <section className={`${card} flex flex-col gap-3`}>
        <h2 className="text-xl font-bold">Staff accounts ({staff.length})</h2>
        {staff.length === 0 ? <p className="text-sm text-muted">No staff accounts yet.</p> : null}
        {staff.map((s) => (
          <div key={s.id} className="flex flex-wrap items-center gap-3 border-t border-line pt-3">
            <div className="min-w-48 flex-1">
              <p className="font-semibold">
                {s.name} <span className="font-normal text-muted">· {s.username}</span>
                {!s.active ? <span className="ml-2 rounded-full bg-mist px-2 py-0.5 text-xs font-semibold text-muted">Switched off</span> : null}
              </p>
              <p className="text-xs text-muted">Last login: {when(s.lastLoginAt)} · Added {when(s.createdAt)} by {s.createdBy}</p>
            </div>
            <button
              type="button"
              disabled={pending}
              className="h-9 rounded-lg border border-line px-3 text-sm font-semibold"
              onClick={() => {
                const pw = prompt(`New password for ${s.name} (at least 10 characters):`);
                if (!pw) return;
                run(async () => {
                  const res = await manageStaff(s.id, { password: pw });
                  setMsg(res.ok ? { kind: "ok", text: `Password reset for ${s.name}.` } : { kind: "error", text: res.error });
                });
              }}
            >
              Reset password
            </button>
            <button
              type="button"
              disabled={pending}
              className="h-9 rounded-lg border border-line px-3 text-sm font-semibold"
              onClick={() =>
                run(async () => {
                  const res = await manageStaff(s.id, { active: !s.active });
                  if (res.ok && res.staff) setStaff((list) => list.map((x) => (x.id === s.id ? res.staff! : x)));
                  else if (!res.ok) setMsg({ kind: "error", text: res.error });
                })
              }
            >
              {s.active ? "Switch off" : "Switch on"}
            </button>
            <button
              type="button"
              disabled={pending}
              className="h-9 px-2 text-sm font-semibold text-red-700"
              onClick={() => {
                if (!confirm(`Remove ${s.name}'s account? Their past activity stays in the log.`)) return;
                run(async () => {
                  const res = await manageStaff(s.id, { remove: true });
                  if (res.ok) setStaff((list) => list.filter((x) => x.id !== s.id));
                  else setMsg({ kind: "error", text: res.error });
                });
              }}
            >
              Remove
            </button>
          </div>
        ))}
        <p className="text-xs text-muted">Switching an account off or removing it logs that person out straight away.</p>
      </section>
    </div>
  );
}
