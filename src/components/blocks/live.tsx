import type { ButtonValue, ImageValue, LinkValue } from "@/lib/blocks/fields";
import { fill } from "@/lib/blocks/tokens";
import { jmd, usd } from "@/lib/rates";
import { telHref, whatsappUrl } from "@/lib/site";
import { AirSchedule, WarehouseHours } from "../AirSchedule";
import { BranchCards } from "../BranchCards";
import { ChinaAddresses } from "../ChinaAddresses";
import { ContactForm } from "../ContactForm";
import { FaqExplorer } from "../FaqExplorer";
import { IconChat, IconClock, IconGlobe, IconMail, IconPhone } from "../Icons";
import { JobsBrowser } from "../JobsBrowser";
import { Inline } from "../Prose";
import { AirRateTables } from "../RatesAir";
import { ShippingCalculator } from "../ShippingCalculator";
import { SocialLinks } from "../SocialLinks";
import { Button, H2, Section } from "../ui";
import { FAQ_CATEGORY_LIST } from "@/lib/blocks/faq-categories";
import { LinkButton, MaybeLink, muted, Picture, TextLink, type BlockProps } from "./shared";
import { isJobOpen } from "@/lib/jobs";

// The "Live information" sections: their numbers and lists come from the admin settings,
// and their headings and labels from the page editor.

/** "(876) 879-4816" → "18768794816" for wa.me links. */
function waDigits(phone: string): string {
  const d = phone.replace(/\D/g, "");
  return d.length === 10 ? `1${d}` : d;
}
function formatWa(n: string): string {
  return n.length === 11 ? `(${n.slice(1, 4)}) ${n.slice(4, 7)}-${n.slice(7)}` : n;
}

export function AirRates({ p, c, anchor, tone }: BlockProps<{ heading: string; text: string }>) {
  return (
    <Section id={anchor} tone={tone}>
      {p.heading ? <H2>{fill(p.heading, c)}</H2> : null}
      {p.text ? <p className={`mt-2 ${muted(tone)}`}>{fill(p.text, c)}</p> : null}
      <AirRateTables airRates={c.airRates} />
    </Section>
  );
}

export function FeesTables({ p, c, anchor, tone }: BlockProps<Record<"heading" | "processingCaption" | "underLabel" | "overLabel" | "otherCaption" | "lateLabel" | "storageLabel" | "note", string>>) {
  const row = (label: string, value: string) => (
    <tr key={label}>
      <th scope="row" className="py-3 pr-4 text-left font-normal">{fill(label, c)}</th>
      <td className="whitespace-nowrap py-3 text-right font-semibold">{value}</td>
    </tr>
  );
  return (
    <Section id={anchor} tone={tone}>
      {p.heading ? <H2>{fill(p.heading, c)}</H2> : null}
      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <table className="w-full">
          <caption className="pb-2 text-left font-semibold">{fill(p.processingCaption, c)}</caption>
          <tbody className="divide-y divide-line border-y border-line">
            {row(p.underLabel, jmd(c.processingFees.under10))}
            {row(p.overLabel, jmd(c.processingFees.from10))}
          </tbody>
        </table>
        <table className="w-full">
          <caption className="pb-2 text-left font-semibold">{fill(p.otherCaption, c)}</caption>
          <tbody className="divide-y divide-line border-y border-line">
            {row(p.lateLabel, jmd(c.fees.lateInvoice))}
            {row(p.storageLabel, `${jmd(c.fees.storagePerDay)} / day`)}
          </tbody>
        </table>
      </div>
      {p.note ? <p className="mt-6 rounded-xl bg-gold-soft px-4 py-3 text-sm text-navy">{fill(p.note, c)}</p> : null}
    </Section>
  );
}

export function OceanRates({ p, c, id, anchor, tone }: BlockProps<{ heading: string; text: string; cuftLabel: string; smallLabel: string; after: string; buttons: ButtonValue[] }>) {
  return (
    <Section id={anchor} tone={tone}>
      {p.heading ? <H2>{fill(p.heading, c)}</H2> : null}
      {p.text ? <p className={`mt-2 ${muted(tone)}`}>{fill(p.text, c)}</p> : null}
      <div className="mt-6 grid grid-cols-2 gap-3 text-navy sm:max-w-lg">
        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="text-sm text-muted">{fill(p.cuftLabel, c)}</p>
          <p className="text-3xl font-extrabold">{usd(c.ocean.perCubicFootUsd)}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="text-sm text-muted">{fill(p.smallLabel, c)}</p>
          <p className="text-3xl font-extrabold">{jmd(c.ocean.smallPerLb)}<span className="text-sm font-medium"> /lb</span></p>
        </div>
      </div>
      {p.after ? <p className="mt-4"><Inline text={fill(p.after, c)} /></p> : null}
      {p.buttons.map((b, i) => <LinkButton key={i} b={b} c={c} where={id} className="mt-4 w-full sm:w-auto" />)}
    </Section>
  );
}

export function ChinaRates({ p, c, id, anchor, tone }: BlockProps<{ heading: string; airExtra: string; seaExtra: string; note: string; buttons: ButtonValue[]; image: ImageValue; imageLink: LinkValue }>) {
  return (
    <Section id={anchor} tone={tone}>
      <div className={`grid items-center gap-8 ${p.image.src ? "lg:grid-cols-[1fr_400px]" : ""}`}>
        <div>
          {p.heading ? <H2>{fill(p.heading, c)}</H2> : null}
          <table className="mt-6 w-full sm:max-w-xl">
            <thead>
              <tr className="border-b-2 border-navy text-sm">
                <td />
                <th scope="col" className="py-2 text-left">Air</th>
                <th scope="col" className="py-2 text-left">Sea</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line border-b border-line">
              <tr><th scope="row" className="py-3 text-left font-normal text-muted">Price</th><td className="font-semibold">US${c.china.airPerLbUsd} /lb</td><td className="font-semibold">Quote</td></tr>
              <tr><th scope="row" className="py-3 text-left font-normal text-muted">Time</th><td>{c.china.airTransit}</td><td>{c.china.seaTransit}</td></tr>
              <tr><th scope="row" className="py-3 text-left font-normal text-muted">Extra</th><td>{fill(p.airExtra, c)}</td><td>{fill(p.seaExtra, c)}</td></tr>
            </tbody>
          </table>
          {p.note ? <p className={`mt-4 ${muted(tone)}`}>{fill(p.note, c)}</p> : null}
          {p.buttons.map((b, i) => <LinkButton key={i} b={b} c={c} where={id} className="mt-4 w-full sm:w-auto" />)}
        </div>
        {p.image.src ? (
          <MaybeLink link={p.imageLink} c={c} where={`${id}-post`} label={p.image.alt} className="mx-auto block w-full max-w-md overflow-hidden rounded-2xl transition hover:opacity-95">
            <Picture image={p.image} sizes="(min-width: 1024px) 400px, 100vw" className="w-full" />
          </MaybeLink>
        ) : null}
      </div>
    </Section>
  );
}

export function ChinaOptions({ p, c, id, anchor, tone }: BlockProps<{
  heading: string; airTitle: string; airNote: string; airBest: string; airAvoid: string; seaTitle: string; seaPrice: string; seaNote: string; seaBest: string;
  seaButtons: ButtonValue[]; dgHeading: string; dgText: string; dgItems: { text: string }[]; dgLink: LinkValue; dgLinkLabel: string;
}>) {
  return (
    <Section id={anchor} tone={tone}>
      {p.heading ? <H2>{fill(p.heading, c)}</H2> : null}
      <div className="mt-6 grid gap-4 text-navy md:grid-cols-2">
        <article className="flex flex-col gap-3 rounded-2xl border-2 border-navy bg-white p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">{fill(p.airTitle, c)}</h3>
            <span className="rounded-full bg-navy px-3 py-1 text-sm font-semibold text-white">{c.china.airTransit}</span>
          </div>
          <p className="text-3xl font-extrabold">US${c.china.airPerLbUsd} <span className="text-base font-medium">per lb</span></p>
          {p.airNote ? <p className="text-sm text-muted">{fill(p.airNote, c)}</p> : null}
          <dl className="space-y-1 text-sm">
            {p.airBest ? <div className="flex gap-2"><dt className="w-20 flex-none font-semibold">Best for</dt><dd>{fill(p.airBest, c)}</dd></div> : null}
            {p.airAvoid ? <div className="flex gap-2"><dt className="w-20 flex-none font-semibold">Avoid</dt><dd>{fill(p.airAvoid, c)}</dd></div> : null}
          </dl>
        </article>
        <article className="flex flex-col gap-3 rounded-2xl border border-line bg-mist p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">{fill(p.seaTitle, c)}</h3>
            <span className="rounded-full bg-navy px-3 py-1 text-sm font-semibold text-white">{c.china.seaTransit}</span>
          </div>
          <p className="text-2xl font-extrabold">{fill(p.seaPrice, c)}</p>
          {p.seaNote ? <p className="text-sm text-muted">{fill(p.seaNote, c)}</p> : null}
          {p.seaBest ? (
            <dl className="text-sm">
              <div className="flex gap-2"><dt className="w-20 flex-none font-semibold">Best for</dt><dd>{fill(p.seaBest, c)}</dd></div>
            </dl>
          ) : null}
          {p.seaButtons.map((b, i) => <LinkButton key={i} b={b} c={c} where={`${id}-sea`} className="mt-auto" />)}
        </article>
      </div>
      {p.dgHeading ? (
        <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-navy p-5 text-white">
          <h3 className="text-xl font-bold">{fill(p.dgHeading, c)}</h3>
          {p.dgText ? <p className="text-sm text-on-navy">{fill(p.dgText, c)}</p> : null}
          {p.dgItems.length ? (
            <ul className="grid grid-cols-3 gap-2 sm:max-w-md">
              {p.dgItems.map((x, i) => <li key={i} className="rounded-xl bg-white/10 px-3 py-2.5 text-sm font-semibold">{fill(x.text, c)}</li>)}
            </ul>
          ) : null}
          <TextLink link={p.dgLink} label={p.dgLinkLabel} c={c} where={`${id}-dg`} className="inline-flex min-h-11 items-center font-semibold text-gold" />
        </div>
      ) : null}
    </Section>
  );
}

export function ChinaAddressesBlock({ p, c, anchor, tone }: BlockProps<{ heading: string; intro: string; airImage: ImageValue; seaImage: ImageValue; dgImage: ImageValue }>) {
  return (
    <Section id={anchor} tone={tone}>
      {p.heading ? <H2>{fill(p.heading, c)}</H2> : null}
      {p.intro ? <p className={`mb-6 mt-2 ${muted(tone)}`}>{fill(p.intro, c)}</p> : <div className="mb-6" />}
      <div className="text-navy">
        <ChinaAddresses warehouses={c.chinaWarehouses} images={{ air: p.airImage, sea: p.seaImage, dg: p.dgImage }} />
      </div>
    </Section>
  );
}

export function AirScheduleBlock({ p, c, anchor, tone }: BlockProps<{ heading: string; intro: string }>) {
  return (
    <Section id={anchor} tone={tone}>
      {p.heading ? <H2>{fill(p.heading, c)}</H2> : null}
      {p.intro ? <p className={`mb-6 mt-2 ${muted(tone)}`}>{fill(p.intro, c)}</p> : <div className="mb-6" />}
      <div className="text-navy"><AirSchedule content={c} /></div>
    </Section>
  );
}

export function WarehouseHoursBlock({ p, c, anchor, tone }: BlockProps<{ heading: string }>) {
  return (
    <Section id={anchor} tone={tone}>
      {p.heading ? <H2>{fill(p.heading, c)}</H2> : null}
      <div className="mt-4 text-navy"><WarehouseHours content={c} /></div>
    </Section>
  );
}

export function BranchCardsBlock({ p, c, anchor, tone }: BlockProps<{ heading: string }>) {
  return (
    <Section id={anchor} tone={tone}>
      {p.heading ? <H2>{fill(p.heading, c)}</H2> : null}
      <div className="mt-6 text-navy"><BranchCards content={c} /></div>
    </Section>
  );
}

export function BranchLinks({ p, c, id, anchor, tone }: BlockProps<{ heading: string }>) {
  return (
    <Section id={anchor} tone={tone}>
      {p.heading ? <H2>{fill(p.heading, c)}</H2> : null}
      <p className={`mt-2 ${muted(tone)}`}>{c.hours.weekdays} · {c.hours.saturday} · {c.hours.sunday}</p>
      <div className="mt-4 grid gap-3 text-navy md:grid-cols-2">
        {c.branches.map((b) => (
          <a key={b.name} href={b.mapsUrl} data-track="directions_click" data-track-location={`${id}-${b.name}`} className="flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3">
            <span>
              <strong className="block">{b.name}</strong>
              <span className="text-sm text-muted">{b.address}</span>
            </span>
            <span className="whitespace-nowrap text-sm font-semibold">Directions →</span>
          </a>
        ))}
      </div>
    </Section>
  );
}

export function Calculator({ p, c, id, anchor, tone }: BlockProps<{ buttons: ButtonValue[]; footnote: string }>) {
  return (
    <Section id={anchor} tone={tone}>
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <ShippingCalculator
          id="calc"
          airRates={c.airRates}
          fees={c.processingFees}
          serviceCharge={c.serviceCharge}
          ocean={c.ocean}
          whatsappHref={whatsappUrl(c.contact.whatsapp, "Hi SG Xpress, I need a price for a package over 50 lb")}
        />
        {p.buttons.length ? (
          <div className="flex flex-col gap-3 sm:flex-row">
            {p.buttons.map((b, i) => <LinkButton key={i} b={b} c={c} where={id} className="flex-1" />)}
          </div>
        ) : null}
        {p.footnote ? <p className={`text-center text-sm ${muted(tone)}`}><Inline text={fill(p.footnote, c)} /></p> : null}
      </div>
    </Section>
  );
}

export function FaqExplorerBlock({ p, c, anchor, tone }: BlockProps<{ footnote: string }>) {
  return (
    <Section id={anchor} tone={tone} className="!pt-8">
      <div className="text-navy"><FaqExplorer faqs={c.faqs} categories={FAQ_CATEGORY_LIST} /></div>
      {p.footnote ? <p className={`mt-8 text-center text-sm ${muted(tone)}`}><Inline text={fill(p.footnote, c)} /></p> : null}
    </Section>
  );
}

export function HelpContacts({ p, c, id, anchor, tone }: BlockProps<{ heading: string; intro: string }>) {
  return (
    <Section id={anchor} tone={tone}>
      {p.heading ? <H2>{fill(p.heading, c)}</H2> : null}
      {p.intro ? <p className={`mt-2 ${muted(tone)}`}>{fill(p.intro, c)}</p> : null}
      <div className="mt-6 grid gap-3 text-navy sm:grid-cols-2 lg:grid-cols-4">
        {c.branches.map((b) => (
          <a key={b.name} href={telHref(b.phone)} data-track="call_click" data-track-location={`${id}-${b.name}`} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4">
            <IconPhone className="h-6 w-6 flex-none" />
            <span>
              <strong className="block">{b.name}</strong>
              <span className="text-sm text-muted">{b.phone}</span>
            </span>
          </a>
        ))}
        <a href={whatsappUrl(c.contact.chinaWhatsapp)} data-track="whatsapp_click" data-track-location={id} className="flex items-center gap-3 rounded-2xl bg-whatsapp p-4 text-white">
          <IconChat className="h-6 w-6 flex-none" />
          <span>
            <strong className="block">China Help Desk</strong>
            <span className="text-sm">WhatsApp {formatWa(c.contact.chinaWhatsapp).replace(/^\((\d{3})\) /, "$1-")}</span>
          </span>
        </a>
        <a href={`mailto:${c.contact.email}`} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4">
          <IconMail className="h-6 w-6 flex-none" />
          <span>
            <strong className="block">Email</strong>
            <span className="text-sm text-muted">{c.contact.email}</span>
          </span>
        </a>
      </div>
    </Section>
  );
}

// ---- Contact page panel ----
function ContactRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl border border-white/20 bg-white/10 text-gold">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-on-navy">{label}</p>
        <div className="mt-1">{children}</div>
      </div>
    </div>
  );
}

function NumberActions({ display, tel, wa, where, label }: { display: string; tel: string; wa: string; where: string; label?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <span className="text-lg font-semibold text-white">
        {label ? <span className="block text-sm font-medium text-on-navy">{label}</span> : null}
        {display}
      </span>
      <span className="flex gap-1.5">
        <a href={tel} data-track="call_click" data-track-location={where} className="flex h-9 items-center gap-1 rounded-lg bg-white/10 px-3 text-sm font-semibold text-white hover:bg-white/20">
          <IconPhone className="h-3.5 w-3.5" /> Call
        </a>
        <a href={wa} data-track="whatsapp_click" data-track-location={where} className="flex h-9 items-center gap-1 rounded-lg bg-whatsapp px-3 text-sm font-semibold text-white hover:brightness-110">
          <IconChat className="h-3.5 w-3.5" /> WhatsApp
        </a>
      </span>
    </div>
  );
}

export function ContactPanel({ p, c, anchor, tone }: BlockProps<{ heading: string; highlight: string; formHeading: string; formIntro: string }>) {
  const china = c.contact.chinaWhatsapp;
  const bg = { white: "bg-white", mist: "bg-mist", navy: "bg-navy", gold: "bg-gold" }[tone];
  return (
    <section id={anchor} className={`${bg} py-8 md:py-14`}>
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="grid overflow-hidden rounded-3xl bg-white text-navy shadow-xl shadow-navy-deep/10 lg:grid-cols-[400px_1fr]">
          <div className="flex flex-col gap-6 bg-navy p-6 text-white md:p-10">
            <h1 className="text-3xl font-extrabold leading-tight md:text-4xl">
              {fill(p.heading, c)} {p.highlight ? <span className="text-gold">{fill(p.highlight, c)}</span> : null}
            </h1>
            <ContactRow icon={<IconPhone className="h-5 w-5" />} label="Call or WhatsApp">
              <div className="flex flex-col gap-3">
                {c.contact.phones.map((ph) => {
                  // Label each number with the branch it belongs to (e.g. Church Street, Clock Mobay).
                  const branch = c.branches.find((b) => waDigits(b.phone) === waDigits(ph));
                  const label = branch ? branch.contactLabel || branch.name : undefined;
                  return <NumberActions key={ph} display={ph} label={label} tel={telHref(ph)} wa={whatsappUrl(waDigits(ph))} where="contact-main" />;
                })}
              </div>
            </ContactRow>
            <ContactRow icon={<IconGlobe className="h-5 w-5" />} label="China Help Desk">
              <NumberActions display={formatWa(china)} tel={telHref(china)} wa={whatsappUrl(china, "Hi SG Xpress, I need help with a China order")} where="contact-china" />
            </ContactRow>
            <ContactRow icon={<IconMail className="h-5 w-5" />} label="Email">
              <a href={`mailto:${c.contact.email}`} className="break-all text-lg font-semibold text-white hover:underline">{c.contact.email}</a>
            </ContactRow>
            <ContactRow icon={<IconClock className="h-5 w-5" />} label="Opening hours">
              <ul className="space-y-1 font-medium text-white">
                <li>{c.hours.weekdays}</li>
                <li>{c.hours.saturday}</li>
                <li>{c.hours.sunday}</li>
              </ul>
            </ContactRow>
            <div className="mt-auto border-t border-white/20 pt-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-on-navy">Follow us</p>
              <SocialLinks socials={c.socials} tone="light" />
            </div>
          </div>
          <div className="p-6 md:p-10 lg:p-12">
            <h2 className="text-3xl font-extrabold leading-tight md:text-4xl">{fill(p.formHeading, c)}</h2>
            {p.formIntro ? <p className="mb-8 mt-2 max-w-lg text-muted">{fill(p.formIntro, c)}</p> : <div className="mb-8" />}
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}

export function Jobs({ p, c, anchor, tone }: BlockProps<{ heading: string; emptyTitle: string; emptyText: string; moreHeading: string; moreText: string; applyLabel: string; moreButton: string }>) {
  const open = c.jobs.filter((j) => isJobOpen(j)).sort((a, b) => b.postedAt.localeCompare(a.postedAt));
  return (
    <>
      <Section id={anchor} tone={tone}>
        {p.heading ? <H2>{fill(p.heading, c)}</H2> : null}
        <p className={`mb-6 mt-2 ${muted(tone)}`}>
          {open.length ? `${open.length} open position${open.length === 1 ? "" : "s"}. Choose one to see the details and apply.` : "Find a role that fits you."}
        </p>
        {open.length ? (
          <div className="text-navy"><JobsBrowser jobs={open} /></div>
        ) : (
          <div className="rounded-2xl border border-line bg-white p-6 text-navy md:p-8">
            <h3 className="text-xl font-bold">{fill(p.emptyTitle, c)}</h3>
            <p className="mt-2 text-muted">{fill(p.emptyText, c)}</p>
            <Button href="/careers/apply" className="mt-4">{fill(p.applyLabel, c) || "Send a general application"}</Button>
          </div>
        )}
      </Section>
      {open.length && p.moreHeading ? (
        <Section>
          <div className="flex flex-col gap-4 rounded-2xl bg-navy p-6 text-white md:flex-row md:items-center md:justify-between md:p-8">
            <div>
              <h2 className="text-2xl font-extrabold">{fill(p.moreHeading, c)}</h2>
              {p.moreText ? <p className="mt-1 text-on-navy">{fill(p.moreText, c)}</p> : null}
            </div>
            <Button href="/careers/apply" variant="gold" className="flex-none">{fill(p.moreButton, c) || "Apply anyway"}</Button>
          </div>
        </Section>
      ) : null}
    </>
  );
}
