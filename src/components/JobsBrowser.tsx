"use client";

import Link from "next/link";
import { useState } from "react";
import type { Job } from "@/lib/content/schema";
import { IconArrow, IconClock, IconPin } from "./Icons";

export function JobsBrowser({ jobs }: { jobs: Job[] }) {
  const [dept, setDept] = useState("All");
  const [loc, setLoc] = useState("All");
  const [q, setQ] = useState("");

  const departments = ["All", ...new Set(jobs.map((j) => j.department))];
  const locations = ["All", ...new Set(jobs.map((j) => j.location))];
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const shown = jobs.filter(
    (j) =>
      (dept === "All" || j.department === dept) &&
      (loc === "All" || j.location === loc) &&
      terms.every((t) => `${j.title} ${j.summary} ${j.department} ${j.location}`.toLowerCase().includes(t)),
  );

  const select = "h-12 w-full rounded-xl border-2 border-line bg-white px-3 text-navy focus:border-navy focus:outline-none";

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 rounded-2xl border border-line bg-white p-4 md:grid-cols-[1fr_1fr_1.5fr]">
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Department
          <select className={select} value={dept} onChange={(e) => setDept(e.target.value)}>
            {departments.map((d) => <option key={d}>{d}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Location
          <select className={select} value={loc} onChange={(e) => setLoc(e.target.value)}>
            {locations.map((l) => <option key={l}>{l}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Search
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Job title or keyword" className={`${select} px-4`} />
        </label>
      </div>

      <p className="sr-only" aria-live="polite">{`${shown.length} opening${shown.length === 1 ? "" : "s"} found`}</p>

      {shown.length === 0 ? (
        <div className="rounded-2xl bg-white p-6 text-center">
          <p className="font-semibold">No openings match your search.</p>
          <button type="button" onClick={() => { setDept("All"); setLoc("All"); setQ(""); }} className="mt-3 min-h-11 rounded-xl border-2 border-navy px-4 font-semibold">
            Show all openings
          </button>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {shown.map((j) => (
            <li key={j.id}>
              <Link href={`/careers/${j.id}`} className="group flex h-full flex-col gap-3 rounded-2xl border border-line bg-white p-5 transition hover:border-navy hover:shadow-lg">
                <span className="self-start rounded-full bg-gold-soft px-3 py-1 text-xs font-semibold text-gold-text">{j.department}</span>
                <h3 className="text-xl font-bold leading-snug">{j.title}</h3>
                <p className="text-sm text-muted">{j.summary}</p>
                <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                  <span className="flex items-center gap-1.5"><IconPin className="h-4 w-4" />{j.location}</span>
                  <span className="flex items-center gap-1.5"><IconClock className="h-4 w-4" />{j.type}</span>
                </div>
                <span className="flex items-center gap-1 font-semibold">
                  View &amp; apply <IconArrow className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
