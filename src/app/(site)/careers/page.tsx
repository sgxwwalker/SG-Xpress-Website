import type { Metadata } from "next";
import { IconGlobe, IconUsers, IconArrow } from "@/components/Icons";
import { JobsBrowser } from "@/components/JobsBrowser";
import { Button, H2, IconTile, Section } from "@/components/ui";
import { getContent } from "@/lib/content/store";

export const metadata: Metadata = {
  title: "Careers",
  description: "Join the SG Xpress Shipping team in Jamaica. See current openings and apply online.",
};

const VALUES = [
  { icon: <IconArrow />, t: "Learn and grow", d: "Build real skills in logistics, customs and customer service, and grow with the business." },
  { icon: <IconUsers />, t: "Work as one team", d: "A close team across our branches, warehouses and China Direct desk, helping each other get it right." },
  { icon: <IconGlobe />, t: "Connect Jamaica to the world", d: "Help customers shop the USA and China and get their packages home." },
];

export default async function CareersPage() {
  const c = await getContent();
  const open = c.jobs.filter((j) => j.open).sort((a, b) => b.postedAt.localeCompare(a.postedAt));

  return (
    <>
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-16">
          <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">
            Build your future <span className="text-gold">with us</span>
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-on-navy">
            We&apos;re always looking for friendly, reliable people who care about getting customers&apos; packages home.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button href="#openings" variant="gold" size="lg">See current openings</Button>
            <Button href="/careers/apply" variant="outline-light" size="lg">Send a general application</Button>
          </div>
        </div>
      </section>

      <Section>
        <div className="grid gap-4 md:grid-cols-3">
          {VALUES.map((v) => (
            <div key={v.t} className="flex flex-col gap-3 rounded-2xl bg-mist p-5">
              <IconTile>{v.icon}</IconTile>
              <h2 className="text-lg font-bold">{v.t}</h2>
              <p className="text-sm text-muted">{v.d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="openings" tone="mist">
        <H2>Current openings</H2>
        <p className="mb-6 mt-2 text-muted">
          {open.length ? `${open.length} open position${open.length === 1 ? "" : "s"}. Choose one to see the details and apply.` : "Find a role that fits you."}
        </p>
        {open.length ? (
          <JobsBrowser jobs={open} />
        ) : (
          <div className="rounded-2xl border border-line bg-white p-6 md:p-8">
            <h3 className="text-xl font-bold">No openings right now</h3>
            <p className="mt-2 text-muted">We don&apos;t have any vacancies at the moment, but we&apos;d still like to hear from you. Send your CV and we&apos;ll keep it on file.</p>
            <Button href="/careers/apply" className="mt-4">Send a general application</Button>
          </div>
        )}
      </Section>

      {open.length ? (
        <Section>
          <div className="flex flex-col gap-4 rounded-2xl bg-navy p-6 text-white md:flex-row md:items-center md:justify-between md:p-8">
            <div>
              <h2 className="text-2xl font-extrabold">Don&apos;t see the right role?</h2>
              <p className="mt-1 text-on-navy">Send us your CV anyway. We&apos;ll keep it on file and contact you when something suitable opens.</p>
            </div>
            <Button href="/careers/apply" variant="gold" className="flex-none">Apply anyway</Button>
          </div>
        </Section>
      ) : null}
    </>
  );
}
