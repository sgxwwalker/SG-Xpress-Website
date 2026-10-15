import type { Metadata } from "next";
import { BranchCards } from "@/components/BranchCards";
import { ContactForm } from "@/components/ContactForm";
import { IconChat, IconClock, IconGlobe, IconMail, IconPhone } from "@/components/Icons";
import { SocialLinks } from "@/components/SocialLinks";
import { H2, Section } from "@/components/ui";
import { getContent } from "@/lib/content/store";
import { telHref, whatsappUrl } from "@/lib/site";
import { businessData, JsonLd } from "@/components/StructuredData";

export const metadata: Metadata = {
  title: "Contact Us, Phone, WhatsApp & Branches",
  description: "Call, WhatsApp, email or send SG Xpress a message, or visit our Church Street and Clock branches.",
  alternates: { canonical: "/contact" },
};

/** "(876) 879-4816" → "18768794816" for wa.me links. */
function waDigits(phone: string): string {
  const d = phone.replace(/\D/g, "");
  return d.length === 10 ? `1${d}` : d;
}

function formatWa(n: string): string {
  return n.length === 11 ? `(${n.slice(1, 4)}) ${n.slice(4, 7)}-${n.slice(7)}` : n;
}

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

export default async function ContactPage() {
  const c = await getContent();
  const china = c.contact.chinaWhatsapp;

  return (
    <>
      <JsonLd data={businessData(c)} />
      <section className="bg-mist py-8 md:py-14">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="grid overflow-hidden rounded-3xl bg-white shadow-xl shadow-navy-deep/10 lg:grid-cols-[400px_1fr]">
            {/* Reach us */}
            <div className="flex flex-col gap-6 bg-navy p-6 text-white md:p-10">
              <h1 className="text-3xl font-extrabold leading-tight md:text-4xl">
                Get in <span className="text-gold">touch</span>
              </h1>

              <ContactRow icon={<IconPhone className="h-5 w-5" />} label="Call or WhatsApp">
                <div className="flex flex-col gap-3">
                  {c.contact.phones.map((p) => {
                    // Label each number with the branch it belongs to (e.g. Church Street, Clock Mobay).
                    const branch = c.branches.find((b) => waDigits(b.phone) === waDigits(p));
                    const label = branch ? branch.contactLabel || branch.name : undefined;
                    return <NumberActions key={p} display={p} label={label} tel={telHref(p)} wa={whatsappUrl(waDigits(p))} where="contact-main" />;
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

            {/* Send a message */}
            <div className="p-6 md:p-10 lg:p-12">
              <h2 className="text-3xl font-extrabold leading-tight md:text-4xl">Send a message</h2>
              <p className="mb-8 mt-2 max-w-lg text-muted">
                A question about a package, a rate or anything else? Fill in the form and we&apos;ll get back to you, usually within one business day.
              </p>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      <Section>
        <H2>Our branches</H2>
        <div className="mt-6"><BranchCards content={c} /></div>
      </Section>
    </>
  );
}
