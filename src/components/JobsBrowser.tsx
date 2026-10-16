"use client";

import Link from "next/link";
import { useState } from "react";
import type { Job } from "@/lib/content/schema";
import { IconArrow, IconClock, IconPin } from "./Icons";

export function JobsBrowser({ jobs }: { jobs: Job[] }) {
  const [dept, setDept] = useState("All");
  const [loc, setLoc] = useState("All");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const departments = ["All", ...new Set(jobs.map((j) => j.department))];
  const locations = ["All", ...new Set(jobs.map((j) => j.location))];
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const shown = jobs.filter(
    (j) =>
      (dept === "All" || j.department === dept) &&
      (loc === "All" || j.location === loc) &&
      terms.every((t) => `${j.title} ${j.summary} ${j.department} ${j.location}`.toLowerCase().includes(t)),
  );

  const PER_PAGE = 8;
  const pages = Math.max(1, Math.ceil(shown.length / PER_PAGE));
  const current = Math.min(page, pages);
  const visible = shown.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const filter = (fn: () => void) => { fn(); setPage(1); };

  const select = "h-12 w-full rounded-xl border-2 border-line bg-white px-3 text-navy focus:border-navy focus:outline-none";

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 rounded-2xl border border-line bg-white p-4 md:grid-cols-[1fr_1fr_1.5fr]">
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Department
          <select className={select} value={dept} onChange={(e) => filter(() => setDept(e.target.value))}>
            {departments.map((d) => <option key={d}>{d}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Location
          <select className={select} value={loc} onChange={(e) => filter(() => setLoc(e.target.value))}>
            {locations.map((l) => <option key={l}>{l}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Search
          <input type="search" value={q} onChange={(e) => filter(() => setQ(e.target.value))} placeholder="Job title or keyword" className={`${select} px-4`} />
        </label>
      </div>

      <p className="sr-only" aria-live="polite">{`${shown.length} opening${shown.length === 1 ? "" : "s"} found`}</p>

      {shown.length === 0 ? (
        <div className="rounded-2xl bg-white p-6 text-center">
          <p className="font-semibold">No openings match your search.</p>
          <button type="button" onClick={() => { setDept("All"); setLoc("All"); setQ(""); setPage(1); }} className="mt-3 min-h-11 rounded-xl border-2 border-navy px-4 font-semibold">
            Show all openings
          </button>
        </div>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {visible.map((j) => (
              <li key={j.id}>
                <Link href={`/careers/${j.id}`} className="group flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 transition hover:border-navy hover:shadow-lg md:flex-row md:items-center md:gap-8 md:p-6">
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <span className="self-start rounded-full bg-gold-soft px-3 py-1 text-xs font-semibold text-gold-text">{j.department}</span>
                    <h3 className="text-xl font-bold leading-snug">{j.title}</h3>
                    <p className="text-sm text-muted">{j.summary}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                      <span className="flex items-center gap-1.5"><IconPin className="h-4 w-4" />{j.location}</span>
                      <span className="flex items-center gap-1.5"><IconClock className="h-4 w-4" />{j.type}</span>
                      {j.closingDate ? <span>Apply by {new Date(`${j.closingDate}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span> : null}
                    </div>
                  </div>
                  <span className="inline-flex min-h-12 flex-none items-center justify-center gap-2 rounded-xl bg-navy px-5 font-semibold text-white transition group-hover:bg-navy-soft">
                    View &amp; apply <IconArrow className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {pages > 1 ? (
            <nav aria-label="Job pages" className="flex flex-wrap items-center justify-center gap-2">
              <button type="button" disabled={current === 1} onClick={() => setPage(current - 1)} className="min-h-11 rounded-xl border-2 border-line bg-white px-4 font-semibold disabled:opacity-40">‹ Previous</button>
              <span className="px-2 text-sm text-muted">Page {current} of {pages}</span>
              <button type="button" disabled={current === pages} onClick={() => setPage(current + 1)} className="min-h-11 rounded-xl border-2 border-line bg-white px-4 font-semibold disabled:opacity-40">Next ›</button>
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
