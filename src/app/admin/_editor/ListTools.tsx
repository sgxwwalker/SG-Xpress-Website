"use client";

import { useState } from "react";

// Shared helpers for long lists in the admin: page-by-page browsing and cards that
// fold away, so the Save bar is never far and nobody scrolls through 40 FAQs.

/** Splits a list into pages. `goLast()` jumps to the end, e.g. after adding an item. */
export function usePager<T>(items: T[], perPage: number) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(items.length / perPage));
  const current = Math.min(page, pages);
  const start = (current - 1) * perPage;
  return {
    page: current,
    pages,
    start,
    items: items.slice(start, start + perPage),
    setPage: (p: number) => setPage(Math.max(1, Math.min(p, pages))),
    goLast: () => setPage(Math.max(1, Math.ceil((items.length + 1) / perPage))),
  };
}

/** "Showing 11–20 of 39 · ‹ Previous 1 2 3 4 Next ›" */
export function Pager({ page, pages, onChange, total, perPage, label = "items" }: { page: number; pages: number; onChange: (p: number) => void; total: number; perPage: number; label?: string }) {
  if (total <= perPage) return null;
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  const go = (p: number) => {
    onChange(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const btn = "flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm font-semibold disabled:opacity-40";
  return (
    <nav aria-label="Pages" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-3 py-2">
      <span className="text-sm text-muted">Showing {from}–{to} of {total} {label}</span>
      <span className="flex flex-wrap gap-1">
        <button type="button" className={`${btn} border-line`} disabled={page === 1} onClick={() => go(page - 1)}>‹ Previous</button>
        {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
          <button key={p} type="button" aria-current={p === page ? "page" : undefined} className={`${btn} ${p === page ? "border-navy bg-navy text-white" : "border-line"}`} onClick={() => go(p)}>
            {p}
          </button>
        ))}
        <button type="button" className={`${btn} border-line`} disabled={page === pages} onClick={() => go(page + 1)}>Next ›</button>
      </span>
    </nav>
  );
}

/** A card with a title row that opens and closes. */
export function Fold({
  title,
  subtitle,
  badge,
  open,
  onToggle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-white">
      <div className="flex flex-wrap items-center gap-2 p-3 md:px-4">
        <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <span aria-hidden="true" className="w-4 flex-none text-muted">{open ? "▾" : "▸"}</span>
          <span className="min-w-0">
            <span className="block truncate font-bold">{title}</span>
            {subtitle ? <span className="block truncate text-sm text-muted">{subtitle}</span> : null}
          </span>
        </button>
        {badge}
        {actions}
        <button type="button" onClick={onToggle} className="h-9 rounded-lg border border-line px-3 text-sm font-semibold">{open ? "Close" : "Edit"}</button>
      </div>
      {open ? <div className="flex flex-col gap-4 border-t border-line p-3 md:p-4">{children}</div> : null}
    </section>
  );
}

/** Which cards are open (by key). */
export function useOpen() {
  const [open, setOpen] = useState<Set<string>>(new Set());
  return {
    isOpen: (k: string) => open.has(k),
    toggle: (k: string) => setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    }),
    openOnly: (k: string) => setOpen(new Set([k])),
  };
}
