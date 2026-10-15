import type { Metadata } from "next";
import Link from "next/link";
import { Button, H2, PageTitle, Section } from "@/components/ui";
import { getContent } from "@/lib/content/store";
import { whatsappUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Restricted Items for Import into Jamaica",
  description: "Items that need a permit to import into Jamaica, and which agency issues it.",
  alternates: { canonical: "/restricted-items" },
};

// From the Jamaica Customs Agency "Restricted Items" brochure previously on sgxpressja.com.
const MNS_ITEMS = [
  "Camouflage clothing and material", "Bulletproof vests", "Crossbows", "Motorcycles over 700cc", "Spears", "Handcuffs",
  "Radar detectors", "Swords", "Toy guns", "Metal detectors", "Riot gear", "Gun cleaning kits", "Armoured trucks",
  "Gun holsters", "Bows and arrows", "Credit card scanners", "Gunpowder and cartridges", "Laser lights",
  "Dynamite and nitroglycerine", "Firecrackers and flares", "Pepper spray",
];

const AGENCY_ITEMS: { item: string; need: string; agency: string }[] = [
  { item: "Meat and animals", need: "Permit / certificate", agency: "Ministry of Agriculture" },
  { item: "Red peas (red kidney beans)", need: "Permit / phytosanitary certificate", agency: "Ministry of Agriculture" },
  { item: "Fruits, vegetables, plants and plant products", need: "Phytosanitary certificate / permit", agency: "Ministry of Agriculture" },
  { item: "Ground provisions", need: "Phytosanitary certificate / permit", agency: "Ministry of Agriculture" },
  { item: "Milk powder and milk-based products", need: "Licence / permit", agency: "Ministry of Agriculture" },
  { item: "Pharmaceuticals, chemicals, herbal teas", need: "PSD certificate", agency: "Pharmaceutical Regulatory Affairs, Ministry of Health" },
  { item: "Firearms and accessories, explosives, fireworks, swords", need: "Permit / licence to import", agency: "Ministry of National Security / Trade Board" },
  { item: "Sugar", need: "Licence", agency: "Trade Board" },
  { item: "Motor vehicles", need: "Licence", agency: "Trade Board" },
  { item: "Coconut products, oil-producing seeds, edible oils, soaps", need: "Permit", agency: "Coconut Industry Board" },
  { item: "Alcohol in bulk", need: "Spirit Pool permit", agency: "Spirit Pool Association" },
  { item: "Human remains", need: "KSAH permit", agency: "Kingston & St. Andrew Health Department" },
  { item: "Pesticides", need: "Permit", agency: "Pesticides Control Authority" },
  { item: "Two-way radios", need: "Licence / approval", agency: "Spectrum Management Authority" },
];

export default async function RestrictedItemsPage() {
  const c = await getContent();
  return (
    <>
      <PageTitle title="Restricted items" intro="These items need a permit before they can be imported into Jamaica. Shipping them without one can lead to delays, detention or fines." />

      <Section>
        <H2>Ask us first</H2>
        <p className="mt-2 max-w-2xl text-muted">
          If you&apos;re not sure about an item, message us before you buy. From China, anything with batteries, liquids or powders ships as{" "}
          <Link href="/china-direct#address" className="font-semibold underline">dangerous goods</Link>.
        </p>
        <Button href={whatsappUrl(c.contact.whatsapp, "Hi SG Xpress, can I ship this item?")} className="mt-4 w-full sm:w-auto" track="whatsapp_click" trackLocation="restricted">
          Ask on WhatsApp
        </Button>
      </Section>

      <Section tone="mist">
        <H2>Permits by agency</H2>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-navy text-left text-white">
              <tr>
                <th scope="col" className="px-4 py-3">Item</th>
                <th scope="col" className="px-4 py-3">You need</th>
                <th scope="col" className="px-4 py-3">Issued by</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {AGENCY_ITEMS.map((r) => (
                <tr key={r.item}>
                  <th scope="row" className="px-4 py-3 text-left font-semibold">{r.item}</th>
                  <td className="px-4 py-3">{r.need}</td>
                  <td className="px-4 py-3">{r.agency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section>
        <H2>Needs a Ministry of National Security permit</H2>
        <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {MNS_ITEMS.map((x) => (
            <li key={x} className="rounded-xl bg-mist px-4 py-3 font-medium">{x}</li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-muted">
          Source: Jamaica Customs Agency. The list can change. Check{" "}
          <a href="https://www.jacustoms.gov.jm" className="font-semibold underline">jacustoms.gov.jm</a> for the latest rules.
        </p>
      </Section>
    </>
  );
}
