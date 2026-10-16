import { btn, emptyProps, REGISTER, withDefaults } from "@/lib/blocks/fields";
import { BLOCKS, type BlockType, type Tone } from "@/lib/blocks/registry";
import type { Page, Section } from "./pages-schema";

// Building sections and pages: used for the default pages and when staff add new ones.

export function makeSections(pageId: string, list: [BlockType, Record<string, unknown>, { anchor?: string; tone?: Tone }?][]): Section[] {
  return list.map(([type, props, opts], i) => ({
    id: `${pageId}-${i + 1}`,
    type,
    hidden: false,
    anchor: opts?.anchor ?? "",
    tone: opts?.tone ?? defaultTone(type),
    props: withDefaults(BLOCKS[type].fields, props),
  }));
}

export function defaultTone(type: BlockType): Tone {
  const def = BLOCKS[type] as { tone?: Tone };
  return def.tone ?? "white";
}

const SIGN_UP = btn("Sign up free", REGISTER, "gold");

/** Friendly starting text for a section staff add, so they edit rather than start from blank. */
const STARTERS: Partial<Record<BlockType, Record<string, unknown>>> = {
  hero: { heading: "Your heading here", text: "A short line about this page.", buttons: [SIGN_UP] },
  steps: { heading: "How it works", items: [{ title: "Step one", text: "Describe the first step." }, { title: "Step two", text: "Describe the next step." }, { title: "Step three", text: "Describe the last step." }] },
  cards: { heading: "Heading", items: [1, 2, 3].map((n) => ({ title: `Card ${n}`, text: "Short description.", showIcon: true, icon: "box" })) },
  imageText: { heading: "Heading", text: "Describe this picture or offer." },
  text: { heading: "Heading", body: "Write your text here.\n\nLeave a blank line between paragraphs." },
  image: { size: "medium" },
  banner: { heading: "Special offer", text: "Describe the offer.", buttons: [SIGN_UP] },
  note: { title: "Please note", text: "Something customers must know." },
  cta: { heading: "Ready to ship with SG Xpress?", text: "Free to join. Your US address is ready right after sign-up.", buttons: [SIGN_UP] },
  tiles: { heading: "Heading", items: [{ text: "Item one" }, { text: "Item two" }, { text: "Item three" }] },
  table: { heading: "Heading", col1: "Column 1", col2: "Column 2", col3: "Column 3", rows: [{ a: "", b: "", c: "" }] },
  faq: { heading: "Questions", source: "featured", limit: 6 },
  airRates: { heading: "Air freight by weight", text: "{air transit}, flights {flight days}. Freight only." },
  airSchedule: { heading: "USA air shipping schedule" },
  warehouseHours: { heading: "Florida warehouse hours" },
  branchCards: { heading: "Our branches" },
  branchLinks: { heading: "Visit us" },
  helpContacts: { heading: "Need help?" },
  chinaAddresses: { heading: "Our China addresses" },
  jobs: { heading: "Current openings", emptyTitle: "No openings right now", applyLabel: "Send a general application", moreButton: "Apply anyway" },
  calculator: { buttons: [SIGN_UP] },
};

export function newSection(type: BlockType): Section {
  return {
    id: `s-${crypto.randomUUID().slice(0, 8)}`,
    type,
    hidden: false,
    anchor: "",
    tone: defaultTone(type),
    props: withDefaults(BLOCKS[type].fields, { ...emptyProps(BLOCKS[type].fields), ...STARTERS[type] }),
  };
}

/** A brand-new page created in the admin: starts as a draft with three sections. */
export function newPage(name: string, slug: string): Page {
  const id = `p-${crypto.randomUUID().slice(0, 8)}`;
  return {
    id,
    slug,
    name,
    seoTitle: name,
    seoDescription: "",
    published: false,
    showInFooter: false,
    sections: [newSection("hero"), newSection("text"), newSection("cta")].map((s, i) => (i === 0 ? { ...s, props: { ...s.props, heading: name } } : s)),
  };
}

/** "Summer Sale 2026!" → "summer-sale-2026" */
export function slugify(text: string): string {
  return text.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}
