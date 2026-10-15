"use client";

import Image from "next/image";
import { useState } from "react";

type Field = { label: string; value: string };
type Key = "air" | "sea" | "dg";

const TABS: { key: Key; label: string; image: string; alt: string }[] = [
  { key: "air", label: "Air", image: "/images/label-air-2026-10.jpg", alt: "China Air Warehouse shipping label template" },
  { key: "sea", label: "Sea", image: "/images/label-sea-2026-10.jpg", alt: "China Sea Warehouse shipping label template" },
  { key: "dg", label: "Dangerous", image: "/images/label-dg-2026-10b.jpg", alt: "Dangerous Goods warehouse shipping label template" },
];

export function ChinaAddresses({ warehouses }: { warehouses: Record<Key, Field[]> }) {
  const [tab, setTab] = useState<Key>("air");
  const [copied, setCopied] = useState<string | null>(null);
  const current = TABS.find((t) => t.key === tab)!;

  async function copy(field: Field) {
    try {
      await navigator.clipboard.writeText(field.value);
      setCopied(`${tab}:${field.label}`);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard blocked (e.g. insecure context): the text stays selectable.
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <div>
        <div role="tablist" aria-label="Warehouse" className="grid grid-cols-3 gap-1 rounded-xl bg-mist p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              id={`tab-${t.key}`}
              aria-selected={tab === t.key}
              aria-controls="china-address-panel"
              onClick={() => setTab(t.key)}
              className={`h-11 rounded-lg text-sm font-semibold ${tab === t.key ? "bg-navy text-white" : "text-navy"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div id="china-address-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line">
          {warehouses[tab].map((f) => {
            const done = copied === `${tab}:${f.label}`;
            return (
              <div key={f.label} className="flex items-center gap-3 py-3 pl-4 pr-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">{f.label}</p>
                  <p className="break-words font-medium">{f.value}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copy(f)}
                  aria-label={`Copy ${f.label}`}
                  className="h-10 min-w-16 flex-none rounded-lg border border-[#c9d0dd] px-3 text-sm font-semibold"
                >
                  {done ? "Copied" : "Copy"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <figure>
        <Image src={current.image} alt={current.alt} width={760} height={760} sizes="(min-width: 1024px) 520px, 100vw" className="w-full rounded-2xl" />
        <figcaption className="mt-2 text-sm text-muted">Shipping label to show your supplier. Tap and hold to save it.</figcaption>
      </figure>
    </div>
  );
}
