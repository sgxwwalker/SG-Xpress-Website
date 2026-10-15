import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplicationForm } from "@/components/ApplicationForm";
import { IconClock, IconPin, IconTag } from "@/components/Icons";
import { Button, Section } from "@/components/ui";
import { getContent } from "@/lib/content/store";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const job = (await getContent()).jobs.find((j) => j.id === slug);
  return job ? { title: `${job.title} | Careers`, description: job.summary, alternates: { canonical: `/careers/${job.id}` } } : { title: "Careers" };
}

function niceDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-JM", { day: "numeric", month: "long", year: "numeric" });
}

export default async function JobPage({ params }: Props) {
  const { slug } = await params;
  const job = (await getContent()).jobs.find((j) => j.id === slug);
  if (!job) notFound();

  return (
    <>
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-14">
          <Link href="/careers" className="text-sm text-on-navy hover:underline">← All openings</Link>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight md:text-5xl">{job.title}</h1>
          <ul className="mt-4 flex flex-wrap gap-2 text-sm">
            <li className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5"><IconTag className="h-4 w-4 text-gold" />{job.department}</li>
            <li className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5"><IconPin className="h-4 w-4 text-gold" />{job.location}</li>
            <li className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5"><IconClock className="h-4 w-4 text-gold" />{job.type}</li>
          </ul>
          <p className="mt-4 text-sm text-on-navy">
            Posted {niceDate(job.postedAt)}
            {job.closingDate ? ` · Apply by ${niceDate(job.closingDate)}` : ""}
          </p>
        </div>
      </section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1fr_420px]">
          <article className="flex max-w-2xl flex-col gap-8">
            <p className="text-lg">{job.summary}</p>
            {job.about ? (
              <div>
                <h2 className="mb-2 text-xl font-bold">About the role</h2>
                <p className="whitespace-pre-line text-muted">{job.about}</p>
              </div>
            ) : null}
            {job.responsibilities.length ? (
              <div>
                <h2 className="mb-2 text-xl font-bold">What you&apos;ll do</h2>
                <ul className="list-disc space-y-1.5 pl-5 text-muted">{job.responsibilities.map((r, i) => <li key={i}>{r}</li>)}</ul>
              </div>
            ) : null}
            {job.requirements.length ? (
              <div>
                <h2 className="mb-2 text-xl font-bold">What we&apos;re looking for</h2>
                <ul className="list-disc space-y-1.5 pl-5 text-muted">{job.requirements.map((r, i) => <li key={i}>{r}</li>)}</ul>
              </div>
            ) : null}
          </article>

          <aside id="apply" className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl border border-line bg-white p-5 shadow-sm md:p-6">
              {job.open ? (
                <>
                  <h2 className="mb-1 text-2xl font-extrabold">Apply for this role</h2>
                  <p className="mb-5 text-sm text-muted">Takes about 3 minutes. Have your CV ready.</p>
                  <ApplicationForm jobId={job.id} jobTitle={job.title} />
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-extrabold">This position has closed</h2>
                  <p className="mt-2 text-muted">We&apos;re no longer taking applications for this role, but you can still send us your CV.</p>
                  <div className="mt-4 flex flex-col gap-2">
                    <Button href="/careers/apply">Send a general application</Button>
                    <Button href="/careers" variant="outline">See current openings</Button>
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
