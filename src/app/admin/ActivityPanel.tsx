"use client";

import { useState } from "react";
import type { ActivityEntry } from "@/lib/activity";
import { Pager, usePager } from "./_editor/ListTools";

export function ActivityPanel({ entries }: { entries: ActivityEntry[] }) {
  const people = [...new Set(entries.map((e) => e.userName))];
  const [who, setWho] = useState("Everyone");
  const [onlySaves, setOnlySaves] = useState(false);
  const shown = entries.filter((e) => (who === "Everyone" || e.userName === who) && (!onlySaves || e.action === "Saved changes"));
  const pager = usePager(shown, 25);

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-white p-4">
        <label className="flex items-center gap-2 text-sm font-semibold">
          Person
          <select className="h-10 rounded-lg border-2 border-line bg-white px-2" value={who} onChange={(e) => { setWho(e.target.value); pager.setPage(1); }}>
            <option>Everyone</option>
            {people.map((p) => <option key={p}>{p}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" className="h-5 w-5" checked={onlySaves} onChange={(e) => { setOnlySaves(e.target.checked); pager.setPage(1); }} />
          Only show saved changes
        </label>
        <span className="text-sm text-muted">{shown.length} entries</span>
      </section>

      {shown.length === 0 ? <p className="rounded-2xl border border-line bg-white p-5 text-sm text-muted">Nothing to show yet.</p> : null}

      <Pager page={pager.page} pages={pager.pages} onChange={pager.setPage} total={shown.length} perPage={25} label="entries" />
      <ol className="flex flex-col gap-2">
        {pager.items.map((e, i) => (
          <li key={`${e.at}-${i}`} className="rounded-2xl border border-line bg-white p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p>
                <strong>{e.userName}</strong> <span className="text-muted">{e.action.toLowerCase()}</span>
              </p>
              <time className="text-sm text-muted" dateTime={e.at}>{new Date(e.at).toLocaleString()}</time>
            </div>
            {e.details.length ? (
              <ul className="mt-2 space-y-1 rounded-xl bg-mist p-3 text-sm">
                {e.details.map((d, j) => <li key={j} className="break-words">{d}</li>)}
              </ul>
            ) : null}
          </li>
        ))}
      </ol>
      <Pager page={pager.page} pages={pager.pages} onChange={pager.setPage} total={shown.length} perPage={25} label="entries" />
    </div>
  );
}
