import type { SiteContent } from "@/lib/content/schema";

// schema.org data for search engines: the business, its branches and the FAQs.
// Built from the admin-edited content, so it stays in step with the visible page.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sgxpressja.com";

/** Renders JSON-LD. "<" is escaped so admin-entered text can never close the script tag. */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

/** "9:30am" → "09:30" */
function time24(t: string): string | null {
  const m = t.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
  if (!m) return null;
  let h = Number(m[1]) % 12;
  if (m[3].toLowerCase() === "pm") h += 12;
  return `${String(h).padStart(2, "0")}:${m[2] ?? "00"}`;
}

/** "Mon–Fri 9:30am–5:30pm" → opening hours for those days; "Sun closed" or unreadable text → nothing. */
function openingHours(text: string, days: string[]) {
  const m = text.match(/(\d{1,2}(?::\d{2})?\s*[ap]m)\s*[–—-]\s*(\d{1,2}(?::\d{2})?\s*[ap]m)/i);
  const opens = m && time24(m[1]);
  const closes = m && time24(m[2]);
  return opens && closes ? [{ "@type": "OpeningHoursSpecification", dayOfWeek: days, opens, closes }] : [];
}

/** "28 Church Street, Montego Bay" → street + town. */
function postalAddress(address: string) {
  const i = address.lastIndexOf(",");
  return {
    "@type": "PostalAddress",
    streetAddress: (i > 0 ? address.slice(0, i) : address).trim(),
    ...(i > 0 ? { addressLocality: address.slice(i + 1).trim() } : {}),
    addressCountry: "JM",
  };
}

/** Coordinates from a Google Maps place link ("…/@18.47,-77.92,17z/…"), if present. */
function geo(mapsUrl: string) {
  const m = mapsUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  return m ? { geo: { "@type": "GeoCoordinates", latitude: Number(m[1]), longitude: Number(m[2]) } } : {};
}

export function businessData(c: SiteContent) {
  const orgId = `${SITE_URL}/#organization`;
  const hours = [
    ...openingHours(c.hours.weekdays, ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]),
    ...openingHours(c.hours.saturday, ["Saturday"]),
    ...openingHours(c.hours.sunday, ["Sunday"]),
  ];
  const sameAs = Object.values(c.socials).filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": orgId,
        name: "SG Xpress Shipping",
        legalName: "SG Xpress Jamaica Limited",
        url: SITE_URL,
        logo: `${SITE_URL}/images/logo.png`,
        email: c.contact.email,
        telephone: c.contact.phones[0],
        areaServed: { "@type": "Country", name: "Jamaica" },
        ...(sameAs.length ? { sameAs } : {}),
      },
      { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: "SG Xpress Shipping", url: SITE_URL, publisher: { "@id": orgId } },
      ...c.branches.map((b, i) => ({
        "@type": "LocalBusiness",
        "@id": `${SITE_URL}/#branch-${i + 1}`,
        name: `SG Xpress Shipping (${b.contactLabel || b.name})`,
        description: "Courier and freight forwarding from the USA and China to Jamaica, by air and ocean.",
        parentOrganization: { "@id": orgId },
        url: `${SITE_URL}/contact`,
        image: `${SITE_URL}/images/logo.png`,
        telephone: b.phone,
        email: c.contact.email,
        address: postalAddress(b.address),
        ...geo(b.mapsUrl),
        hasMap: b.mapsUrl,
        ...(hours.length ? { openingHoursSpecification: hours } : {}),
        areaServed: { "@type": "Country", name: "Jamaica" },
      })),
    ],
  };
}

export function faqData(faqs: SiteContent["faqs"]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
