import type { Metadata } from "next";
import { Prose } from "@/components/Prose";
import { PageTitle, Section } from "@/components/ui";
import { TERMS_MD } from "@/content/terms";

export const metadata: Metadata = {
  title: "Terms and conditions",
  description: "Terms and conditions for shipping with SG Xpress Jamaica Limited: invoices, customs, storage, claims and more.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <>
      <PageTitle title="Terms and conditions" intro="Terms and conditions of SG Xpress Jamaica Limited™." />
      <Section>
        <Prose markdown={TERMS_MD} />
      </Section>
    </>
  );
}
