"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { YardItem } from "@/lib/content/schema";
import { jmd } from "@/lib/rates";
import { whatsappUrl } from "@/lib/site";
import { IconChat, IconClose } from "./Icons";

function IconEye({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// Yard Sale shop: search, filters and sorting, a photo gallery per item, and a cart.
// The cart is sent to us as one WhatsApp message listing each item, its reference and
// the total. Each item is one of a kind, so there are no quantities.

const PER_PAGE = 12;
const MAX_CART = 20; // keeps the WhatsApp message a sensible length
const CART_KEY = "sgx-yard-cart";

type Sort = "newest" | "price-asc" | "price-desc";

const ref = (item: YardItem) => item.id.toUpperCase();
const isMedia = (src: string) => src.startsWith("/media/");

/** Every photo sits in the same square white frame, whatever its own shape. */
function Photo({ src, alt, sizes, small = false }: { src: string; alt: string; sizes: string; small?: boolean }) {
  return (
    <Image src={src} alt={alt} fill sizes={sizes} unoptimized={isMedia(src)} className={`object-contain ${small ? "p-1" : "p-3"}`} />
  );
}

function Gallery({ item }: { item: YardItem }) {
  const [shown, setShown] = useState(0);
  const pics = item.images.filter((i) => i.src);
  if (!pics.length) {
    return <div className="flex aspect-square items-center justify-center border-b border-line bg-white text-sm text-muted">No photo yet</div>;
  }
  const main = pics[Math.min(shown, pics.length - 1)];
  return (
    <div className="border-b border-line">
      <div className={`relative aspect-square bg-white ${item.status === "sold" ? "opacity-60 grayscale" : ""}`}>
        <Photo src={main.src} alt={main.alt || item.title} sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw" />
        {item.status === "reserved" ? (
          <span className="absolute left-3 top-3 rounded-full bg-gold px-3 py-1 text-xs font-bold text-navy">Reserved</span>
        ) : item.status === "sold" ? (
          <span className="absolute left-3 top-3 rounded-full bg-gray-600 px-3 py-1 text-xs font-bold text-white">Sold</span>
        ) : null}
      </div>
      <div className="flex h-[4.5rem] gap-2 overflow-x-auto px-2 pb-2">
        {pics.length > 1
          ? pics.map((p, i) => (
              <button
                key={p.src + i}
                type="button"
                onClick={() => setShown(i)}
                aria-label={`Show photo ${i + 1} of ${pics.length}`}
                aria-pressed={i === shown}
                className={`relative h-14 w-14 flex-none overflow-hidden rounded-lg border-2 bg-white ${i === shown ? "border-navy" : "border-line"}`}
              >
                <Photo src={p.src} alt="" sizes="56px" small />
              </button>
            ))
          : null}
      </div>
    </div>
  );
}

function Description({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  const long = text.length > 140;
  return (
    <div className="text-sm text-muted">
      <p className={`whitespace-pre-line ${long && !open ? "line-clamp-3" : ""}`}>{text}</p>
      {long ? (
        <button type="button" onClick={() => setOpen(!open)} className="mt-1 font-semibold text-navy underline underline-offset-2">
          {open ? "Show less" : "Show more"}
        </button>
      ) : null}
    </div>
  );
}

function readCart(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(CART_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function YardSaleBrowser({ items, whatsapp, buyLabel, branches }: { items: YardItem[]; whatsapp: string; buyLabel: string; branches: string[] }) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [branch, setBranch] = useState("");
  const [sort, setSort] = useState<Sort>("newest");
  const [page, setPage] = useState(1);
  const [cartIds, setCartIds] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [notice, setNotice] = useState("");

  // The cart is remembered on this device only (it's a convenience, not an order).
  useEffect(() => {
    const saved = readCart();
    if (saved.length) setCartIds(saved); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cartIds));
    } catch {
      /* private browsing: the cart just isn't remembered */
    }
  }, [cartIds]);

  useEffect(() => {
    if (!cartOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setCartOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cartOpen]);

  const forSale = useMemo(() => new Map(items.filter((i) => i.status === "available").map((i) => [i.id, i])), [items]);
  // Items sold or reserved since they were added drop out of the cart by themselves.
  const cart = cartIds.map((id) => forSale.get(id)).filter((i): i is YardItem => Boolean(i));
  const total = cart.reduce((sum, i) => sum + i.price, 0);
  const inCart = (id: string) => cart.some((i) => i.id === id);

  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))].sort();
  const conditions = [...new Set(items.map((i) => i.condition))];
  const usedBranches = branches.filter((b) => items.some((i) => i.branch === b));

  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const shown = items
    .filter((i) => !category || i.category === category)
    .filter((i) => !condition || i.condition === condition)
    .filter((i) => !branch || i.branch === branch)
    .filter((i) => {
      const hay = `${i.title} ${i.description} ${i.category} ${ref(i)}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    })
    .sort((a, b) => (sort === "price-asc" ? a.price - b.price : sort === "price-desc" ? b.price - a.price : b.addedAt.localeCompare(a.addedAt)))
    .sort((a, b) => Number(a.status === "sold") - Number(b.status === "sold")); // sold ones last
  const pages = Math.max(1, Math.ceil(shown.length / PER_PAGE));
  const current = Math.min(page, pages);
  const visible = shown.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const filtering = Boolean(q || category || condition || branch);

  const reset = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1); };
  function add(item: YardItem) {
    if (cart.length >= MAX_CART) return setNotice(`Your cart can hold up to ${MAX_CART} items. Send this order first, then start another.`);
    setNotice("");
    setCartIds((ids) => [...ids.filter((id) => forSale.has(id)), item.id]);
  }
  const remove = (id: string) => setCartIds((ids) => ids.filter((x) => x !== id));

  const orderMessage = [
    "Hi SG Xpress, I'd like to buy these Yard Sale items:",
    ...cart.map((i, n) => `${n + 1}. ${i.title}, ${jmd(i.price)} (ref ${ref(i)}, pick up ${i.branch})`),
    `Total: ${jmd(total)}`,
    "Are they still available?",
  ].join("\n");

  const select = "h-12 w-full rounded-xl border-2 border-line bg-white px-3 text-sm font-semibold focus:border-navy focus:outline-none";

  return (
    <div className="flex flex-col gap-5">
      {/* Search, filters and sorting */}
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4">
        <label className="sr-only" htmlFor="ys-search">Search the Yard Sale</label>
        <input
          id="ys-search"
          type="search"
          value={q}
          onChange={(e) => reset(setQ)(e.target.value)}
          placeholder="Search items, e.g. blender"
          className="h-12 w-full rounded-xl border-2 border-line px-4 text-base focus:border-navy focus:outline-none"
        />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {categories.length ? (
            <select aria-label="Category" className={select} value={category} onChange={(e) => reset(setCategory)(e.target.value)}>
              <option value="">All categories</option>
              {categories.map((x) => <option key={x}>{x}</option>)}
            </select>
          ) : null}
          <select aria-label="Condition" className={select} value={condition} onChange={(e) => reset(setCondition)(e.target.value)}>
            <option value="">Any condition</option>
            {conditions.map((x) => <option key={x}>{x}</option>)}
          </select>
          {usedBranches.length > 1 ? (
            <select aria-label="Pick-up branch" className={select} value={branch} onChange={(e) => reset(setBranch)(e.target.value)}>
              <option value="">All branches</option>
              {usedBranches.map((x) => <option key={x}>{x}</option>)}
            </select>
          ) : null}
          <select aria-label="Sort" className={select} value={sort} onChange={(e) => reset(setSort)(e.target.value as Sort)}>
            <option value="newest">Newest first</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </div>
        <p className="flex flex-wrap items-center gap-x-3 text-sm text-muted" aria-live="polite">
          {shown.length} item{shown.length === 1 ? "" : "s"}
          {filtering ? (
            <button
              type="button"
              className="font-semibold text-navy underline underline-offset-2"
              onClick={() => { setQ(""); setCategory(""); setCondition(""); setBranch(""); setPage(1); }}
            >
              Clear filters
            </button>
          ) : null}
        </p>
      </div>

      {notice ? <p role="alert" className="rounded-xl bg-gold-soft px-4 py-3 text-sm font-medium">{notice}</p> : null}

      {shown.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((item) => {
            const single = `Hi SG Xpress, I'd like to buy this Yard Sale item: ${item.title} (${jmd(item.price)}, ref ${ref(item)}). Is it still available?`;
            return (
              <li key={item.id} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white">
                <Gallery item={item} />
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h3 className="line-clamp-2 text-lg font-bold leading-snug" title={item.title}>{item.title}</h3>
                  <p className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-2xl font-extrabold">{jmd(item.price)}</span>
                    {item.wasPrice > item.price ? <s className="text-sm text-muted">was {jmd(item.wasPrice)}</s> : null}
                  </p>
                  <p className="flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-mist px-2.5 py-1">{item.condition}</span>
                    {item.category ? <span className="rounded-full bg-mist px-2.5 py-1">{item.category}</span> : null}
                    {item.branch ? <span className="rounded-full bg-mist px-2.5 py-1">Pick up: {item.branch}</span> : null}
                  </p>
                  {item.status !== "sold" && item.watching > 0 ? (
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-red-700">
                      <IconEye className="h-4 w-4" />
                      {item.watching} {item.watching === 1 ? "person" : "people"} watching
                    </p>
                  ) : null}
                  <Description text={item.description} />
                  <div className="mt-auto flex flex-col gap-2 pt-2">
                    {item.status === "sold" ? (
                      <p className="rounded-xl bg-mist px-3 py-3 text-center text-sm font-semibold">Sold</p>
                    ) : item.status === "reserved" ? (
                      <p className="rounded-xl bg-gold-soft px-3 py-3 text-center text-sm font-semibold">Reserved for another buyer</p>
                    ) : inCart(item.id) ? (
                      <button type="button" onClick={() => remove(item.id)} className="min-h-12 rounded-xl border-2 border-navy px-4 font-semibold">
                        ✓ In your cart · Remove
                      </button>
                    ) : (
                      <button type="button" onClick={() => add(item)} className="min-h-12 rounded-xl bg-navy px-4 font-semibold text-white hover:bg-navy-soft">
                        Add to cart
                      </button>
                    )}
                    {item.status === "available" ? (
                      <a
                        href={whatsappUrl(whatsapp, single)}
                        data-track="whatsapp_click"
                        data-track-location={`yard-sale-${item.id}`}
                        className="flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-whatsapp underline-offset-2 hover:underline"
                      >
                        <IconChat className="h-4 w-4" />
                        {buyLabel || "Buy on WhatsApp"}
                      </a>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-2xl border border-line bg-white p-6 text-center">No items match your search. Try other words or clear the filters.</p>
      )}

      {pages > 1 ? (
        <nav aria-label="Yard Sale pages" className="flex flex-wrap items-center justify-center gap-2">
          <button type="button" disabled={current === 1} onClick={() => setPage(current - 1)} className="min-h-11 rounded-xl border-2 border-line bg-white px-4 font-semibold disabled:opacity-40">‹ Previous</button>
          <span className="px-2 text-sm text-muted">Page {current} of {pages}</span>
          <button type="button" disabled={current === pages} onClick={() => setPage(current + 1)} className="min-h-11 rounded-xl border-2 border-line bg-white px-4 font-semibold disabled:opacity-40">Next ›</button>
        </nav>
      ) : null}

      {/* Cart bar, then the cart itself */}
      {cart.length ? (
        <>
          <div className="h-20" aria-hidden="true" />
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
              <p className="text-sm">
                <strong className="text-base">{cart.length} item{cart.length === 1 ? "" : "s"}</strong> · {jmd(total)}
              </p>
              <button type="button" onClick={() => setCartOpen(true)} className="min-h-12 rounded-xl bg-gold px-5 font-semibold text-navy">
                View cart
              </button>
            </div>
          </div>
        </>
      ) : null}

      {cartOpen ? (
        <div role="dialog" aria-modal="true" aria-label="Your cart" className="fixed inset-0 z-[60] flex items-end justify-center bg-navy-deep/60 sm:items-center sm:p-6" onClick={(e) => { if (e.target === e.currentTarget) setCartOpen(false); }}>
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white text-navy sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="text-lg font-bold">Your cart</h2>
              <button type="button" onClick={() => setCartOpen(false)} aria-label="Close cart" className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-mist">
                <IconClose className="h-5 w-5" />
              </button>
            </div>
            {cart.length ? (
              <>
                <ul className="flex-1 divide-y divide-line overflow-y-auto px-4">
                  {cart.map((i) => (
                    <li key={i.id} className="flex items-center gap-3 py-3">
                      <div className="relative h-16 w-16 flex-none overflow-hidden rounded-lg border border-line bg-white">
                        {i.images[0]?.src ? <Photo src={i.images[0].src} alt="" sizes="64px" small /> : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-semibold">{i.title}</p>
                        <p className="text-xs text-muted">Ref {ref(i)} · Pick up: {i.branch}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="whitespace-nowrap font-bold">{jmd(i.price)}</span>
                        <button type="button" onClick={() => remove(i.id)} className="text-xs font-semibold text-red-700">Remove</button>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col gap-3 border-t border-line bg-mist p-4">
                  <p className="flex items-baseline justify-between">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-2xl font-extrabold">{jmd(total)}</span>
                  </p>
                  <a
                    href={whatsappUrl(whatsapp, orderMessage)}
                    data-track="whatsapp_click"
                    data-track-location="yard-sale-cart"
                    className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-whatsapp px-4 font-semibold text-white hover:opacity-95"
                  >
                    <IconChat className="h-5 w-5" />
                    Send order on WhatsApp
                  </a>
                  <p className="text-xs text-muted">This sends us your list. Items are yours once we confirm they&apos;re still available.</p>
                  <button type="button" onClick={() => { setCartIds([]); setCartOpen(false); }} className="self-center text-sm font-semibold underline underline-offset-2">
                    Empty cart
                  </button>
                </div>
              </>
            ) : (
              <p className="p-6 text-center text-muted">Your cart is empty.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
