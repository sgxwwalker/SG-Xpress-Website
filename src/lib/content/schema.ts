import { z } from "zod";
import { FAQ_CATEGORY_LIST, JOB_TYPES } from "@/lib/blocks/faq-categories";
import { defaultPages } from "./pages-default";
import { pagesSchema } from "./pages-schema";

// Everything staff can change from /admin. The public pages read only from this.

const money = z.number().min(0).max(10_000_000);
const shortText = z.string().trim().max(200);
const longText = z.string().trim().max(2000);
// Links staff enter must be ordinary web addresses (never javascript: or data:).
const webUrl = z.string().trim().max(600).url().refine((u) => /^https?:\/\//i.test(u), "Links must start with https://");

export const addressFieldSchema = z.object({
  label: shortText.min(1),
  value: z.string().trim().min(1).max(400),
});

export const branchSchema = z.object({
  name: shortText.min(1),
  address: shortText.min(1),
  mapsUrl: webUrl,
  phone: shortText.min(1),
  contactLabel: shortText.default(""), // short name shown next to its number on the Contact page
});

export const faqSchema = z.object({
  q: shortText.min(1),
  a: longText.min(1),
  category: z.enum(FAQ_CATEGORY_LIST),
  featured: z.boolean(),
});

export { JOB_TYPES };

export const jobSchema = z.object({
  id: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{3,80}$/, "Job link must be lower-case letters, numbers and dashes")
    .refine((id) => id !== "apply", "“apply” can't be used as a job link"),
  title: shortText.min(2),
  department: shortText.min(1),
  location: shortText.min(1),
  type: z.enum(JOB_TYPES),
  summary: z.string().trim().min(1).max(300),
  about: longText,
  responsibilities: z.array(shortText.min(1)).max(30),
  requirements: z.array(shortText.min(1)).max(30),
  closingDate: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
  postedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  open: z.boolean(),
});

export const contentSchema = z.object({
  notice: z.object({
    enabled: z.boolean(),
    text: shortText,
    linkLabel: shortText,
    // A page on this site ("/faqs") or a full https:// address.
    linkHref: shortText.refine(
      (v) => v === "" || /^\/(?!\/)/.test(v) || (/^https?:\/\//i.test(v) && URL.canParse(v)),
      "The link must be a page on this site (e.g. /faqs) or start with https://",
    ),
  }),
  // airRates[0] is the 0.1–0.5 lb rate; airRates[n] is the n lb rate, n = 1..50.
  airRates: z
    .array(money)
    .length(51)
    .refine((r) => r.every((v, i) => i === 0 || v >= r[i - 1]), {
      message: "Each weight must cost at least as much as the one before it. Check for a typo.",
    })
    .refine((r) => r.every((v, i) => i === 0 || v <= r[i - 1] * 3), {
      message: "One rate is more than 3× the previous weight's rate. Check for a typo.",
    }),
  processingFees: z.object({
    under10: money,
    from10: money,
  }),
  fees: z.object({
    lateInvoice: money,
    storagePerDay: money,
    storageFreeDays: z.number().int().min(0).max(365),
    auctionDays: z.number().int().min(0).max(365),
  }),
  // SG Xpress Service Charge: items valued over the threshold pay percent% of the full value, in J$.
  serviceCharge: z
    .object({
      percent: z.number().min(0).max(100), // USA Air
      oceanPercent: z.number().min(0).max(100).default(20), // USA Ocean
      thresholdUsd: money,
      jmdPerUsd: z.number().min(1).max(10_000),
    })
    .default({ percent: 35, oceanPercent: 20, thresholdUsd: 100, jmdPerUsd: 165 }),
  usaAir: z.object({
    transit: shortText.min(1),
    // Weekly schedule; "flight" days also feed the "Flights Tue, Thu & Sun" lines across the site.
    schedule: z
      .array(
        z.object({
          name: shortText.min(1),
          cutoff: shortText.min(1),
          flight: shortText.min(1),
          clearance: shortText.min(1),
          collection: shortText.min(1),
        }),
      )
      .min(1)
      .max(7),
  }),
  warehouseHours: z.array(z.object({ days: shortText.min(1), hours: shortText.min(1) })).min(1).max(7),
  ocean: z.object({
    perCubicFootUsd: money,
    smallPerLb: money, // J$ per lb for items under smallUnderCubicFeet
    smallUnderCubicFeet: z.number().min(0).max(100).default(1),
    transit: shortText.min(1),
  }),
  china: z.object({
    airPerLbUsd: money,
    airTransit: shortText.min(1),
    seaTransit: shortText.min(1),
  }),
  hours: z.object({
    weekdays: shortText.min(1),
    saturday: shortText.min(1),
    sunday: shortText.min(1),
  }),
  branches: z.array(branchSchema).min(1).max(10),
  contact: z.object({
    phones: z.array(shortText.min(1)).min(1).max(5),
    email: z.string().trim().email(),
    // General WhatsApp: floating button and general enquiries.
    whatsapp: z.string().trim().regex(/^\d{10,15}$/, "Digits only, with country code, e.g. 18768794816"),
    // China Help Desk: every China Direct button.
    chinaWhatsapp: z.string().trim().regex(/^\d{10,15}$/, "Digits only, with country code, e.g. 18763343323").default("18763343323"),
    // Barrel quotes and order requests go to a different WhatsApp line.
    quotesWhatsapp: z.string().trim().regex(/^\d{10,15}$/, "Digits only, with country code, e.g. 18768794816").default("18768794816"),
  }),
  // Social profile links; leave one blank to hide its icon.
  socials: z
    .object({
      facebook: z.union([z.literal(""), webUrl]),
      instagram: z.union([z.literal(""), webUrl]),
      x: z.union([z.literal(""), webUrl]),
      tiktok: z.union([z.literal(""), webUrl]),
    })
    .default({ facebook: "https://facebook.com/sgxpressja", instagram: "https://instagram.com/sgxpressja/", x: "https://x.com/sgxpressja", tiktok: "https://www.tiktok.com/@sgxpressja" }),
  faqs: z.array(faqSchema).max(80),
  jobs: z
    .array(jobSchema)
    .max(50)
    .refine((list) => new Set(list.map((j) => j.id)).size === list.length, { message: "Two jobs have the same link. Change one of them." })
    .default([]),
  chinaWarehouses: z.object({
    air: z.array(addressFieldSchema).min(1).max(12),
    sea: z.array(addressFieldSchema).min(1).max(12),
    dg: z.array(addressFieldSchema).min(1).max(12),
  }),
  // Every page's sections, edited in /admin → Pages.
  pages: pagesSchema(defaultPages),
});

export type SiteContent = z.infer<typeof contentSchema>;
export type Faq = z.infer<typeof faqSchema>;
export type Branch = z.infer<typeof branchSchema>;
export type Job = z.infer<typeof jobSchema>;
export const FAQ_CATEGORIES = faqSchema.shape.category.options;
