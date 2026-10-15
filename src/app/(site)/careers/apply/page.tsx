import type { Metadata } from "next";
import Link from "next/link";
import { ApplicationForm } from "@/components/ApplicationForm";
import { Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "General application | Careers",
  description: "Send SG Xpress your CV for future openings.",
};

export default function GeneralApplicationPage() {
  return (
    <>
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-14">
          <Link href="/careers" className="text-sm text-on-navy hover:underline">← All openings</Link>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight md:text-5xl">General application</h1>
          <p className="mt-3 max-w-2xl text-lg text-on-navy">Don&apos;t see the right role? Send us your CV and we&apos;ll contact you when something suitable opens.</p>
        </div>
      </section>
      <Section>
        <div className="max-w-2xl rounded-2xl border border-line bg-white p-5 shadow-sm md:p-8">
          <ApplicationForm jobId="" jobTitle="General application" />
        </div>
      </Section>
    </>
  );
}
