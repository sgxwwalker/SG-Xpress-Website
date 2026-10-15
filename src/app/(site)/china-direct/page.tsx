import type { Metadata } from "next";
import Image from "next/image";
import { ChinaAddresses } from "@/components/ChinaAddresses";
import { FaqList } from "@/components/FaqList";
import { IconAlert, IconChat } from "@/components/Icons";
import { Button, H2, Section } from "@/components/ui";
import { getContent } from "@/lib/content/store";
import { REGISTER_URL, whatsappUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "China Direct",
  description: "Ship from China to Jamaica by air or sea, including dangerous goods. Our China warehouse addresses and how it works.",
};

export default async function ChinaDirectPage() {
  const c = await getContent();
  const wa = c.contact.chinaWhatsapp; // China Help Desk
  const enquire = whatsappUrl(wa, "Hi SG Xpress, I'd like to ship from China");
  const steps = [
    { t: "Message us on WhatsApp", d: "Send the item link or your supplier details before you pay." },
    { t: "We confirm the method", d: "Air, sea or dangerous goods. We check the item and give you the go-ahead." },
    { t: "Ship to the matching address", d: "Give your supplier the address and label below, with SGX and your full name as the mark." },
    { t: "Collect or get it delivered", d: "We message you when it's ready. Pick it up at a branch or get it delivered anywhere in Jamaica." },
  ];

  return (
    <>
      <section className="bg-navy text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 py-8 md:px-6 md:py-14 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <h1 className="text-[34px] font-extrabold leading-tight md:text-5xl">China Direct</h1>
            <p className="text-lg text-on-navy">Buy from suppliers in China and ship straight to Jamaica by air or sea, including dangerous goods.</p>
            <div className="flex flex-col gap-3 sm:max-w-md">
              <Button href={enquire} variant="gold" size="lg" track="whatsapp_click" trackLocation="china-hero">
                <IconChat className="h-5 w-5" /> Ask on WhatsApp first
              </Button>
              <Button href="#steps" variant="outline-light">See how it works</Button>
            </div>
          </div>
          <Image src="/images/china-direct.jpg" alt="China Direct shipping: we ship every 3 weeks from China" width={760} height={706} priority sizes="(min-width: 1024px) 560px, 100vw" className="w-full rounded-2xl" />
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pt-6 md:px-6">
        <div role="note" className="flex gap-3 rounded-2xl border-2 border-[#b07f00] bg-gold-soft p-4">
          <IconAlert className="h-6 w-6 flex-none text-gold-text" />
          <div>
            <h2 className="font-bold">Message us before you order</h2>
            <p className="text-sm">Every China shipment must be confirmed by our team on WhatsApp. Packages sent without confirmation will not be shipped.</p>
          </div>
        </div>
      </div>

      <Section id="options">
        <H2>Air or sea?</H2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <article className="flex flex-col gap-3 rounded-2xl border-2 border-navy p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">China Air</h3>
              <span className="rounded-full bg-navy px-3 py-1 text-sm font-semibold text-white">{c.china.airTransit}</span>
            </div>
            <p className="text-3xl font-extrabold">US${c.china.airPerLbUsd} <span className="text-base font-medium">per lb</span></p>
            <p className="text-sm text-muted">No processing fee.</p>
            <dl className="space-y-1 text-sm">
              <div className="flex gap-2"><dt className="w-20 flex-none font-semibold">Best for</dt><dd>Small, light items</dd></div>
              <div className="flex gap-2"><dt className="w-20 flex-none font-semibold">Avoid</dt><dd>Heavy or bulky goods: choose sea</dd></div>
            </dl>
          </article>
          <article className="flex flex-col gap-3 rounded-2xl border border-line bg-mist p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">China Sea</h3>
              <span className="rounded-full bg-navy px-3 py-1 text-sm font-semibold text-white">{c.china.seaTransit}</span>
            </div>
            <p className="text-2xl font-extrabold">Quote on request</p>
            <p className="text-sm text-muted">Ships weekly. Sea rates change often, so we quote each shipment.</p>
            <dl className="text-sm">
              <div className="flex gap-2"><dt className="w-20 flex-none font-semibold">Best for</dt><dd>Heavy, bulky or expensive items: furniture, machines, stock for your business</dd></div>
            </dl>
            <Button href={whatsappUrl(wa, "Hi SG Xpress, I'd like a China sea freight quote")} className="mt-auto" track="whatsapp_click" trackLocation="china-sea">Get a sea quote</Button>
          </article>
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-navy p-5 text-white">
          <h3 className="text-xl font-bold">Dangerous goods</h3>
          <p className="text-sm text-on-navy">Items that contain any of these must go to our dangerous goods address, with its own entrance number. Ask us before you buy.</p>
          <ul className="grid grid-cols-3 gap-2 sm:max-w-md">
            {["Batteries", "Liquids", "Powders"].map((x) => (
              <li key={x} className="rounded-xl bg-white/10 px-3 py-2.5 text-sm font-semibold">{x}</li>
            ))}
          </ul>
          <a href="#address" className="inline-flex min-h-11 items-center font-semibold text-gold">Dangerous goods address →</a>
        </div>
      </Section>

      <Section id="steps" tone="mist">
        <H2>Four steps from China</H2>
        <ol className="mt-6 grid gap-3 md:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.t} className="flex gap-4 rounded-2xl border border-line bg-white p-4 md:flex-col">
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-navy text-lg font-extrabold text-gold">{i + 1}</span>
              <div>
                <h3 className="font-bold">{s.t}</h3>
                <p className="text-sm text-muted">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="address">
        <H2>Our China addresses</H2>
        <p className="mb-6 mt-2 text-muted">Use the address that matches what we confirmed. Put SGX and your full name on every package.</p>
        <ChinaAddresses warehouses={c.chinaWarehouses} />
      </Section>

      <Section tone="mist">
        <H2>China questions</H2>
        <div className="mt-4">
          <FaqList faqs={c.faqs.filter((f) => f.category === "China & ocean shipping" && !/barrel/i.test(f.q))} openFirst />
        </div>
      </Section>

      <Section tone="navy">
        <div className="flex flex-col gap-4 md:items-center md:text-center">
          <H2>Ready to ship from China?</H2>
          <p className="text-on-navy">Send us the item link or your order details. We&apos;ll confirm the best way to ship it.</p>
          <Button href={enquire} variant="gold" size="lg" className="md:min-w-80" track="whatsapp_click" trackLocation="china-closing">WhatsApp us</Button>
          <Button href={REGISTER_URL} variant="outline-light" className="md:min-w-80" track="register_click" trackLocation="china-closing">No account yet? Sign up free</Button>
        </div>
      </Section>
    </>
  );
}
