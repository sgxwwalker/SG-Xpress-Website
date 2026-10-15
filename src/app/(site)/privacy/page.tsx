import type { Metadata } from "next";
import Link from "next/link";
import { Prose } from "@/components/Prose";
import { PageTitle, Section } from "@/components/ui";
import { PRIVACY_LAST_UPDATED, PRIVACY_MD } from "@/content/privacy";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What personal information SG Xpress collects, how we use and share it, and your rights under Jamaica's Data Protection Act.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <PageTitle title="Privacy" intro={`How we handle your personal information. Last updated ${PRIVACY_LAST_UPDATED}.`} />
      <Section>
        <Prose markdown={PRIVACY_MD} />
        <p className="mt-8 max-w-3xl text-sm text-muted">
          See also our full <Link href="/terms" className="font-semibold underline">terms and conditions</Link>.
        </p>
      </Section>
    </>
  );
}
