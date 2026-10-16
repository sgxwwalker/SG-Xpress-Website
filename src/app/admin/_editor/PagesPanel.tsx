"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { IconClose, IconExternal } from "@/components/Icons";
import type { ImageValue } from "@/lib/blocks/fields";
import { BLOCKS, BLOCK_TYPES, TONES, type BlockType } from "@/lib/blocks/registry";
import { newPage, newSection, slugify } from "@/lib/content/page-factory";
import { BUILTIN_PAGES, isBuiltin, pagePath, RESERVED_SLUGS, SLUG, type Page, type Section } from "@/lib/content/pages-schema";
import type { SiteContent } from "@/lib/content/schema";
import type { LibraryImage } from "@/lib/media";
import { Fields, inputCls, type EditorContext } from "./FieldEditors";
import { MediaPicker } from "./MediaLibrary";

// /admin → Pages: every page as a list of sections, with a live preview beside it.

const btn = "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-semibold";
const small = "inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-line bg-white px-2.5 text-sm font-semibold text-navy hover:bg-mist disabled:opacity-40";
const card = "rounded-2xl border border-line bg-white";

type Edit = (fn: (draft: SiteContent) => void) => void;

function summary(s: Section): string {
  const p = s.props as Record<string, unknown>;
  const text = [p.heading, p.title, p.formHeading, p.caption].find((v) => typeof v === "string" && v.trim()) as string | undefined;
  if (text) return text.length > 60 ? `${text.slice(0, 57)}…` : text;
  if (s.type === "text") return String(p.body ?? "").slice(0, 60);
  return "";
}

// ---------------- Live preview ----------------

function Preview({ content, pageId, onClose }: { content: SiteContent; pageId: string; onClose?: () => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [device, setDevice] = useState<"phone" | "computer">("phone");
  const [boxWidth, setBoxWidth] = useState(400);
  const [ready, setReady] = useState(0); // goes up each time the preview (re)loads and is listening

  const send = useCallback(() => {
    frame.current?.contentWindow?.postMessage({ type: "sgx-preview", content, pageId }, window.location.origin);
  }, [content, pageId]);

  // The preview says when it's ready to listen; then it gets the unsaved edits as staff type
  // (a short pause avoids flicker).
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin === window.location.origin && e.source === frame.current?.contentWindow && e.data?.type === "sgx-preview-ready") setReady((n) => n + 1);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(send, 150);
    return () => clearTimeout(t);
  }, [ready, send]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBoxWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const width = device === "phone" ? 390 : 1280;
  const scale = Math.min(1, boxWidth / width);
  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div role="group" aria-label="Preview size" className="flex rounded-lg bg-mist p-1">
          {(["phone", "computer"] as const).map((d) => (
            <button key={d} type="button" aria-pressed={device === d} onClick={() => setDevice(d)} className={`h-8 rounded-md px-3 text-sm font-semibold ${device === d ? "bg-navy text-white" : "text-navy"}`}>
              {d === "phone" ? "Phone" : "Computer"}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted">Unsaved preview</span>
        {onClose ? <button type="button" onClick={onClose} className={small}>Close</button> : null}
      </div>
      <div ref={box} className="relative flex-1 overflow-hidden rounded-xl border border-line bg-white">
        <iframe
          ref={frame}
          title="Page preview"
          src={`/admin/preview?page=${encodeURIComponent(pageId)}`}
          style={{ width, height: `${100 / scale}%`, transform: `scale(${scale})`, transformOrigin: "top left", left: Math.max(0, (boxWidth - width * scale) / 2) }}
          className="absolute top-0 border-0"
        />
      </div>
    </div>
  );
}

// ---------------- Add a section ----------------

function AddSection({ onAdd, onClose }: { onAdd: (type: BlockType) => void; onClose: () => void }) {
  const groups = ["Text & pictures", "Live information"] as const;
  return (
    <div role="dialog" aria-modal="true" aria-label="Add a section" className="fixed inset-0 z-[60] flex items-end justify-center bg-navy-deep/60 sm:items-center sm:p-6">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-mist sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-line bg-white px-4 py-3">
          <h2 className="text-lg font-bold">Add a section</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-mist"><IconClose className="h-5 w-5" /></button>
        </div>
        <div className="flex flex-col gap-5 overflow-y-auto p-4">
          {groups.map((g) => (
            <section key={g}>
              <h3 className="mb-1 font-semibold">{g}</h3>
              {g === "Live information" ? <p className="mb-2 text-xs text-muted">These show prices, schedules and contacts from the admin settings, so they stay up to date by themselves.</p> : null}
              <ul className="grid gap-2 sm:grid-cols-2">
                {BLOCK_TYPES.filter((t) => BLOCKS[t].group === g).map((t) => (
                  <li key={t}>
                    <button type="button" onClick={() => onAdd(t)} className="flex h-full w-full flex-col gap-1 rounded-xl border border-line bg-white p-3 text-left hover:border-navy">
                      <span className="font-semibold">{BLOCKS[t].name}</span>
                      <span className="text-xs text-muted">{BLOCKS[t].description}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------- New page ----------------

function NewPageDialog({ pages, onCreate, onClose }: { pages: Page[]; onCreate: (name: string, slug: string) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [touched, setTouched] = useState(false);
  const finalSlug = touched ? slug : slugify(name);
  const problem = !name.trim()
    ? "Give the page a name."
    : !SLUG.test(finalSlug)
      ? "Web address: use lowercase letters, numbers and dashes."
      : RESERVED_SLUGS.has(finalSlug) || pages.some((p) => p.slug === finalSlug)
        ? `“/${finalSlug}” is already used. Choose another web address.`
        : null;
  return (
    <div role="dialog" aria-modal="true" aria-label="New page" className="fixed inset-0 z-[60] flex items-end justify-center bg-navy-deep/60 sm:items-center sm:p-6">
      <div className="flex w-full max-w-lg flex-col gap-4 rounded-t-2xl bg-white p-5 sm:rounded-2xl">
        <h2 className="text-lg font-bold">New page</h2>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-semibold">Page name</span>
          <input autoFocus className={inputCls} maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Christmas shipping deadlines" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-semibold">Web address</span>
          <div className="flex items-center gap-1">
            <span className="text-muted">sgxpressja.com/</span>
            <input className={inputCls} maxLength={60} value={finalSlug} onChange={(e) => { setTouched(true); setSlug(e.target.value.toLowerCase()); }} />
          </div>
          <span className="text-xs text-muted">The page starts as a draft. Customers can&apos;t see it until you tick “Published” and save.</span>
        </label>
        {problem && name ? <p className="text-sm text-red-700">{problem}</p> : null}
        <div className="flex gap-2">
          <button type="button" disabled={Boolean(problem)} onClick={() => onCreate(name.trim(), finalSlug)} className={`${btn} bg-navy text-white disabled:opacity-50`}>Create page</button>
          <button type="button" onClick={onClose} className={`${btn} border-2 border-line`}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ---------------- One section ----------------

function SectionCard({
  s, index, count, open, onToggle, onChange, onMove, onDuplicate, onDelete, ctx,
}: {
  s: Section; index: number; count: number; open: boolean; onToggle: () => void; onChange: (s: Section) => void;
  onMove: (to: number) => void; onDuplicate: () => void; onDelete: () => void; ctx: EditorContext;
}) {
  const def = BLOCKS[s.type];
  const hasTone = "tone" in def;
  return (
    <li className={`${card} ${s.hidden ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-center gap-2 p-3">
        <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-mist text-xs font-bold">{index + 1}</span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold">{def.name}{s.hidden ? " (hidden)" : ""}</span>
            <span className="block truncate text-xs text-muted">{summary(s) || def.description}</span>
          </span>
        </button>
        <span className="flex flex-wrap gap-1">
          <button type="button" className={small} aria-label="Move up" disabled={index === 0} onClick={() => onMove(index - 1)}>↑</button>
          <button type="button" className={small} aria-label="Move down" disabled={index === count - 1} onClick={() => onMove(index + 1)}>↓</button>
          <button type="button" className={small} onClick={() => onChange({ ...s, hidden: !s.hidden })}>{s.hidden ? "Show" : "Hide"}</button>
          <button type="button" className={small} onClick={onToggle}>{open ? "Done" : "Edit"}</button>
        </span>
      </div>
      {open ? (
        <div className="flex flex-col gap-4 border-t border-line p-3 md:p-4">
          <Fields fields={def.fields} values={s.props} onChange={(props) => onChange({ ...s, props })} ctx={ctx} />
          <details className="rounded-xl bg-mist p-3 text-sm">
            <summary className="cursor-pointer font-semibold">Section settings</summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {hasTone ? (
                <label className="flex flex-col gap-1">
                  <span className="font-semibold">Background</span>
                  <select className={inputCls} value={s.tone} onChange={(e) => onChange({ ...s, tone: e.target.value })}>
                    {TONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </label>
              ) : null}
              <label className="flex flex-col gap-1">
                <span className="font-semibold">Section name (for links)</span>
                <input className={inputCls} maxLength={40} value={s.anchor} onChange={(e) => onChange({ ...s, anchor: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} placeholder="e.g. air" />
                <span className="text-xs text-muted">Lets a button or jump link go straight here, as #{s.anchor || "name"}.</span>
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className={small} onClick={onDuplicate}>Duplicate section</button>
              <button type="button" className={`${small} text-red-700`} onClick={onDelete}>Delete section</button>
            </div>
          </details>
        </div>
      ) : null}
    </li>
  );
}

/** True on screens wide enough to show the preview beside the editor. */
function useWide(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(min-width: 1280px)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(min-width: 1280px)").matches,
    () => false,
  );
}

// ---------------- The panel ----------------

export function PagesPanel({ c, edit, images, setImages }: { c: SiteContent; edit: Edit; images: LibraryImage[]; setImages: (fn: (prev: LibraryImage[]) => LibraryImage[]) => void }) {
  const pages = c.pages as Page[];
  const [pageId, setPageId] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [adding, setAdding] = useState<number | null>(null); // insert position
  const [creating, setCreating] = useState(false);
  const [picker, setPicker] = useState<((img: ImageValue) => void) | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const wide = useWide();

  const pageIndex = pages.findIndex((p) => p.id === pageId);
  const page = pageIndex >= 0 ? pages[pageIndex] : null;

  const ctx: EditorContext = useMemo(() => ({
    pages: [...pages.map((p) => ({ label: `${p.name} (${pagePath(p)})`, path: pagePath(p) })), { label: "Careers: general application (/careers/apply)", path: "/careers/apply" }],
    pickImage: (onPick) => setPicker(() => onPick),
  }), [pages]);

  const editPage = (fn: (p: Page) => void) =>
    edit((d) => {
      const p = (d.pages as Page[]).find((x) => x.id === pageId);
      if (p) fn(p);
    });

  // ----- Page list -----
  if (!page) {
    const builtin = BUILTIN_PAGES.map((b) => pages.find((p) => p.id === b.id)).filter((p): p is Page => Boolean(p));
    const custom = pages.filter((p) => !isBuiltin(p.id));
    const row = (p: Page) => (
      <li key={p.id} className={`${card} flex flex-wrap items-center justify-between gap-3 p-3 md:p-4`}>
        <div className="min-w-0">
          <p className="font-semibold">{p.name}</p>
          <p className="text-sm text-muted">
            {pagePath(p)} · {p.sections.length} section{p.sections.length === 1 ? "" : "s"}
            {!isBuiltin(p.id) ? (p.published ? " · Published" : " · Draft (not visible)") : ""}
          </p>
        </div>
        <button type="button" onClick={() => { setPageId(p.id); setOpenSection(null); window.scrollTo({ top: 0 }); }} className={`${btn} bg-navy text-white`}>Edit page</button>
      </li>
    );
    return (
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-bold">Website pages</h2>
          <ul className="flex flex-col gap-2">{builtin.map(row)}</ul>
        </section>
        <section className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold">Extra pages</h2>
            <button type="button" onClick={() => setCreating(true)} className={`${btn} bg-gold text-navy`}>+ New page</button>
          </div>
          <p className="text-sm text-muted">For promotions, holiday notices or anything else. Add a link to them from any button, or list them in the footer.</p>
          {custom.length ? <ul className="flex flex-col gap-2">{custom.map(row)}</ul> : <p className={`${card} p-4 text-sm text-muted`}>No extra pages yet.</p>}
        </section>
        {creating ? (
          <NewPageDialog
            pages={pages}
            onClose={() => setCreating(false)}
            onCreate={(name, slug) => {
              const p = newPage(name, slug);
              edit((d) => { (d.pages as Page[]).push(p); });
              setCreating(false);
              setPageId(p.id);
            }}
          />
        ) : null}
      </div>
    );
  }

  // ----- One page -----
  const builtinPage = isBuiltin(page.id);
  const setSection = (i: number, s: Section) => editPage((p) => { p.sections[i] = s; });
  const move = (from: number, to: number) => editPage((p) => { const [x] = p.sections.splice(from, 1); p.sections.splice(to, 0, x); });
  const addAt = (type: BlockType, at: number) => {
    const s = newSection(type);
    editPage((p) => { p.sections.splice(at, 0, s); });
    setOpenSection(s.id);
    setAdding(null);
  };

  const editor = (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setPageId(null)} className={small}>← All pages</button>
        <h2 className="min-w-0 flex-1 truncate text-lg font-bold">{page.name}</h2>
        <button type="button" onClick={() => setPreviewOpen(true)} className={`${small} xl:hidden`}>Preview</button>
        {page.published || builtinPage ? (
          <a href={pagePath(page)} target="_blank" rel="noopener" className={small}>View live <IconExternal className="h-4 w-4" /></a>
        ) : null}
      </div>

      <details className={`${card} p-3 md:p-4`} open={!builtinPage && !page.published}>
        <summary className="cursor-pointer text-sm font-semibold">Page settings and Google listing</summary>
        <div className="mt-3 flex flex-col gap-3 text-sm">
          {!builtinPage ? (
            <>
              <label className="flex flex-col gap-1">
                <span className="font-semibold">Page name</span>
                <input className={inputCls} maxLength={80} value={page.name} onChange={(e) => editPage((p) => { p.name = e.target.value; })} />
                <span className="text-xs text-muted">Used in the footer link and this list.</span>
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-semibold">Web address</span>
                <div className="flex items-center gap-1"><span className="text-muted">sgxpressja.com/</span>
                  <input className={inputCls} maxLength={60} value={page.slug} onChange={(e) => editPage((p) => { p.slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"); })} />
                </div>
              </label>
              <label className="flex items-center gap-2 font-semibold">
                <input type="checkbox" className="h-5 w-5" checked={page.published} onChange={(e) => editPage((p) => { p.published = e.target.checked; })} />
                Published (customers can see it)
              </label>
              <label className="flex items-center gap-2 font-semibold">
                <input type="checkbox" className="h-5 w-5" checked={page.showInFooter} onChange={(e) => editPage((p) => { p.showInFooter = e.target.checked; })} />
                Show a link in the website footer
              </label>
            </>
          ) : (
            <p className="text-muted">This page&apos;s web address is fixed: {pagePath(page)}</p>
          )}
          <label className="flex flex-col gap-1">
            <span className="font-semibold">Title in Google ({page.seoTitle.length}/60)</span>
            <input className={inputCls} maxLength={70} value={page.seoTitle} onChange={(e) => editPage((p) => { p.seoTitle = e.target.value; })} />
            <span className="text-xs text-muted">Shown as “{page.seoTitle || page.name} | SG Xpress”. Say what it is and where, e.g. “Ship from China to Jamaica”.</span>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-semibold">Description in Google ({page.seoDescription.length}/160)</span>
            <textarea rows={2} className={`${inputCls} h-auto py-2`} maxLength={200} value={page.seoDescription} onChange={(e) => editPage((p) => { p.seoDescription = e.target.value; })} />
          </label>
          {!builtinPage ? (
            <button
              type="button"
              className={`${btn} self-start border-2 border-red-700 text-red-700`}
              onClick={() => {
                if (!confirm(`Delete the page “${page.name}”? You can still undo this until you save, or later from Version history.`)) return;
                edit((d) => { d.pages = (d.pages as Page[]).filter((p) => p.id !== page.id); });
                setPageId(null);
              }}
            >
              Delete this page
            </button>
          ) : null}
        </div>
      </details>

      <ol className="flex flex-col gap-2">
        {page.sections.map((s, i) => (
          <SectionCard
            key={s.id}
            s={s}
            index={i}
            count={page.sections.length}
            open={openSection === s.id}
            onToggle={() => setOpenSection(openSection === s.id ? null : s.id)}
            onChange={(next) => setSection(i, next)}
            onMove={(to) => move(i, to)}
            onDuplicate={() => {
              const copy = { ...structuredClone(s), id: `s-${crypto.randomUUID().slice(0, 8)}`, anchor: "" };
              editPage((p) => { p.sections.splice(i + 1, 0, copy); });
              setOpenSection(copy.id);
            }}
            onDelete={() => {
              if (!confirm(`Delete the “${BLOCKS[s.type].name}” section? You can undo by not saving, or later from Version history.`)) return;
              editPage((p) => { p.sections.splice(i, 1); });
            }}
            ctx={ctx}
          />
        ))}
      </ol>
      <button type="button" onClick={() => setAdding(page.sections.length)} className={`${btn} border-2 border-dashed border-line bg-white`}>+ Add a section</button>
    </div>
  );

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {editor}
        {wide ? (
          <div className="sticky top-4 h-[calc(100vh-7rem)]">
            <Preview content={c} pageId={page.id} />
          </div>
        ) : null}
      </div>
      {previewOpen && !wide ? (
        <div className="fixed inset-0 z-[55] flex flex-col bg-white p-3 xl:hidden">
          <Preview content={c} pageId={page.id} onClose={() => setPreviewOpen(false)} />
        </div>
      ) : null}
      {adding !== null ? <AddSection onAdd={(t) => addAt(t, adding)} onClose={() => setAdding(null)} /> : null}
      {picker ? (
        <MediaPicker
          images={images}
          onUploaded={(img) => setImages((prev) => [img, ...prev])}
          onPick={(img) => { picker(img); setPicker(null); }}
          onClose={() => setPicker(null)}
        />
      ) : null}
    </>
  );
}
