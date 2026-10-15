"use client";

import { useState } from "react";
import { APPLICATION_STATUSES, type Application, type ApplicationStatus } from "@/lib/applications-shared";
import { deleteApplication, updateApplicationStatus } from "./actions";

const card = "rounded-2xl border border-line bg-white p-4 md:p-5";
const STATUS_STYLE: Record<ApplicationStatus, string> = {
  New: "bg-gold text-navy",
  Reviewed: "bg-mist text-navy",
  Shortlisted: "bg-navy text-white",
  "Not suitable": "bg-mist text-muted",
  Hired: "bg-whatsapp text-white",
};

function kb(bytes: number) {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export function ApplicationsPanel({ initial }: { initial: Application[] }) {
  const [apps, setApps] = useState(initial);
  const [job, setJob] = useState("All");
  const [status, setStatus] = useState("All");
  const jobs = ["All", ...new Set(apps.map((a) => a.jobTitle))];
  const shown = apps.filter((a) => (job === "All" || a.jobTitle === job) && (status === "All" || a.status === status));
  const select = "h-10 rounded-lg border-2 border-line bg-white px-2";

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-white p-4">
        <label className="flex items-center gap-2 text-sm font-semibold">
          Position
          <select className={select} value={job} onChange={(e) => setJob(e.target.value)}>
            {jobs.map((j) => <option key={j}>{j}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          Status
          <select className={select} value={status} onChange={(e) => setStatus(e.target.value)}>
            {["All", ...APPLICATION_STATUSES].map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <span className="text-sm text-muted">{shown.length} of {apps.length} applications</span>
      </section>

      {shown.length === 0 ? (
        <section className={card}>
          <h2 className="text-xl font-bold">{apps.length ? "No applications match" : "No applications yet"}</h2>
          <p className="text-sm text-muted">Applications from the Careers page appear here, newest first.</p>
        </section>
      ) : null}

      {shown.map((a) => (
        <article key={a.id} className={`${card} flex flex-col gap-3`}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold">{a.name}</h2>
              <p className="text-sm text-muted">{a.jobTitle} · received {new Date(a.receivedAt).toLocaleString()}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLE[a.status]}`}>{a.status}</span>
          </div>
          <p className="text-sm">
            <a className="font-semibold underline" href={`mailto:${a.email}`}>{a.email}</a> · <a className="underline" href={`tel:${a.phone.replace(/[^\d+]/g, "")}`}>{a.phone}</a>
            {a.parish ? <> · {a.parish}</> : null}
          </p>
          {a.message ? <p className="whitespace-pre-wrap rounded-xl bg-mist p-3 text-sm">{a.message}</p> : null}
          <div className="flex flex-wrap items-center gap-2">
            <a href={`/admin/applications/${a.id}/cv`} className="flex h-10 items-center rounded-lg bg-navy px-4 text-sm font-semibold text-white">
              Download CV <span className="ml-1.5 font-normal text-on-navy">({a.cv.fileName.split(".").pop()?.toUpperCase()}, {kb(a.cv.size)})</span>
            </a>
            <label className="flex items-center gap-2 text-sm font-semibold">
              Status
              <select
                className={select}
                value={a.status}
                onChange={async (e) => {
                  const next = e.target.value as ApplicationStatus;
                  const res = await updateApplicationStatus(a.id, next);
                  if (res.ok) setApps((list) => list.map((x) => (x.id === a.id ? { ...x, status: next } : x)));
                }}
              >
                {APPLICATION_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <a href={`mailto:${a.email}?subject=${encodeURIComponent(`Your application: ${a.jobTitle}`)}`} className="flex h-10 items-center rounded-lg border border-line px-3 text-sm font-semibold">
              Reply by email
            </a>
            <button
              type="button"
              className="h-10 px-2 text-sm font-semibold text-red-700"
              onClick={async () => {
                if (!confirm(`Delete ${a.name}'s application and CV? This can't be undone.`)) return;
                const res = await deleteApplication(a.id);
                if (res.ok) setApps((list) => list.filter((x) => x.id !== a.id));
              }}
            >
              Delete
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
