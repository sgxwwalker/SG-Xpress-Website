import type { Metadata } from "next";
import Link from "next/link";
import { FaqExplorer } from "@/components/FaqExplorer";
import { IconChat, IconMail, IconPhone } from "@/components/Icons";
import { H2, Section } from "@/components/ui";
import { getContent } from "@/lib/content/store";
import { FAQ_CATEGORIES } from "@/lib/content/schema";
import { telHref, whatsappUrl } from "@/lib/site";
import { faqData, JsonLd } from "@/components/StructuredData";

export const metadata: Metadata = {
  title: "Shipping FAQs, USA & China to Jamaica",
  description: "Answers about getting started, shipping and tracking, invoices and customs, pickup and payments, and China and ocean shipping.",
  alternates: { canonical: "/faqs" },
};

function formatWhatsapp(n: string): string {
  return n.length === 11 ? `${n.slice(1, 4)}-${n.slice(4, 7)}-${n.slice(7)}` : n;
}

export default async function FaqsPage() {
  const c = await getContent();

  return (
    <>
      <JsonLd data={faqData(c.faqs)} />
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-10 text-center md:px-6 md:pb-14 md:pt-16">
          <h1 className="text-3xl font-extrabold uppercase leading-tight md:text-5xl">
            Frequently asked <span className="text-gold">questions</span>
          </h1>
          <span aria-hidden="true" className="mx-auto mt-4 block h-1 w-20 rounded-full bg-gold" />
          <p className="mx-auto mt-4 max-w-xl text-on-navy">Everything customers ask us most often, in one place. Still stuck? We&apos;re a message away.</p>
        </div>
      </section>

      <Section className="!pt-8">
        <FaqExplorer faqs={c.faqs} categories={FAQ_CATEGORIES} />
        <p className="mt-8 text-center text-sm text-muted">
          Not sure if you can ship something? See the <Link href="/restricted-items" className="font-semibold underline">restricted items</Link> list.
        </p>
      </Section>

      <Section tone="mist">
        <H2>Still need help?</H2>
        <p className="mt-2 text-muted">Send your name, SGX number, tracking number and a short description of your concern.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {c.branches.map((b) => (
            <a key={b.name} href={telHref(b.phone)} data-track="call_click" data-track-location={`faqs-${b.name}`} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4">
              <IconPhone className="h-6 w-6 flex-none" />
              <span>
                <strong className="block">{b.name}</strong>
                <span className="text-sm text-muted">{b.phone}</span>
              </span>
            </a>
          ))}
          <a href={whatsappUrl(c.contact.chinaWhatsapp)} data-track="whatsapp_click" data-track-location="faqs-help" className="flex items-center gap-3 rounded-2xl bg-whatsapp p-4 text-white">
            <IconChat className="h-6 w-6 flex-none" />
            <span>
              <strong className="block">China Help Desk</strong>
              <span className="text-sm">WhatsApp {formatWhatsapp(c.contact.chinaWhatsapp)}</span>
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
    </>
  );
}
