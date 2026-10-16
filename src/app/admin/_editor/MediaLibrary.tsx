"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { IconClose } from "@/components/Icons";
import type { ImageValue } from "@/lib/blocks/fields";
import type { LibraryImage } from "@/lib/media";
import { deleteMediaItem, setMediaAlt, uploadMedia } from "../actions";
import { inputCls } from "./FieldEditors";
import { Pager, usePager } from "./ListTools";

// The media library: upload pictures, describe them, delete unused ones, and pick one
// for a section. Uploaded pictures are listed first, then the ones the site came with.

const btn = "inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold";

function kb(bytes?: number) {
  if (!bytes) return "";
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

function Uploader({ onUploaded }: { onUploaded: (img: LibraryImage) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [alt, setAlt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function upload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return setError("Choose a picture first.");
    if (file.size > 5 * 1024 * 1024) return setError("That picture is larger than 5 MB. Please use a smaller one.");
    const form = new FormData();
    form.set("file", file);
    form.set("alt", alt);
    setError(null);
    start(async () => {
      const res = await uploadMedia(form);
      if (res.ok) {
        onUploaded(res.image);
        setAlt("");
        if (fileRef.current) fileRef.current.value = "";
      } else setError(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border-2 border-dashed border-line bg-white p-4">
      <p className="font-semibold">Upload a new picture</p>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="text-sm" />
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-semibold">Describe the picture</span>
        <input className={inputCls} maxLength={300} value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="e.g. Poster: we ship weekly from China" />
        <span className="text-xs text-muted">JPG, PNG, WebP or GIF, up to 5 MB. Large photos are resized automatically.</span>
      </label>
      {error ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
      <button type="button" onClick={upload} disabled={pending} className={`${btn} self-start bg-navy text-white disabled:opacity-60`}>
        {pending ? "Uploading…" : "Upload"}
      </button>
    </div>
  );
}

function Grid({ images, onChoose, selectedSrc }: { images: LibraryImage[]; onChoose: (img: LibraryImage) => void; selectedSrc?: string }) {
  const [query, setQuery] = useState("");
  const matches = query.trim() ? images.filter((i) => `${i.name} ${i.alt}`.toLowerCase().includes(query.trim().toLowerCase())) : images;
  const pager = usePager(matches, 24);
  if (!images.length) return <p className="text-sm text-muted">No pictures yet.</p>;
  return (
    <div className="flex flex-col gap-3">
      {images.length > 12 ? (
        <input type="search" className={inputCls} placeholder="Search by file name or description…" value={query} onChange={(e) => { setQuery(e.target.value); pager.setPage(1); }} aria-label="Search pictures" />
      ) : null}
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {pager.items.map((img) => (
        <li key={img.src}>
          <button
            type="button"
            onClick={() => onChoose(img)}
            className={`flex w-full flex-col overflow-hidden rounded-xl border-2 bg-white text-left ${selectedSrc === img.src ? "border-navy" : "border-line hover:border-navy"}`}
          >
            <span className="flex aspect-square items-center justify-center bg-mist">
              <Image src={img.src} alt="" width={240} height={240} unoptimized className="h-full w-full object-contain" />
            </span>
            <span className="truncate px-2 py-1.5 text-xs">{img.name}</span>
          </button>
        </li>
      ))}
    </ul>
      <Pager page={pager.page} pages={pager.pages} onChange={pager.setPage} total={matches.length} perPage={24} label="pictures" />
    </div>
  );
}

/** The "Choose picture" window used by every picture field. */
export function MediaPicker({ images, onUploaded, onPick, onClose }: { images: LibraryImage[]; onUploaded: (img: LibraryImage) => void; onPick: (img: ImageValue) => void; onClose: () => void }) {
  const uploaded = images.filter((i) => !i.builtin);
  const builtin = images.filter((i) => i.builtin);
  const choose = (img: LibraryImage) => onPick({ src: img.src, alt: img.alt, width: img.width, height: img.height });
  return (
    <div role="dialog" aria-modal="true" aria-label="Choose a picture" className="fixed inset-0 z-[60] flex items-end justify-center bg-navy-deep/60 p-0 sm:items-center sm:p-6">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl bg-mist sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-line bg-white px-4 py-3">
          <h2 className="text-lg font-bold">Choose a picture</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-mist">
            <IconClose className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col gap-5 overflow-y-auto p-4">
          <Uploader onUploaded={(img) => { onUploaded(img); choose(img); }} />
          <section>
            <h3 className="mb-2 font-semibold">Your uploads</h3>
            <Grid images={uploaded} onChoose={choose} />
          </section>
          <section>
            <h3 className="mb-2 font-semibold">Pictures that came with the website</h3>
            <Grid images={builtin} onChoose={choose} />
          </section>
        </div>
      </div>
    </div>
  );
}

/** The Media library page in the admin. */
export function MediaLibrary({ images, setImages, readOnly }: { images: LibraryImage[]; setImages: (fn: (prev: LibraryImage[]) => LibraryImage[]) => void; readOnly: boolean }) {
  const [selected, setSelected] = useState<LibraryImage | null>(null);
  const [alt, setAlt] = useState("");
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const uploaded = images.filter((i) => !i.builtin);
  const builtin = images.filter((i) => i.builtin);

  function pick(img: LibraryImage) {
    setSelected(img);
    setAlt(img.alt);
    setMessage(null);
  }
  function saveAlt() {
    if (!selected?.id) return;
    start(async () => {
      const res = await setMediaAlt(selected.id!, alt);
      if (res.ok) {
        setImages((prev) => prev.map((i) => (i.id === selected.id ? { ...i, alt } : i)));
        setMessage({ kind: "ok", text: "Description saved. Pictures already placed on pages keep their own description." });
      } else setMessage({ kind: "error", text: "Couldn't save the description." });
    });
  }
  function remove() {
    if (!selected?.id || !confirm(`Delete “${selected.name}”? This can't be undone.`)) return;
    start(async () => {
      const res = await deleteMediaItem(selected.id!, selected.src.replace("/media/", ""));
      if (res.ok) {
        setImages((prev) => prev.filter((i) => i.id !== selected.id));
        setSelected(null);
        setMessage({ kind: "ok", text: "Picture deleted." });
      } else setMessage({ kind: "error", text: res.error });
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {readOnly ? null : <Uploader onUploaded={(img) => { setImages((prev) => [img, ...prev]); pick(img); }} />}
      {message ? <p role="status" className={`rounded-lg px-3 py-2 text-sm ${message.kind === "ok" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>{message.text}</p> : null}
      {selected ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-4 md:flex-row">
          <Image src={selected.src} alt="" width={240} height={240} unoptimized className="h-40 w-40 flex-none rounded-xl bg-mist object-contain" />
          <div className="flex flex-1 flex-col gap-2 text-sm">
            <p className="font-semibold">{selected.name}</p>
            <p className="text-muted">
              {selected.width && selected.height ? `${selected.width} × ${selected.height} px` : ""} {kb(selected.size)}
              {selected.uploadedAt ? ` · uploaded ${new Date(selected.uploadedAt).toLocaleDateString()}` : " · came with the website"}
            </p>
            <p className="break-all text-xs text-muted">{selected.src}</p>
            {selected.builtin ? (
              <p className="text-muted">Built-in pictures can be used on any page but not changed or deleted here.</p>
            ) : (
              <>
                <label className="flex flex-col gap-1">
                  <span className="font-semibold">Description</span>
                  <input className={inputCls} maxLength={300} value={alt} onChange={(e) => setAlt(e.target.value)} />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={saveAlt} disabled={pending || readOnly} className={`${btn} bg-navy text-white disabled:opacity-60`}>Save description</button>
                  <button type="button" onClick={remove} disabled={pending || readOnly} className={`${btn} border-2 border-red-700 text-red-700 disabled:opacity-60`}>Delete picture</button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
      <section>
        <h3 className="mb-2 font-semibold">Your uploads ({uploaded.length})</h3>
        <Grid images={uploaded} onChoose={pick} selectedSrc={selected?.src} />
      </section>
      <section>
        <h3 className="mb-2 font-semibold">Pictures that came with the website ({builtin.length})</h3>
        <Grid images={builtin} onChoose={pick} selectedSrc={selected?.src} />
      </section>
    </div>
  );
}
