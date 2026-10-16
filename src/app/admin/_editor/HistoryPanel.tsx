"use client";

import { useState, useTransition } from "react";
import { restoreVersion } from "../actions";

// /admin → Version history: every save keeps the version it replaced (the last 20).
// Restoring one puts the whole website content back as it was, and is itself undoable.

export type VersionInfo = { file: string; replacedAt: string; savedBy: string | null; savedAt: string | null; replacedBy: string | null };

const when = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

export function HistoryPanel({ versions, dirty, readOnly }: { versions: VersionInfo[]; dirty: boolean; readOnly: boolean }) {
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();

  function restore(v: VersionInfo) {
    if (dirty && !confirm("You have unsaved changes. Restoring will discard them. Continue?")) return;
    if (!confirm(`Put the website back to the version from ${when(v.savedAt ?? v.replacedAt)}? Today's version is kept in the history, so you can undo this.`)) return;
    start(async () => {
      const res = await restoreVersion(v.file);
      if (res.ok) {
        setMessage({ kind: "ok", text: "Restored. Reloading…" });
        window.location.reload();
      } else setMessage({ kind: "error", text: res.error });
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        Each time someone saves, the version before it is kept here (the last 20). Restoring brings back everything as it was then: pages, rates, FAQs and settings.
        Messages, applications and staff accounts are not affected.
      </p>
      {message ? <p role="status" className={`rounded-lg px-3 py-2 text-sm ${message.kind === "ok" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>{message.text}</p> : null}
      {versions.length ? (
        <ul className="flex flex-col gap-2">
          {versions.map((v, i) => (
            <li key={v.file} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-3 md:p-4">
              <div className="text-sm">
                <p className="font-semibold">{v.savedAt ? `Saved ${when(v.savedAt)}` : "The website's starting version"}{v.savedBy ? ` by ${v.savedBy}` : ""}</p>
                <p className="text-muted">Replaced {when(v.replacedAt)}{v.replacedBy ? ` by ${v.replacedBy}'s save` : ""}{i === 0 ? " (the version just before the current one)" : ""}</p>
              </div>
              <button
                type="button"
                disabled={pending || readOnly}
                onClick={() => restore(v)}
                className="inline-flex min-h-11 items-center rounded-xl border-2 border-navy px-4 text-sm font-semibold disabled:opacity-50"
              >
                Restore this version
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-line bg-white p-4 text-sm text-muted">No earlier versions yet. They appear here after the first save.</p>
      )}
    </div>
  );
}
