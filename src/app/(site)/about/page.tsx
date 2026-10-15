import type { Metadata } from "next";
import Link from "next/link";
import { AirSchedule, WarehouseHours } from "@/components/AirSchedule";
import { IconBox, IconArrow, IconPin, IconShip } from "@/components/Icons";
import { Button, H2, IconTile, Section } from "@/components/ui";
import { getContent } from "@/lib/content/store";
import { REGISTER_URL, whatsappUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "About us",
  description: "SG Xpress Shipping is a Montego Bay company offering express courier, freight forwarding, and air and ocean cargo, with delivery islandwide.",
};

const WHAT_WE_DO = [
  { icon: <IconBox />, t: "Express courier", d: "Within Jamaica and from the USA." },
  { icon: <IconArrow />, t: "Freight forwarding", d: "Your free US address, cleared through customs for you." },
  { icon: <IconShip />, t: "Air & ocean cargo", d: "USA Air, USA Ocean and China Direct." },
  { icon: <IconPin />, t: "Islandwide delivery", d: "Collect at a branch or get it delivered anywhere in Jamaica." },
];

const COMMITMENTS = [
  { t: "We meet your needs", d: "And the needs of your customers." },
  { t: "Service shaped to your request", d: "Flexible options, not one-size-fits-all." },
  { t: "Growing with you", d: "We expand our services as Jamaica's needs grow." },
  { t: "A good corporate citizen", d: "A sound business that serves all our stakeholders." },
];

export default async function AboutPage() {
  const c = await getContent();

  return (
    <>
      <section className="bg-navy text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 md:px-6 md:py-14">
          <h1 className="text-[31px] font-extrabold leading-tight md:text-5xl">Shipping built around you</h1>
          <p className="max-w-2xl text-lg text-on-navy">
            SG Xpress Shipping is a Montego Bay company offering express courier, freight forwarding, and air and ocean cargo, with delivery islandwide.
          </p>
        </div>
      </section>

      <Section>
        <H2>From the store to your door</H2>
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {WHAT_WE_DO.map((w) => (
            <div key={w.t} className="flex flex-col gap-2 rounded-2xl bg-mist p-4">
              <IconTile>{w.icon}</IconTile>
              <h3 className="font-bold">{w.t}</h3>
              <p className="text-sm text-muted">{w.d}</p>
            </div>
          ))}
        </div>
        <Link href="/#services" className="mt-4 inline-flex min-h-11 items-center font-semibold">See all services →</Link>
      </Section>

      <Section tone="mist">
        <H2>Shoppers and businesses</H2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-line bg-white p-5">
            <h3 className="text-lg font-bold">Online shoppers</h3>
            <p className="mt-1 text-sm text-muted">Shop any US or China store, even without a credit card, and pick up close to home.</p>
          </article>
          <article className="rounded-2xl border border-line bg-white p-5">
            <h3 className="text-lg font-bold">Businesses and their customers</h3>
            <p className="mt-1 text-sm text-muted">Bring in stock by air or sea, with commercial rates for larger volumes.</p>
          </article>
        </div>
      </Section>

      <Section>
        <H2>Our commitments</H2>
        <ol className="mt-6 grid gap-4 md:grid-cols-2">
          {COMMITMENTS.map((x, i) => (
            <li key={x.t} className="flex gap-4">
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-gold text-lg font-extrabold">{i + 1}</span>
              <div>
                <h3 className="font-bold">{x.t}</h3>
                <p className="text-sm text-muted">{x.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="air-schedule" tone="mist">
        <H2>USA air shipping schedule</H2>
        <p className="mb-6 mt-2 text-muted">SG Xpress normally ships from the USA to Jamaica three times weekly.</p>
        <AirSchedule content={c} />
      </Section>

      <Section id="warehouse-hours">
        <H2>Florida warehouse operating hours</H2>
        <div className="mt-4"><WarehouseHours content={c} /></div>
      </Section>

      <Section tone="mist">
        <H2>Visit us</H2>
        <p className="mt-2 text-muted">{c.hours.weekdays} · {c.hours.saturday} · {c.hours.sunday}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {c.branches.map((b) => (
            <a key={b.name} href={b.mapsUrl} data-track="directions_click" data-track-location={`about-${b.name}`} className="flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3">
              <span>
                <strong className="block">{b.name}</strong>
                <span className="text-sm text-muted">{b.address}</span>
              </span>
              <span className="whitespace-nowrap text-sm font-semibold">Directions →</span>
            </a>
          ))}
        </div>
      </Section>

      <Section tone="navy">
        <div className="flex flex-col gap-4 md:items-center md:text-center">
          <H2>Ship with SG Xpress</H2>
          <p className="text-on-navy">Free to join. Your US address is ready right after sign-up.</p>
          <Button href={REGISTER_URL} variant="gold" size="lg" className="md:min-w-80" track="register_click" trackLocation="about-closing">Sign up free</Button>
          <Button href={whatsappUrl(c.contact.whatsapp)} variant="outline-light" className="md:min-w-80" track="whatsapp_click" trackLocation="about-closing">Talk to us on WhatsApp</Button>
        </div>
      </Section>
    </>
  );
}
