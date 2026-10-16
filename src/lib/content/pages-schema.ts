import { z } from "zod";
import { propsSchema } from "@/lib/blocks/fields";
import { BLOCKS, BLOCK_TYPES, TONES, type BlockType } from "@/lib/blocks/registry";

// The editable pages: the built-in ones (always present, fixed web address) and any
// extra pages staff create, e.g. a promotion. Each is a list of sections.

export const BUILTIN_PAGES = [
  { id: "home", path: "/", name: "Home" },
  { id: "rates", path: "/rates", name: "Rates" },
  { id: "calculator", path: "/calculator", name: "Calculator" },
  { id: "china-direct", path: "/china-direct", name: "China Direct" },
  { id: "faqs", path: "/faqs", name: "FAQs" },
  { id: "about", path: "/about", name: "About" },
  { id: "contact", path: "/contact", name: "Contact" },
  { id: "careers", path: "/careers", name: "Careers" },
  { id: "restricted-items", path: "/restricted-items", name: "Restricted items" },
  { id: "terms", path: "/terms", name: "Terms and conditions" },
  { id: "privacy", path: "/privacy", name: "Privacy" },
] as const;
export type BuiltinPageId = (typeof BUILTIN_PAGES)[number]["id"];
const BUILTIN_IDS = new Set<string>(BUILTIN_PAGES.map((p) => p.id));

/** Web addresses a new page can't use, because the site or the server already uses them. */
export const RESERVED_SLUGS = new Set<string>([
  ...BUILTIN_IDS,
  "admin", "media", "api", "images", "careers", "sitemap.xml", "robots.txt", "icon.png", "apple-icon.png", "favicon.ico",
  "rate-sheet", "terms-and-conditions", "about-us", "our-services", "services", "china", "_next",
]);

const ID = /^[a-z0-9-]{1,40}$/;
export const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/;

const sectionVariants = BLOCK_TYPES.map((type) =>
  z.object({
    id: z.string().regex(ID),
    type: z.literal(type),
    hidden: z.boolean(),
    anchor: z.union([z.literal(""), z.string().regex(ID, "Section names use lowercase letters, numbers and dashes, e.g. air-rates.")]),
    tone: z.enum(TONES.map((t) => t.value) as [string, ...string[]]),
    props: propsSchema(BLOCKS[type].fields),
  }),
);
export const sectionSchema = z.discriminatedUnion("type", sectionVariants as unknown as [(typeof sectionVariants)[number], ...(typeof sectionVariants)[number][]]);

export const pageSchema = z.object({
  id: z.string().regex(ID),
  slug: z.string().max(60),
  name: z.string().trim().min(1, "Give the page a name.").max(80),
  seoTitle: z.string().trim().max(70, "Google title: keep it under 70 characters."),
  seoDescription: z.string().trim().max(200, "Google description: keep it under 200 characters."),
  published: z.boolean(),
  showInFooter: z.boolean(),
  sections: z.array(sectionSchema).max(40, "A page can have up to 40 sections."),
});

export type Section = {
  id: string;
  type: BlockType;
  hidden: boolean;
  anchor: string;
  tone: string;
  props: Record<string, unknown>;
};
export type Page = Omit<z.infer<typeof pageSchema>, "sections"> & { sections: Section[] };

export function isBuiltin(id: string): boolean {
  return BUILTIN_IDS.has(id);
}

export function pagePath(p: Pick<Page, "id" | "slug">): string {
  return BUILTIN_PAGES.find((b) => b.id === p.id)?.path ?? `/${p.slug}`;
}

/** Validates the page list; `defaults` fills in any built-in page that's missing (e.g. one added in an update). */
export function pagesSchema(defaults: () => Page[]) {
  return z.preprocess(
    (v) => {
      if (!Array.isArray(v)) return v;
      const ids = new Set(v.map((p) => (p as { id?: string })?.id));
      return [...v, ...defaults().filter((d) => !ids.has(d.id))];
    },
    z
      .array(pageSchema)
      .max(60)
      .superRefine((pages, ctx) => {
        const ids = new Set<string>();
        const slugs = new Set<string>();
        pages.forEach((p, i) => {
          const at = (message: string, key: string) => ctx.addIssue({ code: "custom", message, path: [i, key] });
          if (ids.has(p.id)) at("Two pages have the same id.", "id");
          ids.add(p.id);
          if (!isBuiltin(p.id)) {
            if (!SLUG.test(p.slug)) at("Web address: use lowercase letters, numbers and dashes, e.g. summer-sale.", "slug");
            else if (RESERVED_SLUGS.has(p.slug)) at(`The web address “/${p.slug}” is already used by the site. Choose another.`, "slug");
            else if (slugs.has(p.slug)) at(`Two pages use the web address “/${p.slug}”.`, "slug");
            slugs.add(p.slug);
          }
          const anchors = new Set<string>();
          p.sections.forEach((s, j) => {
            if (s.anchor && anchors.has(s.anchor)) ctx.addIssue({ code: "custom", message: `Two sections are both named “${s.anchor}”.`, path: [i, "sections", j, "anchor"] });
            anchors.add(s.anchor);
          });
        });
      }),
  ).default(defaults);
}
