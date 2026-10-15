import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { RatesAir } from "@/components/RatesAir";
import { Button, H2, PageTitle, Section } from "@/components/ui";
import { getContent } from "@/lib/content/store";
import { flightDays, jmd, usd } from "@/lib/rates";
import { REGISTER_URL, whatsappUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shipping rates",
  description: "USA Air rates by weight, processing fees, USA Ocean, China Direct and barrel shipping prices in Jamaican dollars.",
};

const JUMP = [
  { href: "#air", label: "USA Air" },
  { href: "#fees", label: "Fees" },
  { href: "#ocean", label: "USA Ocean" },
  { href: "#china", label: "China" },
  { href: "#barrels", label: "Barrels" },
];

export default async function RatesPage() {
  const c = await getContent();
  const wa = c.contact.whatsapp;
  const pf = c.processingFees;

  const feeRow = (label: string, value: string) => (
    <tr key={label}>
      <th scope="row" className="py-3 pr-4 text-left font-normal">{label}</th>
      <td className="whitespace-nowrap py-3 text-right font-semibold">{value}</td>
    </tr>
  );

  return (
    <>
      <PageTitle title="Shipping rates">
        <Button href="/calculator" variant="gold" className="mt-5">Estimate your cost →</Button>
      </PageTitle>

      <nav aria-label="On this page" className="sticky top-16 z-30 border-b border-line bg-white md:top-20">
        <ul className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-2.5 md:px-6">
          {JUMP.map((j) => (
            <li key={j.href} className="flex-none">
              <a href={j.href} className="flex h-10 items-center rounded-full border border-line px-4 text-sm font-semibold hover:bg-mist">{j.label}</a>
            </li>
          ))}
        </ul>
      </nav>

      <RatesAir airRates={c.airRates} airMeta={`${c.usaAir.transit}, flights ${flightDays(c.usaAir.schedule)}`} />

      <Section id="fees">
        <H2>On top of freight</H2>
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <table className="w-full">
            <caption className="pb-2 text-left font-semibold">Processing fee (per package)</caption>
            <tbody className="divide-y divide-line border-y border-line">
              {feeRow("Under 10 lb", jmd(pf.under10))}
              {feeRow("10 lb and over", jmd(pf.from10))}
            </tbody>
          </table>
          <table className="w-full">
            <caption className="pb-2 text-left font-semibold">Other charges</caption>
            <tbody className="divide-y divide-line border-y border-line">
              {feeRow("Late invoice (after clearance day)", jmd(c.fees.lateInvoice))}
              {feeRow(`Storage after ${c.fees.storageFreeDays} days`, `${jmd(c.fees.storagePerDay)} / day`)}
            </tbody>
          </table>
        </div>
        <p className="mt-6 rounded-xl bg-gold-soft px-4 py-3 text-sm">
          Packages not collected within {c.fees.auctionDays} days are auctioned to cover costs.
        </p>
      </Section>

      <Section id="ocean" tone="mist">
        <H2>Weightless sea freight</H2>
        <p className="mt-2 text-muted">Weekly sailings, {c.ocean.transit}. Priced by size, not weight.</p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:max-w-lg">
          <div className="rounded-2xl border border-line bg-white p-4">
            <p className="text-sm text-muted">Per cubic foot</p>
            <p className="text-3xl font-extrabold">{usd(c.ocean.perCubicFootUsd)}</p>
          </div>
          <div className="rounded-2xl border border-line bg-white p-4">
            <p className="text-sm text-muted">Under {c.ocean.smallUnderCubicFeet} cubic foot</p>
            <p className="text-3xl font-extrabold">{jmd(c.ocean.smallPerLb)}<span className="text-sm font-medium"> /lb</span></p>
          </div>
        </div>
        <p className="mt-4"><strong>Commercial rates available</strong> for businesses and large volumes. Conditions apply.</p>
        <Button href={whatsappUrl(wa, "Hi SG Xpress, I'd like an ocean freight quote")} className="mt-4 w-full sm:w-auto" track="whatsapp_click" trackLocation="rates-ocean">
          Ask about commercial rates
        </Button>
      </Section>

      <Section id="china">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_400px]">
          <div>
            <H2>Shipping from China</H2>
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
                <tr><th scope="row" className="py-3 text-left font-normal text-muted">Extra</th><td>No processing fee</td><td>Ships weekly</td></tr>
              </tbody>
            </table>
            <p className="mt-4 text-muted">Message us before you order. Unconfirmed China packages are not shipped.</p>
            <Button href="/china-direct" variant="outline" className="mt-4 w-full sm:w-auto">China Direct addresses &amp; steps →</Button>
          </div>
          <a
            href={whatsappUrl(c.contact.chinaWhatsapp, "Hi SG Xpress, I'd like help with a China order")}
            data-track="whatsapp_click"
            data-track-location="rates-china-post"
            aria-label="Message us on WhatsApp for your China orders"
            className="mx-auto block w-full max-w-md overflow-hidden rounded-2xl transition hover:opacity-95"
          >
            <Image
              src="/images/china-stores-2026-10.jpg"
              alt="Ship directly from China: 1688, Taobao, Alibaba and AliExpress, by air freight or sea freight. Reliable shipping to Jamaica."
              width={760}
              height={760}
              sizes="(min-width: 1024px) 400px, 100vw"
              className="w-full"
            />
          </a>
        </div>
      </Section>

      <Section id="barrels" tone="mist">
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 md:flex-row md:items-center md:justify-between md:p-6">
          <div>
            <H2>Barrels</H2>
            <p className="mt-2">Shipped and cleared from Florida. Prices depend on barrel size.</p>
          </div>
          <Button href={whatsappUrl(c.contact.quotesWhatsapp, "Hi SG Xpress, I'd like a barrel quote")} className="w-full flex-none md:w-auto" track="whatsapp_click" trackLocation="rates-barrels">
            Get a barrel quote
          </Button>
        </div>
      </Section>

      <Section tone="navy">
        <div className="flex flex-col gap-4 md:items-center md:text-center">
          <H2>Start shipping today</H2>
          <p className="text-on-navy">Free to join. Your US address is ready right after sign-up.</p>
          <Button href={REGISTER_URL} variant="gold" size="lg" className="md:min-w-80" track="register_click" trackLocation="rates-closing">Sign up free</Button>
          <p className="text-sm text-on-navy">Rates may change without notice. Questions? <Link href="/faqs" className="underline">Read the FAQs</Link>.</p>
        </div>
      </Section>
    </>
  );
}
