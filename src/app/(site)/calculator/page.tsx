import type { Metadata } from "next";
import Link from "next/link";
import { ShippingCalculator } from "@/components/ShippingCalculator";
import { Button, Section } from "@/components/ui";
import { getContent } from "@/lib/content/store";
import { REGISTER_URL, whatsappUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shipping Cost Calculator, USA to Jamaica",
  description: "Know the cost before you ship. Estimate USA Air or Ocean shipping to Jamaica, with shipping, fees and service charge shown separately.",
  alternates: { canonical: "/calculator" },
};

export default async function CalculatorPage() {
  const c = await getContent();

  return (
    <>
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-14">
          <p className="text-sm font-semibold text-on-navy">Shipping cost calculator</p>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight md:text-5xl">Know the cost before you ship.</h1>
          <p className="mt-3 max-w-2xl text-base text-on-navy md:text-lg">
            Enter a weight or a volume and we&apos;ll break it down for you: shipping, fees and service charge.
          </p>
        </div>
      </section>
      <Section tone="mist">
        <div className="mx-auto flex max-w-xl flex-col gap-6">
          <ShippingCalculator
            id="calc"
            airRates={c.airRates}
            fees={c.processingFees}
            serviceCharge={c.serviceCharge}
            ocean={c.ocean}
            whatsappHref={whatsappUrl(c.contact.whatsapp, "Hi SG Xpress, I need a price for a package over 50 lb")}
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button href={REGISTER_URL} variant="gold" className="flex-1" track="register_click" trackLocation="calculator">Sign up free</Button>
            <Button href="/rates" variant="outline" className="flex-1">Full rate sheet</Button>
          </div>
          <p className="text-center text-sm text-muted">
            Shipping something bigger, a barrel or from China? <Link href="/contact" className="font-semibold underline">Ask us for a quote</Link>.
          </p>
        </div>
      </Section>
    </>
  );
}
