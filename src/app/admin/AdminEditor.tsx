"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { IconBox, IconClock, IconClose, IconExternal, IconGlobe, IconHelp, IconInfo, IconLogout, IconMail, IconMenu, IconPin, IconPlane, IconTag, IconUser, IconUsers } from "@/components/Icons";
import type { SiteContent } from "@/lib/content/schema";
import { FAQ_CATEGORIES, JOB_TYPES } from "@/lib/content/schema";
import { jmd, serviceChargeJmd } from "@/lib/rates";
import type { ActivityEntry } from "@/lib/activity";
import type { Application } from "@/lib/applications-shared";
import type { ContactMessage } from "@/lib/messages";
import type { AdminUser, StaffSummary } from "@/lib/staff";
import { AccountPanel } from "./AccountPanel";
import { ActivityPanel } from "./ActivityPanel";
import { ApplicationsPanel } from "./ApplicationsPanel";
import { StaffPanel } from "./StaffPanel";
import { deleteMessage, logout, save } from "./actions";

type Tab = "messages" | "applications" | "notice" | "air" | "fees" | "branches" | "faqs" | "china" | "careers" | "staff" | "activity" | "account";
const CONTENT_TABS: Tab[] = ["notice", "air", "fees", "branches", "faqs", "china", "careers"];
type Group = "Inbox" | "Website content" | "Admin" | "Account";
const TABS: { id: Tab; label: string; group: Group; description: string; icon: React.ReactNode; superadminOnly?: boolean }[] = [
  { id: "messages", label: "Messages", group: "Inbox", icon: <IconMail className="h-5 w-5" />, description: "Messages sent from the Contact page, newest first." },
  { id: "applications", label: "Applications", group: "Inbox", icon: <IconBox className="h-5 w-5" />, description: "Job applications from the Careers page. CVs are private to admin." },
  { id: "notice", label: "Notice bar", group: "Website content", icon: <IconInfo className="h-5 w-5" />, description: "The yellow bar at the top of every page." },
  { id: "air", label: "Air rates & schedule", group: "Website content", icon: <IconPlane className="h-5 w-5" />, description: "USA air rates by weight, the flight schedule and Florida warehouse hours." },
  { id: "fees", label: "Fees & other rates", group: "Website content", icon: <IconTag className="h-5 w-5" />, description: "Processing fees, storage, service charge, ocean and China rates." },
  { id: "branches", label: "Branches & contact", group: "Website content", icon: <IconPin className="h-5 w-5" />, description: "Opening hours, branches, phone and WhatsApp numbers, email and social links." },
  { id: "faqs", label: "FAQs", group: "Website content", icon: <IconHelp className="h-5 w-5" />, description: "Questions on the FAQs page. Tick “Show on homepage” for up to six." },
  { id: "china", label: "China addresses", group: "Website content", icon: <IconGlobe className="h-5 w-5" />, description: "The Air, Sea and Dangerous goods warehouse addresses on the China Direct page." },
  { id: "careers", label: "Careers", group: "Website content", icon: <IconUsers className="h-5 w-5" />, description: "Job openings on the Careers page. Untick “Accepting applications” to close a role." },
  { id: "staff", label: "Staff", group: "Admin", icon: <IconUsers className="h-5 w-5" />, description: "Add staff, reset passwords and switch accounts off.", superadminOnly: true },
  { id: "activity", label: "Activity", group: "Admin", icon: <IconClock className="h-5 w-5" />, description: "Who logged in, what they changed and when.", superadminOnly: true },
  { id: "account", label: "My account", group: "Account", icon: <IconUser className="h-5 w-5" />, description: "Your login details and password." },
];
const GROUPS: Group[] = ["Inbox", "Website content", "Admin"];

const input = "h-11 w-full rounded-lg border-2 border-line bg-white px-3 focus:border-navy focus:outline-none";
const card = "rounded-2xl border border-line bg-white p-4 md:p-5";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-semibold">{label}</span>
      {children}
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

function NumberInput({ value, onChange, label }: { value: number; onChange: (n: number) => void; label?: string }) {
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

export function AdminEditor({
  user,
  initial,
  version: initialVersion,
  messages: initialMessages,
  applications,
  staff,
  activity,
}: {
  user: AdminUser;
  initial: SiteContent;
  version: number;
  messages: ContactMessage[];
  applications: Application[];
  staff: StaffSummary[];
  activity: ActivityEntry[];
}) {
  const isSuper = user.role === "superadmin";
  const [c, setC] = useState<SiteContent>(initial);
  const [version, setVersion] = useState(initialVersion);
  const [tab, setTab] = useState<Tab>("messages");
  const [messages, setMessages] = useState(initialMessages);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [pending, startTransition] = useTransition();

  // Immutable update helper: edit(draft => { draft.x = y })
  function edit(fn: (draft: SiteContent) => void) {
    setC((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
    setDirty(true);
    setStatus(null);
  }

  function onSave() {
    startTransition(async () => {
      // Tidy "one per line" fields: drop blank lines and stray spaces.
      const lines = (list: string[]) => list.map((x) => x.trim()).filter(Boolean);
      const clean: SiteContent = {
        ...c,
        contact: { ...c.contact, phones: lines(c.contact.phones) },
        jobs: c.jobs.map((j) => ({ ...j, responsibilities: lines(j.responsibilities), requirements: lines(j.requirements) })),
      };
      const res = await save(clean, version);
      if (res.ok) {
        setDirty(false);
        setVersion(res.version);
        setStatus({ kind: "ok", text: `Saved. The website is updated (${new Date(res.savedAt).toLocaleTimeString()}).` });
      } else {
        setStatus({ kind: "error", text: res.error });
      }
    });
  }

  const tabs = TABS.filter((t) => isSuper || !t.superadminOnly);
  const newApplications = applications.filter((a) => a.status === "New").length;
  const current = tabs.find((t) => t.id === tab) ?? tabs[0];
  const [menuOpen, setMenuOpen] = useState(false);

  // Warn before closing the tab or reloading with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function go(t: Tab) {
    setTab(t);
    setMenuOpen(false);
    window.scrollTo({ top: 0 });
  }

  const navItem = (t: (typeof tabs)[number]) => (
    <button
      key={t.id}
      type="button"
      onClick={() => go(t.id)}
      aria-current={tab === t.id ? "page" : undefined}
      className={`flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition ${
        tab === t.id ? "bg-navy text-white" : "text-navy hover:bg-mist"
      }`}
    >
      <span className={tab === t.id ? "text-gold" : "text-muted"}>{t.icon}</span>
      <span className="flex-1">{t.label}</span>
      {t.id === "messages" && messages.length ? (
        <span className="rounded-full bg-gold px-2 py-0.5 text-xs font-bold text-navy">{messages.length}</span>
      ) : null}
      {t.id === "applications" && newApplications ? (
        <span className="rounded-full bg-gold px-2 py-0.5 text-xs font-bold text-navy" title="New applications">{newApplications}</span>
      ) : null}
    </button>
  );

  const sidebar = (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="px-2 pt-2">
        <Image src="/images/logo.png" alt="SG Xpress Shipping" width={640} height={199} className="h-10 w-auto" />
        <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted">Website admin</p>
      </div>
      <nav aria-label="Admin sections" className="flex flex-1 flex-col gap-3 overflow-y-auto">
        {GROUPS.map((g) => {
          const items = tabs.filter((t) => t.group === g);
          if (!items.length) return null;
          return (
            <div key={g} className="flex flex-col gap-0.5">
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted">{g}</p>
              {items.map(navItem)}
            </div>
          );
        })}
      </nav>
      {dirty ? (
        <p className="rounded-xl bg-gold-soft px-3 py-2 text-xs font-semibold text-gold-text">You have unsaved changes</p>
      ) : null}
      <div className="flex flex-col gap-1 border-t border-line pt-4">
        <button
          type="button"
          onClick={() => go("account")}
          aria-current={tab === "account" ? "page" : undefined}
          className={`flex items-center gap-3 rounded-xl px-3 py-2 text-left ${tab === "account" ? "bg-navy text-white" : "hover:bg-mist"}`}
        >
          <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-full ${tab === "account" ? "bg-gold text-navy" : "bg-mist text-navy"}`}>
            <IconUser className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{user.name}</span>
            <span className={`block text-xs ${tab === "account" ? "text-on-navy" : "text-muted"}`}>{isSuper ? "Superadmin" : "Staff"} · My account</span>
          </span>
        </button>
        <a href="/" target="_blank" rel="noopener" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold hover:bg-mist">
          <IconExternal className="h-5 w-5 text-muted" /> View website
        </a>
        <form action={logout}>
          <button type="submit" className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold hover:bg-mist">
            <IconLogout className="h-5 w-5 text-muted" /> Log out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[272px_1fr]">
      {/* Sidebar: fixed on large screens */}
      <aside className="sticky top-0 hidden h-screen border-r border-line bg-white lg:block">{sidebar}</aside>

      {/* Phone/tablet: top bar + slide-out menu */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-white px-4 py-3 lg:hidden">
        <Image src="/images/logo.png" alt="SG Xpress Shipping" width={640} height={199} className="h-9 w-auto" />
        <button type="button" onClick={() => setMenuOpen(true)} aria-label="Open admin menu" aria-expanded={menuOpen} className="flex h-11 w-11 items-center justify-center rounded-xl border border-line">
          <IconMenu className="h-6 w-6" />
        </button>
      </header>
      {menuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-navy-deep/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[85%] max-w-xs bg-white shadow-xl">
            <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl hover:bg-mist">
              <IconClose className="h-5 w-5" />
            </button>
            {sidebar}
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-col">
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-6 md:px-8 md:py-10">
        <div className="mb-2 flex items-start gap-3">
          <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-navy text-gold">{current.icon}</span>
          <div>
            <h1 className="text-2xl font-extrabold leading-tight md:text-3xl">{current.label}</h1>
            <p className="text-sm text-muted">{current.description}</p>
          </div>
        </div>
        {tab === "messages" && (
          <>
            {messages.length === 0 ? (
              <section className={card}>
                <h2 className="text-xl font-bold">No messages yet</h2>
                <p className="text-sm text-muted">Messages sent from the Contact page form appear here, newest first.</p>
              </section>
            ) : (
              messages.map((m) => (
                <article key={m.id} className={`${card} flex flex-col gap-2`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="text-lg font-bold">{m.name} <span className="font-normal text-muted">· {m.topic}</span></h2>
                    <time className="text-sm text-muted" dateTime={m.receivedAt}>{new Date(m.receivedAt).toLocaleString()}</time>
                  </div>
                  <p className="text-sm">
                    <a className="font-semibold underline" href={`mailto:${m.email}`}>{m.email}</a>
                    {m.phone ? <> · <a className="underline" href={`tel:${m.phone.replace(/[^\d+]/g, "")}`}>{m.phone}</a></> : null}
                    {m.sgxNumber ? <> · {m.sgxNumber}</> : null}
                  </p>
                  <p className="whitespace-pre-wrap rounded-xl bg-mist p-3 text-sm">{m.message}</p>
                  <div className="flex gap-2">
                    <a href={`mailto:${m.email}?subject=${encodeURIComponent("Re: your message to SG Xpress")}`} className="flex h-10 items-center rounded-lg bg-navy px-4 text-sm font-semibold text-white">Reply by email</a>
                    <button
                      type="button"
                      className="h-10 rounded-lg px-3 text-sm font-semibold text-red-700"
                      onClick={async () => {
                        if (!confirm(`Delete the message from ${m.name}?`)) return;
                        const res = await deleteMessage(m.id, `${m.name} (${m.email}): ${m.message.slice(0, 80)}`);
                        if (res.ok) setMessages((list) => list.filter((x) => x.id !== m.id));
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))
            )}
          </>
        )}

        {tab === "notice" && (
          <section className={`${card} flex flex-col gap-4`}>
            <h2 className="text-xl font-bold">Yellow notice bar</h2>
            <label className="flex items-center gap-3 font-semibold">
              <input type="checkbox" className="h-5 w-5" checked={c.notice.enabled} onChange={(e) => edit((d) => { d.notice.enabled = e.target.checked; })} />
              Show the notice bar on every page
            </label>
            <Field label="Message">
              <textarea rows={3} className={`${input} h-auto py-2`} value={c.notice.text} onChange={(e) => edit((d) => { d.notice.text = e.target.value; })} />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Link text" hint="Optional, e.g. Details">
                <input className={input} value={c.notice.linkLabel} onChange={(e) => edit((d) => { d.notice.linkLabel = e.target.value; })} />
              </Field>
              <Field label="Link goes to" hint="A page on this site, e.g. /faqs or /rates">
                <input className={input} value={c.notice.linkHref} onChange={(e) => edit((d) => { d.notice.linkHref = e.target.value; })} />
              </Field>
            </div>
          </section>
        )}

        {tab === "air" && (
          <section className={`${card} flex flex-col gap-4`}>
            <div>
              <h2 className="text-xl font-bold">USA Air freight (J$)</h2>
              <p className="text-sm text-muted">Freight only, by weight. These feed the homepage estimate, the Rates calculator and the rate table.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {c.airRates.map((r, i) => (
                <Field key={i} label={i === 0 ? "0.1–0.5 lb" : `${i} lb`}>
                  <NumberInput value={r} label={i === 0 ? "0.1 to 0.5 lb rate" : `${i} lb rate`} onChange={(n) => edit((d) => { d.airRates[i] = n; })} />
                </Field>
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Air transit time"><input className={input} value={c.usaAir.transit} onChange={(e) => edit((d) => { d.usaAir.transit = e.target.value; })} /></Field>
            </div>
          </section>
        )}

        {tab === "air" && (
          <section className={`${card} flex flex-col gap-4`}>
            <div>
              <h2 className="text-xl font-bold">USA air shipping schedule</h2>
              <p className="text-sm text-muted">Shown on the About page. The flight days also appear as “Flights Tue, Thu &amp; Sun” on the homepage and Rates page.</p>
            </div>
            {c.usaAir.schedule.map((r, i) => (
              <div key={i} className="grid gap-2 border-t border-line pt-3 sm:grid-cols-2 lg:grid-cols-[1fr_1.4fr_1fr_1fr_1fr_auto] lg:items-end">
                <Field label="Shipment"><input className={input} value={r.name} onChange={(e) => edit((d) => { d.usaAir.schedule[i].name = e.target.value; })} /></Field>
                <Field label="Warehouse cutoff"><input className={input} value={r.cutoff} onChange={(e) => edit((d) => { d.usaAir.schedule[i].cutoff = e.target.value; })} /></Field>
                <Field label="Flight day"><input className={input} value={r.flight} onChange={(e) => edit((d) => { d.usaAir.schedule[i].flight = e.target.value; })} /></Field>
                <Field label="Customs clearance"><input className={input} value={r.clearance} onChange={(e) => edit((d) => { d.usaAir.schedule[i].clearance = e.target.value; })} /></Field>
                <Field label="Collection day"><input className={input} value={r.collection} onChange={(e) => edit((d) => { d.usaAir.schedule[i].collection = e.target.value; })} /></Field>
                <button type="button" disabled={c.usaAir.schedule.length === 1} className="h-11 px-2 text-sm font-semibold text-red-700 disabled:opacity-40" onClick={() => edit((d) => { d.usaAir.schedule.splice(i, 1); })}>Remove</button>
              </div>
            ))}
            <button type="button" className="h-11 rounded-xl border-2 border-dashed border-line text-sm font-semibold" onClick={() => edit((d) => { d.usaAir.schedule.push({ name: `Flight ${d.usaAir.schedule.length + 1}`, cutoff: "", flight: "", clearance: "", collection: "" }); })}>
              + Add a flight
            </button>
          </section>
        )}

        {tab === "air" && (
          <section className={`${card} flex flex-col gap-4`}>
            <h2 className="text-xl font-bold">Florida warehouse operating hours</h2>
            {c.warehouseHours.map((h, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                <Field label="Day"><input className={input} value={h.days} onChange={(e) => edit((d) => { d.warehouseHours[i].days = e.target.value; })} /></Field>
                <Field label="Hours" hint={i === 0 ? 'Type "Closed" for closed days' : undefined}><input className={input} value={h.hours} onChange={(e) => edit((d) => { d.warehouseHours[i].hours = e.target.value; })} /></Field>
                <button type="button" disabled={c.warehouseHours.length === 1} className="h-11 px-2 text-sm font-semibold text-red-700 disabled:opacity-40" onClick={() => edit((d) => { d.warehouseHours.splice(i, 1); })}>Remove</button>
              </div>
            ))}
            <button type="button" className="h-11 rounded-xl border-2 border-dashed border-line text-sm font-semibold" onClick={() => edit((d) => { d.warehouseHours.push({ days: "", hours: "" }); })}>
              + Add a row
            </button>
          </section>
        )}

        {tab === "fees" && (
          <>
            <section className={`${card} flex flex-col gap-4`}>
              <h2 className="text-xl font-bold">Processing fee (J$ per package)</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Under 10 lb"><NumberInput value={c.processingFees.under10} onChange={(n) => edit((d) => { d.processingFees.under10 = n; })} /></Field>
                <Field label="10 lb and over"><NumberInput value={c.processingFees.from10} onChange={(n) => edit((d) => { d.processingFees.from10 = n; })} /></Field>
              </div>
            </section>
            <section className={`${card} flex flex-col gap-4`}>
              <div>
                <h2 className="text-xl font-bold">SG Xpress Service Charge</h2>
                <p className="text-sm text-muted">Charged on air and ocean shipments when the item value is over the threshold. Import duty is never shown on the website.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Percentage of item value (%)"><NumberInput value={c.serviceCharge.percent} onChange={(n) => edit((d) => { d.serviceCharge.percent = n; })} /></Field>
                <Field label="Applies to items over (US$)"><NumberInput value={c.serviceCharge.thresholdUsd} onChange={(n) => edit((d) => { d.serviceCharge.thresholdUsd = n; })} /></Field>
                <Field label="Exchange rate (J$ per US$1)" hint="Also converts ocean freight to J$."><NumberInput value={c.serviceCharge.jmdPerUsd} onChange={(n) => edit((d) => { d.serviceCharge.jmdPerUsd = n; })} /></Field>
              </div>
              <p className="rounded-xl bg-mist px-3 py-2 text-sm">
                Example: a US$200 item →{" "}
                <strong>{jmd(serviceChargeJmd(200, c.serviceCharge))}</strong>
                {200 > c.serviceCharge.thresholdUsd ? "" : " (below the threshold)"}
              </p>
            </section>
            <section className={`${card} flex flex-col gap-4`}>
              <h2 className="text-xl font-bold">Other charges</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Late invoice fee (J$)"><NumberInput value={c.fees.lateInvoice} onChange={(n) => edit((d) => { d.fees.lateInvoice = n; })} /></Field>
                <Field label="Storage fee per day (J$)"><NumberInput value={c.fees.storagePerDay} onChange={(n) => edit((d) => { d.fees.storagePerDay = n; })} /></Field>
                <Field label="Free storage days"><NumberInput value={c.fees.storageFreeDays} onChange={(n) => edit((d) => { d.fees.storageFreeDays = Math.round(n); })} /></Field>
                <Field label="Auctioned after (days)"><NumberInput value={c.fees.auctionDays} onChange={(n) => edit((d) => { d.fees.auctionDays = Math.round(n); })} /></Field>
              </div>
            </section>
            <section className={`${card} flex flex-col gap-4`}>
              <div>
                <h2 className="text-xl font-bold">USA Ocean</h2>
                <p className="text-sm text-muted">Volume rounds up to the next whole cubic foot. Ocean has no processing fee.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Rate per cubic foot (US$)" hint={`≈ ${jmd(Math.round(c.ocean.perCubicFootUsd * c.serviceCharge.jmdPerUsd))} at the exchange rate above`}>
                  <NumberInput value={c.ocean.perCubicFootUsd} onChange={(n) => edit((d) => { d.ocean.perCubicFootUsd = n; })} />
                </Field>
                <Field label="Transit time"><input className={input} value={c.ocean.transit} onChange={(e) => edit((d) => { d.ocean.transit = e.target.value; })} /></Field>
                <Field label="Small items: under (cubic feet)" hint="Below this volume, ocean is charged by weight instead.">
                  <NumberInput value={c.ocean.smallUnderCubicFeet} onChange={(n) => edit((d) => { d.ocean.smallUnderCubicFeet = n; })} />
                </Field>
                <Field label="Small items: rate (J$ per lb)"><NumberInput value={c.ocean.smallPerLb} onChange={(n) => edit((d) => { d.ocean.smallPerLb = n; })} /></Field>
              </div>
            </section>
            <section className={`${card} flex flex-col gap-4`}>
              <h2 className="text-xl font-bold">China Direct</h2>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Air price (US$ per lb)"><NumberInput value={c.china.airPerLbUsd} onChange={(n) => edit((d) => { d.china.airPerLbUsd = n; })} /></Field>
                <Field label="Air transit"><input className={input} value={c.china.airTransit} onChange={(e) => edit((d) => { d.china.airTransit = e.target.value; })} /></Field>
                <Field label="Sea transit"><input className={input} value={c.china.seaTransit} onChange={(e) => edit((d) => { d.china.seaTransit = e.target.value; })} /></Field>
              </div>
            </section>
          </>
        )}

        {tab === "branches" && (
          <>
            <section className={`${card} flex flex-col gap-4`}>
              <h2 className="text-xl font-bold">Opening hours</h2>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Weekdays"><input className={input} value={c.hours.weekdays} onChange={(e) => edit((d) => { d.hours.weekdays = e.target.value; })} /></Field>
                <Field label="Saturday"><input className={input} value={c.hours.saturday} onChange={(e) => edit((d) => { d.hours.saturday = e.target.value; })} /></Field>
                <Field label="Sunday"><input className={input} value={c.hours.sunday} onChange={(e) => edit((d) => { d.hours.sunday = e.target.value; })} /></Field>
              </div>
            </section>
            {c.branches.map((b, i) => (
              <section key={i} className={`${card} flex flex-col gap-4`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Branch {i + 1}</h2>
                  {c.branches.length > 1 ? (
                    <button type="button" className="text-sm font-semibold text-red-700" onClick={() => edit((d) => { d.branches.splice(i, 1); })}>Remove</button>
                  ) : null}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Name"><input className={input} value={b.name} onChange={(e) => edit((d) => { d.branches[i].name = e.target.value; })} /></Field>
                  <Field label="Phone"><input className={input} value={b.phone} onChange={(e) => edit((d) => { d.branches[i].phone = e.target.value; })} /></Field>
                  <Field label="Address"><input className={input} value={b.address} onChange={(e) => edit((d) => { d.branches[i].address = e.target.value; })} /></Field>
                  <Field label="Google Maps link" hint="Open the branch in Google Maps, tap Share, copy the link and paste it here">
                    <input className={input} type="url" value={b.mapsUrl} onChange={(e) => edit((d) => { d.branches[i].mapsUrl = e.target.value; })} />
                  </Field>
                </div>
              </section>
            ))}
            <button type="button" className="h-11 rounded-xl border-2 border-dashed border-line font-semibold" onClick={() => edit((d) => { d.branches.push({ name: "New branch", address: "", mapsUrl: "", phone: d.contact.phones[0] }); })}>
              + Add a branch
            </button>
            <section className={`${card} flex flex-col gap-4`}>
              <h2 className="text-xl font-bold">Contact details</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="General WhatsApp" hint="Floating button and general enquiries. Digits only, with country code, e.g. 18768794816">
                  <input className={input} inputMode="numeric" value={c.contact.whatsapp} onChange={(e) => edit((d) => { d.contact.whatsapp = e.target.value.replace(/\D/g, ""); })} />
                </Field>
                <Field label="China Help Desk WhatsApp" hint="All China Direct buttons. Digits only, e.g. 18763343323">
                  <input className={input} inputMode="numeric" value={c.contact.chinaWhatsapp} onChange={(e) => edit((d) => { d.contact.chinaWhatsapp = e.target.value.replace(/\D/g, ""); })} />
                </Field>
                <Field label="WhatsApp for barrel quotes & orders" hint="Digits only, with country code, e.g. 18768794816">
                  <input className={input} inputMode="numeric" value={c.contact.quotesWhatsapp} onChange={(e) => edit((d) => { d.contact.quotesWhatsapp = e.target.value.replace(/\D/g, ""); })} />
                </Field>
                <Field label="Email"><input className={input} type="email" value={c.contact.email} onChange={(e) => edit((d) => { d.contact.email = e.target.value; })} /></Field>
                <Field label="Phone numbers" hint="One per line">
                  <textarea rows={3} className={`${input} h-auto py-2`} value={c.contact.phones.join("\n")} onChange={(e) => edit((d) => { d.contact.phones = e.target.value.split("\n"); })} />
                </Field>
              </div>
            </section>
            <section className={`${card} flex flex-col gap-4`}>
              <div>
                <h2 className="text-xl font-bold">Social links</h2>
                <p className="text-sm text-muted">Full profile links. Leave one blank to hide its icon.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {(["facebook", "instagram", "x", "tiktok"] as const).map((k) => (
                  <Field key={k} label={{ facebook: "Facebook", instagram: "Instagram", x: "X (Twitter)", tiktok: "TikTok" }[k]}>
                    <input className={input} type="url" placeholder="https://" value={c.socials[k]} onChange={(e) => edit((d) => { d.socials[k] = e.target.value.trim(); })} />
                  </Field>
                ))}
              </div>
            </section>
          </>
        )}

        {tab === "faqs" && (
          <>
            <p className="text-sm text-muted">Tick “Show on homepage” for up to 6 FAQs. Every FAQ appears on the FAQs page under its topic.</p>
            {c.faqs.map((f, i) => (
              <section key={i} className={`${card} flex flex-col gap-3`}>
                <Field label="Question"><input className={input} value={f.q} onChange={(e) => edit((d) => { d.faqs[i].q = e.target.value; })} /></Field>
                <Field label="Answer" hint='For a bullet list, start each line with "- "'>
                  <textarea rows={4} className={`${input} h-auto py-2`} value={f.a} onChange={(e) => edit((d) => { d.faqs[i].a = e.target.value; })} />
                </Field>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    Topic
                    <select className={`${input} w-auto`} value={f.category} onChange={(e) => edit((d) => { d.faqs[i].category = e.target.value as typeof f.category; })}>
                      {FAQ_CATEGORIES.map((cat) => <option key={cat}>{cat}</option>)}
                    </select>
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input type="checkbox" className="h-5 w-5" checked={f.featured} onChange={(e) => edit((d) => { d.faqs[i].featured = e.target.checked; })} />
                    Show on homepage
                  </label>
                  <span className="flex-1" />
                  <button type="button" disabled={i === 0} className="h-9 rounded-lg border border-line px-3 text-sm disabled:opacity-40" onClick={() => edit((d) => { [d.faqs[i - 1], d.faqs[i]] = [d.faqs[i], d.faqs[i - 1]]; })}>↑ Up</button>
                  <button type="button" disabled={i === c.faqs.length - 1} className="h-9 rounded-lg border border-line px-3 text-sm disabled:opacity-40" onClick={() => edit((d) => { [d.faqs[i + 1], d.faqs[i]] = [d.faqs[i], d.faqs[i + 1]]; })}>↓ Down</button>
                  <button type="button" className="h-9 px-2 text-sm font-semibold text-red-700" onClick={() => edit((d) => { d.faqs.splice(i, 1); })}>Delete</button>
                </div>
              </section>
            ))}
            <button type="button" className="h-11 rounded-xl border-2 border-dashed border-line font-semibold" onClick={() => edit((d) => { d.faqs.push({ q: "New question", a: "Answer", category: "Getting started", featured: false }); })}>
              + Add a question
            </button>
          </>
        )}

        {tab === "china" && (
          <>
            {(["air", "sea", "dg"] as const).map((k) => (
              <section key={k} className={`${card} flex flex-col gap-3`}>
                <h2 className="text-xl font-bold">{k === "air" ? "Air warehouse" : k === "sea" ? "Sea warehouse" : "Dangerous goods warehouse"}</h2>
                {c.chinaWarehouses[k].map((f, i) => (
                  <div key={i} className="grid gap-2 md:grid-cols-[220px_1fr_auto] md:items-end">
                    <Field label="Label"><input className={input} value={f.label} onChange={(e) => edit((d) => { d.chinaWarehouses[k][i].label = e.target.value; })} /></Field>
                    <Field label="Value"><input className={input} value={f.value} onChange={(e) => edit((d) => { d.chinaWarehouses[k][i].value = e.target.value; })} /></Field>
                    <button type="button" className="h-11 px-2 text-sm font-semibold text-red-700" onClick={() => edit((d) => { d.chinaWarehouses[k].splice(i, 1); })}>Remove</button>
                  </div>
                ))}
                <button type="button" className="h-11 rounded-xl border-2 border-dashed border-line text-sm font-semibold" onClick={() => edit((d) => { d.chinaWarehouses[k].push({ label: "New line", value: "" }); })}>
                  + Add a line
                </button>
              </section>
            ))}
          </>
        )}
        {tab === "applications" && <ApplicationsPanel initial={applications} />}

        {tab === "careers" && (
          <>
            <button
              type="button"
              className="h-11 rounded-xl border-2 border-dashed border-line font-semibold"
              onClick={() =>
                edit((d) => {
                  d.jobs.unshift({
                    id: `position-${Math.random().toString(36).slice(2, 7)}`,
                    title: "New position",
                    department: "Customer Service",
                    location: d.branches[0]?.name ?? "Montego Bay",
                    type: "Full-time",
                    summary: "One or two sentences about the role.",
                    about: "",
                    responsibilities: [],
                    requirements: [],
                    closingDate: "",
                    postedAt: new Date().toISOString().slice(0, 10),
                    open: false,
                  });
                })
              }
            >
              + Add a job opening
            </button>
            {c.jobs.length === 0 ? <p className={`${card} text-sm text-muted`}>No job openings yet. The Careers page shows “No openings right now” and invites general applications.</p> : null}
            {c.jobs.map((j, i) => (
              <section key={i} className={`${card} flex flex-col gap-4`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-bold">{j.title || "Untitled position"}</h2>
                  <label className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${j.open ? "bg-whatsapp text-white" : "bg-mist"}`}>
                    <input type="checkbox" className="h-4 w-4" checked={j.open} onChange={(e) => edit((d) => { d.jobs[i].open = e.target.checked; })} />
                    {j.open ? "Accepting applications" : "Closed / draft"}
                  </label>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Job title"><input className={input} value={j.title} onChange={(e) => edit((d) => { d.jobs[i].title = e.target.value; })} /></Field>
                  <Field label="Page link" hint={`sgxpressja.com/careers/${j.id}`}>
                    <div className="flex gap-2">
                      <input className={input} value={j.id} onChange={(e) => edit((d) => { d.jobs[i].id = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"); })} />
                      <button type="button" className="h-11 flex-none rounded-lg border border-line px-3 text-sm font-semibold" onClick={() => edit((d) => { d.jobs[i].id = d.jobs[i].title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 70) || d.jobs[i].id; })}>
                        From title
                      </button>
                    </div>
                  </Field>
                  <Field label="Department"><input className={input} value={j.department} onChange={(e) => edit((d) => { d.jobs[i].department = e.target.value; })} /></Field>
                  <Field label="Location" hint="e.g. Church Street, Miriam Way (Clock), Florida warehouse">
                    <input className={input} value={j.location} onChange={(e) => edit((d) => { d.jobs[i].location = e.target.value; })} />
                  </Field>
                  <Field label="Type">
                    <select className={input} value={j.type} onChange={(e) => edit((d) => { d.jobs[i].type = e.target.value as (typeof JOB_TYPES)[number]; })}>
                      {JOB_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Posted"><input type="date" className={input} value={j.postedAt} onChange={(e) => edit((d) => { d.jobs[i].postedAt = e.target.value; })} /></Field>
                    <Field label="Apply by (optional)"><input type="date" className={input} value={j.closingDate} onChange={(e) => edit((d) => { d.jobs[i].closingDate = e.target.value; })} /></Field>
                  </div>
                </div>
                <Field label="Short summary" hint="Shown on the job card. One or two sentences.">
                  <textarea rows={2} className={`${input} h-auto py-2`} value={j.summary} onChange={(e) => edit((d) => { d.jobs[i].summary = e.target.value; })} />
                </Field>
                <Field label="About the role (optional)">
                  <textarea rows={4} className={`${input} h-auto py-2`} value={j.about} onChange={(e) => edit((d) => { d.jobs[i].about = e.target.value; })} />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="What you'll do" hint="One per line">
                    <textarea rows={5} className={`${input} h-auto py-2`} value={j.responsibilities.join("\n")} onChange={(e) => edit((d) => { d.jobs[i].responsibilities = e.target.value.split("\n"); })} />
                  </Field>
                  <Field label="What we're looking for" hint="One per line">
                    <textarea rows={5} className={`${input} h-auto py-2`} value={j.requirements.join("\n")} onChange={(e) => edit((d) => { d.jobs[i].requirements = e.target.value.split("\n"); })} />
                  </Field>
                </div>
                <div className="flex justify-end">
                  <button type="button" className="h-9 px-2 text-sm font-semibold text-red-700" onClick={() => { if (confirm(`Delete “${j.title}”? Applications already received are kept.`)) edit((d) => { d.jobs.splice(i, 1); }); }}>
                    Delete job
                  </button>
                </div>
              </section>
            ))}
          </>
        )}

        {tab === "staff" && isSuper && <StaffPanel initial={staff} superadminUsername={user.username} />}
        {tab === "activity" && isSuper && <ActivityPanel entries={activity} />}
        {tab === "account" && <AccountPanel user={user} />}
      </main>

      <div className={`sticky bottom-0 z-20 border-t border-line bg-white/95 backdrop-blur ${CONTENT_TABS.includes(tab) || dirty ? "" : "hidden"}`}>
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
          <p role="status" className={`text-sm ${status?.kind === "error" ? "font-semibold text-red-700" : "text-muted"}`}>
            {status?.text ?? (dirty ? "You have unsaved changes." : "No unsaved changes.")}
          </p>
          <button type="button" onClick={onSave} disabled={pending || !dirty} className="h-12 rounded-xl bg-gold px-6 font-semibold text-navy disabled:opacity-50">
            {pending ? "Saving…" : "Save and publish"}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
