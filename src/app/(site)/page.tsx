import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AppLinks } from "@/components/AppLinks";
import { BranchCards } from "@/components/BranchCards";
import { FaqList } from "@/components/FaqList";
import { IconArrow, IconBarrel, IconCart, IconCheck, IconDocCheck, IconGlobe, IconPlane, IconShip } from "@/components/Icons";
import { Button, H2, IconTile, Section } from "@/components/ui";
import { getContent } from "@/lib/content/store";
import { flightDays } from "@/lib/rates";
import { LOGIN_URL, REGISTER_URL, whatsappUrl } from "@/lib/site";
import { businessData, JsonLd } from "@/components/StructuredData";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const c = await getContent();
  const STEPS = [
    { t: "Register free", d: "Sign up online or in the app. Takes about two minutes." },
    { t: "Get your US address", d: "Open My Address. Your SGX number goes on Address Line 2." },
    { t: "Shop and ship", d: "Buy from any US store. Upload your invoice when we receive it." },
    { t: "Track and collect", d: `Follow it in the app. Pick up within ${c.fees.storageFreeDays} days of your ready notice.` },
  ];

  return (
    <>
      <JsonLd data={businessData(c)} />
      {/* Opening */}
      <section className="bg-navy text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-8 md:px-6 md:py-16 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <h1 className="text-[34px] font-extrabold leading-[1.08] md:text-6xl">Ship from the USA and China to Jamaica</h1>
            <p className="text-lg text-on-navy">Get a free US address, shop any store, and collect at a branch or get it delivered islandwide.</p>
            <div className="flex flex-col gap-3 sm:max-w-md">
              <Button href={REGISTER_URL} variant="gold" size="lg" track="register_click" trackLocation="hero">
                Sign up free <IconArrow className="h-5 w-5" />
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button href={LOGIN_URL} variant="outline-light" size="sm" track="login_click" trackLocation="hero">Customer login</Button>
                <Button href="/rates" variant="outline-light" size="sm">View rates</Button>
              </div>
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-on-navy">
              {["No sign-up fee", "No credit card needed", "USA air 3× weekly"].map((t) => (
                <li key={t} className="flex items-center gap-1.5"><IconCheck className="h-4 w-4 text-gold" />{t}</li>
              ))}
            </ul>
          </div>
          <Image src="/images/air-freight.jpg" alt="We offer 3 times per week air shipping, 48 to 72 hours" width={760} height={760} sizes="(min-width: 1024px) 560px, 1px" className="hidden rounded-2xl lg:block" />
        </div>
      </section>

      {/* How it works */}
      <Section>
        <H2>Four steps to your door</H2>
        <ol className="mt-6 grid gap-3 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.t} className="flex gap-4 rounded-2xl bg-mist p-4 md:flex-col">
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-navy text-lg font-extrabold text-gold">{i + 1}</span>
              <div>
                <h3 className="text-lg font-bold">{s.t}</h3>
                <p className="text-sm text-muted">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
        <Button href={REGISTER_URL} className="mt-6 w-full sm:w-auto" track="register_click" trackLocation="steps">Get my free US address</Button>
      </Section>

      {/* Services */}
      <Section id="services" tone="mist">
        <H2>Pick how you ship</H2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ServiceCard
            image={{ src: "/images/air-freight.jpg", alt: "We offer 3 times per week air shipping, 48 to 72 hours", w: 760, h: 760 }}
            icon={<IconPlane />}
            title="USA Air"
            meta={`Flights ${flightDays(c.usaAir.schedule)} · ${c.usaAir.transit}`}
            text="Best for clothes, electronics, small and urgent items. Priced per pound."
            link={{ href: "/rates#air", label: "See air rates" }}
          />
          <ServiceCard
            image={{ src: "/images/sea-freight.jpg", alt: "Ship for less by sea freight: weightless shipping, commercial rate available", w: 760, h: 760 }}
            icon={<IconShip />}
            title="USA Ocean"
            meta={`Weekly sailings · ${c.ocean.transit}`}
            text="Best for furniture, appliances and bulky items. Priced per cubic foot, not weight. Commercial rates available, conditions apply."
            link={{ href: "/rates#ocean", label: "See ocean rates" }}
          />
          <article className="flex flex-col overflow-hidden rounded-2xl bg-navy text-white">
            <Image src="/images/china-direct.jpg" alt="China Direct shipping: we ship every 3 weeks from China" width={760} height={706} sizes="(min-width: 1024px) 360px, (min-width: 768px) 50vw, 100vw" className="w-full" />
            <div className="flex flex-1 flex-col gap-3 p-5">
              <div className="flex items-center gap-3">
                <IconTile tone="gold"><IconGlobe /></IconTile>
                <div>
                  <h3 className="text-lg font-bold">China Direct</h3>
                  <p className="text-sm font-medium text-on-navy">Air {c.china.airTransit} · Sea ships weekly</p>
                </div>
              </div>
              <p className="text-sm text-on-navy">Air for small, light items. Sea for heavy or bulky orders. Message us before you ship: unconfirmed packages can&apos;t be sent.</p>
              <div className="mt-auto grid grid-cols-2 gap-2">
                <Button href={whatsappUrl(c.contact.chinaWhatsapp, "Hi SG Xpress, I'd like to ship from China")} variant="gold" track="whatsapp_click" trackLocation="home-china">WhatsApp us</Button>
                <Button href="/china-direct" variant="outline-light">How it works</Button>
              </div>
            </div>
          </article>
          <ServiceCard
            icon={<IconBarrel />}
            title="Barrel Shipping"
            meta="From Florida · Quote"
            text="Best for groceries, household goods and gifts. We ship and clear customs for you."
            link={{ href: whatsappUrl(c.contact.quotesWhatsapp, "Hi SG Xpress, I'd like a barrel quote"), label: "Get a barrel quote", track: "barrel" }}
          />
          <ServiceCard
            icon={<IconCart />}
            title="Order Services"
            meta="No credit card? We buy for you"
            text="Send us the item link and we place the order with our card. Our team will quote the fee."
            link={{ href: whatsappUrl(c.contact.quotesWhatsapp, "Hi SG Xpress, I'd like you to order an item for me"), label: "Request an order", track: "order" }}
          />
          <ServiceCard
            icon={<IconDocCheck />}
            title="Customs Brokerage"
            meta="Personal or commercial · Quote"
            text="Let us handle Customs clearance for you. We help with the documents, submission and processing, and coordinate clearance with Jamaica Customs."
            link={{ href: whatsappUrl(c.contact.quotesWhatsapp, "Hi SG Xpress, I'd like a customs brokerage quote"), label: "Get a quote & document list", track: "brokerage" }}
          />
        </div>
      </Section>

      {/* App */}
      <Section tone="gold">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <H2>Track every package in the SGX app</H2>
            <p>Track packages, check rates, pay, schedule pickups and manage your account.</p>
            <AppLinks />
          </div>
          <Image
            src="/images/try-the-app.jpg"
            alt="Try out the SG Xpress app: track your packages, check rates, pay for packages, schedule pickups and manage your account"
            width={706}
            height={900}
            sizes="(min-width: 768px) 440px, 100vw"
            className="mx-auto w-full max-w-md rounded-2xl shadow-xl shadow-navy-deep/20"
          />
        </div>
      </Section>

      {/* Locations */}
      <Section id="locations">
        <H2>Two branches in Montego Bay</H2>
        <div className="mt-6"><BranchCards content={c} /></div>
      </Section>

      {/* FAQs */}
      <Section tone="mist">
        <H2>Quick answers</H2>
        <div className="mt-4"><FaqList faqs={c.faqs.filter((f) => f.featured).slice(0, 6)} openFirst /></div>
        <Link href="/faqs" className="mt-4 inline-flex min-h-11 items-center font-semibold">All FAQs &amp; restricted items →</Link>
      </Section>

      {/* Closing */}
      <Section tone="navy">
        <div className="flex flex-col gap-4 md:items-center md:text-center">
          <H2>Ready to shop the USA and China?</H2>
          <p className="text-on-navy">Free to join. Your US address is ready right after sign-up.</p>
          <Button href={REGISTER_URL} variant="gold" size="lg" className="md:min-w-80" track="register_click" trackLocation="closing">Sign up free</Button>
          <p className="text-sm text-on-navy">Popular stores: Amazon · Shein · Walmart · eBay · Temu · Best Buy</p>
        </div>
      </Section>
    </>
  );
}

function ServiceCard({
  image,
  icon,
  title,
  meta,
  text,
  link,
}: {
  image?: { src: string; alt: string; w: number; h: number };
  icon: React.ReactNode;
  title: string;
  meta: string;
  text: string;
  link: { href: string; label: string; track?: string };
}) {
  const isWa = link.href.startsWith("https://wa.me");
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white">
      {image ? <Image src={image.src} alt={image.alt} width={image.w} height={image.h} sizes="(min-width: 1024px) 360px, (min-width: 768px) 50vw, 100vw" className="w-full" /> : null}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-3">
          <IconTile>{icon}</IconTile>
          <div>
            <h3 className="text-lg font-bold">{title}</h3>
            <p className="text-sm font-medium text-muted">{meta}</p>
          </div>
        </div>
        <p className="text-sm text-muted">{text}</p>
        {isWa ? (
          <a href={link.href} data-track="whatsapp_click" data-track-location={`home-${link.track}`} className="mt-auto inline-flex min-h-11 items-center font-semibold">{link.label} →</a>
        ) : (
          <Link href={link.href} className="mt-auto inline-flex min-h-11 items-center font-semibold">{link.label} →</Link>
        )}
      </div>
    </article>
  );
}
