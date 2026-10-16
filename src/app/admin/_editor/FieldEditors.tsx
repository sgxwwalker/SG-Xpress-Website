"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ICONS } from "@/components/blocks/shared";
import { IconClose } from "@/components/Icons";
import {
  BUTTON_ICONS, BUTTON_STYLES, ICON_NAMES, emptyProps, NO_IMAGE, NO_LINK,
  type ButtonValue, type FieldSpec, type ImageValue, type LinkType, type LinkValue,
} from "@/lib/blocks/fields";
import { TOKENS } from "@/lib/blocks/tokens";
import type { LibraryImage } from "@/lib/media";

// The form controls for every kind of editable field. One spec in lib/blocks/registry.ts
// decides which controls a section shows.

export const inputCls = "h-11 w-full rounded-lg border-2 border-line bg-white px-3 text-navy focus:border-navy focus:outline-none";
const smallBtn = "inline-flex h-9 items-center gap-1 rounded-lg border border-line bg-white px-3 text-sm font-semibold text-navy hover:bg-mist disabled:opacity-40";

export type EditorContext = {
  pages: { label: string; path: string }[]; // for the page-link dropdown
  pickImage: (onPick: (img: ImageValue) => void) => void; // opens the media library
};

function Label({ text, hint, extra, children }: { text: string; hint?: string; extra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-x-3">
        <span className="font-semibold">{text}</span>
        {extra}
      </div>
      {children}
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </div>
  );
}

/** "Insert live value" menu: adds {flight days} and friends at the cursor. */
function TokenMenu({ onInsert }: { onInsert: (token: string) => void }) {
  return (
    <select
      aria-label="Insert a live value"
      title="Live values update by themselves when the rates or settings change."
      className="h-7 max-w-44 cursor-pointer appearance-none rounded-md bg-transparent px-1 text-right text-xs font-semibold text-[#2a5bd7] hover:underline"
      value=""
      onChange={(e) => {
        if (e.target.value) onInsert(e.target.value);
      }}
    >
      <option value="">+ Live value</option>
      {TOKENS.map((t) => <option key={t.token} value={t.token}>{t.label}</option>)}
    </select>
  );
}

function insertAt(el: HTMLInputElement | HTMLTextAreaElement | null, value: string, insert: string): string {
  if (!el) return value + insert;
  const start = el.selectionStart ?? value.length;
  const end = el.selectionEnd ?? value.length;
  return value.slice(0, start) + insert + value.slice(end);
}

function TextField({ spec, value, onChange }: { spec: Extract<FieldSpec, { kind: "text" }>; value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  return (
    <Label text={spec.label} hint={spec.hint} extra={<TokenMenu onInsert={(t) => onChange(insertAt(ref.current, value, t))} />}>
      {spec.multiline ? (
        <textarea ref={ref} rows={3} maxLength={spec.max ?? 1500} className={`${inputCls} h-auto py-2`} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input ref={ref} maxLength={spec.max ?? 300} className={inputCls} value={value} placeholder={spec.placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
    </Label>
  );
}

/** Formatted text with a simple toolbar, so nobody needs to remember the symbols. */
function MarkdownField({ spec, value, onChange }: { spec: Extract<FieldSpec, { kind: "markdown" }>; value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const wrap = (before: string, after = before, placeholder = "text") => {
    const el = ref.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const picked = value.slice(start, end) || placeholder;
    onChange(value.slice(0, start) + before + picked + after + value.slice(end));
  };
  const lineStart = (prefix: string) => {
    const el = ref.current;
    const start = el?.selectionStart ?? value.length;
    const at = value.lastIndexOf("\n", start - 1) + 1;
    onChange(value.slice(0, at) + prefix + value.slice(at));
  };
  const link = () => {
    const url = window.prompt("Link to (a page like /rates, or a full https:// address):", "/");
    if (url) wrap("[", `](${url.trim()})`, "link text");
  };
  return (
    <Label text={spec.label} hint={spec.hint ?? "Leave a blank line between paragraphs."}>
      <div className="flex flex-wrap gap-1.5">
        <button type="button" className={smallBtn} onClick={() => wrap("**")}><strong>B</strong> Bold</button>
        <button type="button" className={smallBtn} onClick={link}>Link</button>
        <button type="button" className={smallBtn} onClick={() => lineStart("### ")}>Sub-heading</button>
        <button type="button" className={smallBtn} onClick={() => lineStart("- ")}>• Bullet</button>
        <TokenMenu onInsert={(t) => onChange(insertAt(ref.current, value, t))} />
      </div>
      <textarea ref={ref} rows={spec.rows ?? 6} maxLength={spec.max ?? 80000} className={`${inputCls} h-auto py-2 font-mono text-[13px]`} value={value} onChange={(e) => onChange(e.target.value)} />
    </Label>
  );
}

const LINK_LABELS: Record<LinkType, string> = {
  none: "No link",
  page: "A page on this website",
  register: "Sign-up page (customer portal)",
  login: "Customer login",
  "whatsapp-general": "WhatsApp: general number",
  "whatsapp-china": "WhatsApp: China Help Desk",
  "whatsapp-quotes": "WhatsApp: quotes and orders",
  phone: "Phone call",
  email: "Email",
  web: "Another website",
};

export function LinkField({ label, hint, value, onChange, ctx }: { label: string; hint?: string; value: LinkValue; onChange: (v: LinkValue) => void; ctx: EditorContext }) {
  const set = (patch: Partial<LinkValue>) => onChange({ ...value, ...patch });
  const known = ctx.pages.some((p) => p.path === value.value);
  return (
    <Label text={label} hint={hint}>
      <select className={inputCls} value={value.type} onChange={(e) => set({ type: e.target.value as LinkType, value: e.target.value === "page" ? "/" : "" })}>
        {(Object.keys(LINK_LABELS) as LinkType[]).map((t) => <option key={t} value={t}>{LINK_LABELS[t]}</option>)}
      </select>
      {value.type === "page" ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <select className={inputCls} value={known ? value.value : "other"} onChange={(e) => set({ value: e.target.value === "other" ? value.value : e.target.value })}>
            {ctx.pages.map((p) => <option key={p.path} value={p.path}>{p.label}</option>)}
            <option value="other">Other / a section (type it →)</option>
          </select>
          <input className={inputCls} value={value.value} onChange={(e) => set({ value: e.target.value })} placeholder="/rates#air or #steps" />
        </div>
      ) : null}
      {value.type === "web" ? <input className={inputCls} value={value.value} onChange={(e) => set({ value: e.target.value })} placeholder="https://…" /> : null}
      {value.type === "phone" ? <input className={inputCls} value={value.value} onChange={(e) => set({ value: e.target.value })} placeholder="(876) 879-4816" /> : null}
      {value.type === "email" ? <input className={inputCls} value={value.value} onChange={(e) => set({ value: e.target.value })} placeholder="Leave blank for the main email" /> : null}
      {value.type.startsWith("whatsapp") ? (
        <input className={inputCls} value={value.message} maxLength={300} onChange={(e) => set({ message: e.target.value })} placeholder="Ready-typed message (optional), e.g. Hi SG Xpress, I'd like a quote" />
      ) : null}
    </Label>
  );
}

const STYLE_LABELS: Record<(typeof BUTTON_STYLES)[number], string> = {
  gold: "Yellow",
  navy: "Navy",
  outline: "Navy outline (on white)",
  "outline-light": "White outline (on navy)",
  whatsapp: "WhatsApp green",
};
const BTN_ICON_LABELS: Record<(typeof BUTTON_ICONS)[number], string> = { none: "No icon", arrow: "Arrow →", chat: "Chat bubble" };

function ButtonsField({ spec, value, onChange, ctx }: { spec: Extract<FieldSpec, { kind: "buttons" }>; value: ButtonValue[]; onChange: (v: ButtonValue[]) => void; ctx: EditorContext }) {
  const max = spec.max ?? 4;
  const update = (i: number, patch: Partial<ButtonValue>) => onChange(value.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  return (
    <Label text={spec.label} hint={spec.hint}>
      <div className="flex flex-col gap-3">
        {value.map((b, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-xl border border-line bg-mist p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Button {i + 1}</span>
              <ListControls i={i} n={value.length} list={value} onChange={onChange} />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Label text="Text on the button"><input className={inputCls} maxLength={80} value={b.label} onChange={(e) => update(i, { label: e.target.value })} /></Label>
              <Label text="Colour">
                <select className={inputCls} value={b.style} onChange={(e) => update(i, { style: e.target.value as ButtonValue["style"] })}>
                  {BUTTON_STYLES.map((s) => <option key={s} value={s}>{STYLE_LABELS[s]}</option>)}
                </select>
              </Label>
              <Label text="Icon">
                <select className={inputCls} value={b.icon} onChange={(e) => update(i, { icon: e.target.value as ButtonValue["icon"] })}>
                  {BUTTON_ICONS.map((s) => <option key={s} value={s}>{BTN_ICON_LABELS[s]}</option>)}
                </select>
              </Label>
            </div>
            <LinkField label="Goes to" value={b.link} onChange={(link) => update(i, { link })} ctx={ctx} />
          </div>
        ))}
        {value.length < max ? (
          <button type="button" className={`${smallBtn} self-start`} onClick={() => onChange([...value, { label: "Button", link: { ...NO_LINK, type: "register" }, style: "navy", icon: "none" }])}>
            + Add button
          </button>
        ) : null}
      </div>
    </Label>
  );
}

function ListControls<T>({ i, n, list, onChange }: { i: number; n: number; list: T[]; onChange: (v: T[]) => void }) {
  const move = (to: number) => {
    const next = [...list];
    const [x] = next.splice(i, 1);
    next.splice(to, 0, x);
    onChange(next);
  };
  return (
    <span className="flex gap-1">
      <button type="button" className={smallBtn} aria-label="Move up" disabled={i === 0} onClick={() => move(i - 1)}>↑</button>
      <button type="button" className={smallBtn} aria-label="Move down" disabled={i === n - 1} onClick={() => move(i + 1)}>↓</button>
      <button type="button" className={`${smallBtn} text-red-700`} aria-label="Remove" onClick={() => onChange(list.filter((_, j) => j !== i))}>
        <IconClose className="h-4 w-4" />
      </button>
    </span>
  );
}

function ImageField({ label, hint, value, onChange, ctx }: { label: string; hint?: string; value: ImageValue; onChange: (v: ImageValue) => void; ctx: EditorContext }) {
  return (
    <Label text={label} hint={hint}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex h-28 w-28 flex-none items-center justify-center overflow-hidden rounded-xl border border-line bg-mist">
          {value.src ? (
            <Image src={value.src} alt="" width={112} height={112} unoptimized className="h-full w-full object-cover" />
          ) : (
            <span className="px-2 text-center text-xs text-muted">No picture</span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <button type="button" className={smallBtn} onClick={() => ctx.pickImage((img) => onChange({ ...img, alt: img.alt || value.alt }))}>
              {value.src ? "Change picture" : "Choose picture"}
            </button>
            {value.src ? <button type="button" className={`${smallBtn} text-red-700`} onClick={() => onChange({ ...NO_IMAGE })}>Remove</button> : null}
          </div>
          {value.src ? (
            <Label text="Describe the picture" hint="Read aloud to blind visitors and used by Google. Say what it shows or says.">
              <input className={inputCls} maxLength={300} value={value.alt} onChange={(e) => onChange({ ...value, alt: e.target.value })} />
            </Label>
          ) : null}
        </div>
      </div>
    </Label>
  );
}

function IconField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Label text={label}>
      <div className="flex flex-wrap gap-1.5">
        {ICON_NAMES.map((name) => {
          const C = ICONS[name];
          return (
            <button
              key={name}
              type="button"
              aria-label={name}
              aria-pressed={value === name}
              onClick={() => onChange(name)}
              className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 ${value === name ? "border-navy bg-navy text-gold" : "border-line bg-white text-navy"}`}
            >
              <C className="h-5 w-5" />
            </button>
          );
        })}
      </div>
    </Label>
  );
}

function ListField({ spec, value, onChange, ctx }: { spec: Extract<FieldSpec, { kind: "list" }>; value: Record<string, unknown>[]; onChange: (v: Record<string, unknown>[]) => void; ctx: EditorContext }) {
  const [open, setOpen] = useState<number | null>(value.length <= 4 ? -1 : null); // -1 = all open
  const max = spec.max ?? 60;
  const firstText = (item: Record<string, unknown>) => {
    const f = spec.fields.find((x) => x.kind === "text");
    const v = f ? String(item[f.key] ?? "") : "";
    return v.length > 50 ? `${v.slice(0, 47)}…` : v;
  };
  const isOpen = (i: number) => open === -1 || open === i;
  const simple = spec.fields.length === 1 && spec.fields[0].kind === "text";
  return (
    <Label text={spec.label} hint={spec.hint}>
      <div className="flex flex-col gap-2">
        {value.map((item, i) => (
          <div key={i} className="rounded-xl border border-line bg-white">
            <div className="flex items-center justify-between gap-2 p-2 pl-3">
              {simple ? (
                <input
                  aria-label={`${spec.itemLabel} ${i + 1}`}
                  className={`${inputCls} h-9`}
                  value={String(item[spec.fields[0].key] ?? "")}
                  maxLength={(spec.fields[0] as { max?: number }).max ?? 300}
                  onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, [spec.fields[0].key]: e.target.value } : x)))}
                />
              ) : (
                <button type="button" className="min-w-0 flex-1 truncate text-left text-sm font-semibold" onClick={() => setOpen(isOpen(i) ? null : i)}>
                  {isOpen(i) ? "▾" : "▸"} {spec.itemLabel} {i + 1}{firstText(item) ? `: ${firstText(item)}` : ""}
                </button>
              )}
              <ListControls i={i} n={value.length} list={value} onChange={onChange} />
            </div>
            {!simple && isOpen(i) ? (
              <div className="flex flex-col gap-4 border-t border-line p-3">
                <Fields fields={spec.fields} values={item} onChange={(next) => onChange(value.map((x, j) => (j === i ? next : x)))} ctx={ctx} />
              </div>
            ) : null}
          </div>
        ))}
        {value.length < max ? (
          <button type="button" className={`${smallBtn} self-start`} onClick={() => { onChange([...value, emptyProps(spec.fields)]); setOpen(value.length); }}>
            + Add {spec.itemLabel.toLowerCase()}
          </button>
        ) : null}
      </div>
    </Label>
  );
}

/** All the fields of a section (or of one item in a list). */
export function Fields({ fields, values, onChange, ctx }: { fields: FieldSpec[]; values: Record<string, unknown>; onChange: (v: Record<string, unknown>) => void; ctx: EditorContext }) {
  const set = (key: string, v: unknown) => onChange({ ...values, [key]: v });
  return (
    <>
      {fields.map((f) => {
        const v = values[f.key];
        switch (f.kind) {
          case "text":
            return <TextField key={f.key} spec={f} value={String(v ?? "")} onChange={(x) => set(f.key, x)} />;
          case "markdown":
            return <MarkdownField key={f.key} spec={f} value={String(v ?? "")} onChange={(x) => set(f.key, x)} />;
          case "number":
            return (
              <Label key={f.key} text={f.label} hint={f.hint}>
                <input type="number" min={f.min} max={f.max} className={inputCls} value={Number(v ?? 0)} onChange={(e) => set(f.key, e.target.value === "" ? 0 : Number(e.target.value))} />
              </Label>
            );
          case "toggle":
            return (
              <label key={f.key} className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" className="h-5 w-5" checked={Boolean(v)} onChange={(e) => set(f.key, e.target.checked)} />
                {f.label}
              </label>
            );
          case "select":
            return (
              <Label key={f.key} text={f.label} hint={f.hint}>
                <select className={inputCls} value={String(v)} onChange={(e) => set(f.key, e.target.value)}>
                  {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Label>
            );
          case "icon":
            if (values.showIcon === false) return null; // cards: only when "Show an icon" is ticked
            return <IconField key={f.key} label={f.label} value={String(v)} onChange={(x) => set(f.key, x)} />;
          case "image":
            return <ImageField key={f.key} label={f.label} hint={f.hint} value={v as ImageValue} onChange={(x) => set(f.key, x)} ctx={ctx} />;
          case "link":
            return <LinkField key={f.key} label={f.label} hint={f.hint} value={v as LinkValue} onChange={(x) => set(f.key, x)} ctx={ctx} />;
          case "buttons":
            return <ButtonsField key={f.key} spec={f} value={(v as ButtonValue[]) ?? []} onChange={(x) => set(f.key, x)} ctx={ctx} />;
          case "list":
            return <ListField key={f.key} spec={f} value={(v as Record<string, unknown>[]) ?? []} onChange={(x) => set(f.key, x)} ctx={ctx} />;
        }
      })}
    </>
  );
}

export type { LibraryImage };
