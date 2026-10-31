"use client";

import Image from "next/image";
import { useState } from "react";
import type { ImageValue } from "@/lib/blocks/fields";
import { YARD_CONDITIONS, YARD_STATUSES, type SiteContent, type YardItem } from "@/lib/content/schema";
import type { LibraryImage } from "@/lib/media";
import { jmd } from "@/lib/rates";
import { MediaPicker } from "./MediaLibrary";
import { Fold, Pager, useOpen, usePager } from "./ListTools";

// Admin → Yard Sale: add items with photos, price, condition and branch, then mark
// them reserved or sold. Only "For sale" and "Reserved" items show on the website.

type Edit = (fn: (draft: SiteContent) => void) => void;

const input = "h-11 w-full rounded-lg border-2 border-line bg-white px-3 focus:border-navy focus:outline-none";
const card = "rounded-2xl border border-line bg-white p-4 md:p-5";

const STATUS_TEXT: Record<YardItem["status"], { label: string; badge: string; help: string }> = {
  draft: { label: "Draft (hidden)", badge: "bg-mist", help: "Not on the website yet. Choose “For sale” when it's ready." },
  available: { label: "For sale", badge: "bg-whatsapp text-white", help: "On the Yard Sale page with a Buy on WhatsApp button." },
  reserved: { label: "Reserved", badge: "bg-gold", help: "Still shown, marked Reserved, with no buy button. Use this while a buyer pays and collects." },
  sold: { label: "Sold", badge: "bg-navy text-white", help: "Shown with a grey Sold badge for the days set above, then hidden. Delete it when you no longer need the record." },
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-semibold">{label}</span>
      {children}
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

/** "Shows with a Sold badge until 5 Nov 2026, then hides." */
function soldHint(soldAt: string, days: number): string {
  if (!soldAt) return "Pick the date it sold.";
  if (!days) return "Hidden from the website.";
  const until = new Date(`${soldAt}T12:00:00Z`);
  until.setUTCDate(until.getUTCDate() + days);
  const when = until.toLocaleDateString("en-JM", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  return until.getTime() > Date.now() ? `Shows with a Sold badge until ${when}, then hides.` : "Hidden from the website.";
}

function Money({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <input
      type="number"
      inputMode="decimal"
      min={0}
      step="any"
      aria-label={label}
      className={input}
      value={Number.isFinite(value) ? value : ""}
      onChange={(e) => onChange(e.target.value === "" ? NaN : Number(e.target.value))}
    />
  );
}

export function YardSalePanel({ c, edit, images, setImages }: { c: SiteContent; edit: Edit; images: LibraryImage[]; setImages: (fn: (prev: LibraryImage[]) => LibraryImage[]) => void }) {
  const [filter, setFilter] = useState<"all" | YardItem["status"]>("all");
  const [picker, setPicker] = useState<((img: ImageValue) => void) | null>(null);
  const list = c.yardSale.map((item, index) => ({ item, index })).filter(({ item }) => filter === "all" || item.status === filter);
  const pager = usePager(list, 10);
  const open = useOpen();
  const count = (s: YardItem["status"]) => c.yardSale.filter((i) => i.status === s).length;

  return (
    <>
      <button
        type="button"
        className="h-11 rounded-xl border-2 border-dashed border-line font-semibold"
        onClick={() => {
          const id = `ys-${Math.random().toString(36).slice(2, 8)}`;
          edit((d) => {
            d.yardSale.unshift({
              id,
              title: "New item",
              description: "",
              price: 0,
              wasPrice: 0,
              condition: "Used",
              category: "",
              branch: d.branches[0]?.name ?? "",
              images: [],
              status: "draft",
              addedAt: new Date().toISOString().slice(0, 10),
              soldAt: "",
              watching: 0,
            });
          });
          setFilter("all");
          pager.setPage(1);
          open.openOnly(id);
        }}
      >
        + Add an item
      </button>

      <div className={card}>
        <Field label="Show sold items for (days)" hint="Sold items stay on the page with a grey “Sold” badge so customers see things sell, then hide by themselves. 0 = hide as soon as they're sold.">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={60}
            step={1}
            className={`${input} md:w-40`}
            value={Number.isFinite(c.yardSaleSoldDays) ? c.yardSaleSoldDays : ""}
            onChange={(e) => edit((d) => { d.yardSaleSoldDays = e.target.value === "" ? NaN : Math.round(Number(e.target.value)); })}
          />
        </Field>
      </div>

      {c.yardSale.length ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Show items">
          {(["all", ...YARD_STATUSES] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={filter === s}
              onClick={() => { setFilter(s); pager.setPage(1); }}
              className={`min-h-9 rounded-full border-2 px-3 text-sm font-semibold ${filter === s ? "border-navy bg-navy text-white" : "border-line bg-white"}`}
            >
              {s === "all" ? `All (${c.yardSale.length})` : `${STATUS_TEXT[s].label.replace(/ \(hidden\)/, "")} (${count(s)})`}
            </button>
          ))}
        </div>
      ) : (
        <p className={`${card} text-sm text-muted`}>No items yet. Add one, give it photos and a price, set it to “For sale”, then click Save and publish.</p>
      )}

      <datalist id="ys-categories">
        {[...new Set(c.yardSale.map((x) => x.category).filter(Boolean))].sort().map((x) => <option key={x} value={x} />)}
      </datalist>
      <Pager page={pager.page} pages={pager.pages} onChange={pager.setPage} total={list.length} perPage={10} label="items" />
      {pager.items.map(({ item, index: i }) => {
        const st = STATUS_TEXT[item.status];
        return (
          <Fold
            key={item.id}
            title={item.title || "Untitled item"}
            subtitle={[Number.isFinite(item.price) ? jmd(item.price) : "", item.category, item.condition, item.branch].filter(Boolean).join(" · ")}
            badge={<span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${st.badge}`}>{st.label}</span>}
            open={open.isOpen(item.id)}
            onToggle={() => open.toggle(item.id)}
          >
            <Field label="Status" hint={st.help}>
              <select
                className={input}
                value={item.status}
                onChange={(e) => edit((d) => {
                  const it = d.yardSale[i];
                  it.status = e.target.value as YardItem["status"];
                  // Record the sale date (it decides when the Sold badge comes off the page).
                  it.soldAt = it.status === "sold" ? it.soldAt || new Date().toISOString().slice(0, 10) : "";
                })}
              >
                {YARD_STATUSES.map((s) => <option key={s} value={s}>{STATUS_TEXT[s].label}</option>)}
              </select>
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Item name"><input className={input} maxLength={100} value={item.title} onChange={(e) => edit((d) => { d.yardSale[i].title = e.target.value; })} /></Field>
              <Field label="Condition">
                <select className={input} value={item.condition} onChange={(e) => edit((d) => { d.yardSale[i].condition = e.target.value as YardItem["condition"]; })}>
                  {YARD_CONDITIONS.map((x) => <option key={x}>{x}</option>)}
                </select>
              </Field>
              <Field label="Category (optional)" hint="e.g. Kitchen, Electronics, Clothing. Customers can filter by it.">
                <input className={input} maxLength={60} list="ys-categories" value={item.category} onChange={(e) => edit((d) => { d.yardSale[i].category = e.target.value; })} />
              </Field>
              <Field label="Price (J$)"><Money label="Price in J$" value={item.price} onChange={(n) => edit((d) => { d.yardSale[i].price = n; })} /></Field>
              <Field label="Was price (J$, optional)" hint="Shown crossed out when higher than the price. Leave 0 for none.">
                <Money label="Was price in J$" value={item.wasPrice} onChange={(n) => edit((d) => { d.yardSale[i].wasPrice = n; })} />
              </Field>
              <Field label="Pick up at">
                <select className={input} value={item.branch} onChange={(e) => edit((d) => { d.yardSale[i].branch = e.target.value; })}>
                  {c.branches.map((b) => <option key={b.name}>{b.name}</option>)}
                  {item.branch && !c.branches.some((b) => b.name === item.branch) ? <option>{item.branch}</option> : null}
                </select>
              </Field>
              <Field label="Added"><input type="date" className={input} value={item.addedAt} onChange={(e) => edit((d) => { d.yardSale[i].addedAt = e.target.value; })} /></Field>
              {item.status === "sold" ? (
                <Field label="Sold on" hint={soldHint(item.soldAt, c.yardSaleSoldDays)}>
                  <input type="date" className={input} value={item.soldAt} onChange={(e) => edit((d) => { d.yardSale[i].soldAt = e.target.value; })} />
                </Field>
              ) : (
                <Field label="People watching" hint="Shown on the item as “👁 5 people watching”. 0 = hidden.">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={999}
                    step={1}
                    aria-label="People watching"
                    className={input}
                    value={Number.isFinite(item.watching) ? item.watching : ""}
                    onChange={(e) => edit((d) => { d.yardSale[i].watching = e.target.value === "" ? NaN : Math.round(Number(e.target.value)); })}
                  />
                </Field>
              )}
            </div>
            <Field label={`Description (${item.description.length}/1000, optional)`} hint="Size, colour, what's included, any faults.">
              <textarea rows={3} maxLength={1000} className={`${input} h-auto py-2`} value={item.description} onChange={(e) => edit((d) => { d.yardSale[i].description = e.target.value; })} />
            </Field>

            <div className="flex flex-col gap-2 text-sm">
              <span className="font-semibold">Photos ({item.images.length}/6)</span>
              <span className="text-xs text-muted">The first photo is the main one customers see.</span>
              <ul className="flex flex-wrap gap-3">
                {item.images.map((img, k) => (
                  <li key={img.src + k} className="flex w-28 flex-col gap-1">
                    <div className="h-28 w-28 overflow-hidden rounded-xl border border-line bg-mist">
                      <Image src={img.src} alt="" width={112} height={112} unoptimized className="h-full w-full object-cover" />
                    </div>
                    <div className="flex justify-between text-xs font-semibold">
                      <button type="button" disabled={k === 0} className="px-1 disabled:opacity-30" aria-label="Move photo earlier" onClick={() => edit((d) => { const a = d.yardSale[i].images; [a[k - 1], a[k]] = [a[k], a[k - 1]]; })}>←</button>
                      <button type="button" className="px-1 text-red-700" onClick={() => edit((d) => { d.yardSale[i].images.splice(k, 1); })}>Remove</button>
                      <button type="button" disabled={k === item.images.length - 1} className="px-1 disabled:opacity-30" aria-label="Move photo later" onClick={() => edit((d) => { const a = d.yardSale[i].images; [a[k + 1], a[k]] = [a[k], a[k + 1]]; })}>→</button>
                    </div>
                  </li>
                ))}
                {item.images.length < 6 ? (
                  <li>
                    <button
                      type="button"
                      className="flex h-28 w-28 items-center justify-center rounded-xl border-2 border-dashed border-line text-sm font-semibold"
                      onClick={() => setPicker(() => (img: ImageValue) => edit((d) => { d.yardSale[i].images.push({ ...img, alt: img.alt || d.yardSale[i].title }); }))}
                    >
                      + Add photo
                    </button>
                  </li>
                ) : null}
              </ul>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted">Reference for WhatsApp: {item.id.toUpperCase()}</span>
              <button type="button" className="h-9 px-2 text-sm font-semibold text-red-700" onClick={() => { if (confirm(`Delete “${item.title}”? This can't be undone after you save.`)) edit((d) => { d.yardSale.splice(i, 1); }); }}>
                Delete item
              </button>
            </div>
          </Fold>
        );
      })}
      <Pager page={pager.page} pages={pager.pages} onChange={pager.setPage} total={list.length} perPage={10} label="items" />

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
