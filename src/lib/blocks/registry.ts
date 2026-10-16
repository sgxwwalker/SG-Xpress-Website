import { FAQ_CATEGORY_LIST } from "./faq-categories";
import type { FieldSpec } from "./fields";

// Every kind of section a page can contain: its name in the admin, what it's for,
// and which fields staff can edit. The look of each lives in components/blocks.

export const TONES = [
  { value: "white", label: "White" },
  { value: "mist", label: "Light grey" },
  { value: "navy", label: "Navy" },
  { value: "gold", label: "Yellow" },
] as const;
export type Tone = (typeof TONES)[number]["value"];

export type BlockDef = {
  name: string;
  description: string;
  group: "Text & pictures" | "Live information";
  fields: FieldSpec[];
  tone?: Tone; // default background; omitted when the section has its own fixed look
};

const heading: FieldSpec = { kind: "text", key: "heading", label: "Heading", max: 150 };
const intro: FieldSpec = { kind: "text", key: "intro", label: "Intro text", multiline: true };
const buttons: FieldSpec = { kind: "buttons", key: "buttons", label: "Buttons", max: 3 };

export const BLOCKS = {
  // ---------- Text & pictures ----------
  hero: {
    name: "Page banner",
    description: "The big navy banner at the top of a page: heading, text, buttons and an optional picture.",
    group: "Text & pictures",
    fields: [
      { kind: "text", key: "eyebrow", label: "Small line above the heading", max: 80 },
      { kind: "text", key: "heading", label: "Heading", max: 150 },
      { kind: "text", key: "highlight", label: "Words in yellow after the heading", max: 60, hint: "Optional, e.g. “with us”." },
      { kind: "text", key: "text", label: "Text under the heading", multiline: true },
      buttons,
      { kind: "list", key: "checks", label: "Ticked points", itemLabel: "Point", max: 6, fields: [{ kind: "text", key: "text", label: "Text", max: 60 }] },
      { kind: "image", key: "image", label: "Picture (shown beside the text)" },
      { kind: "toggle", key: "hideImageOnPhone", label: "Hide the picture on phones" },
      { kind: "select", key: "style", label: "Style", options: [
        { value: "standard", label: "Standard" },
        { value: "large", label: "Large heading" },
        { value: "centered", label: "Centred, capital letters" },
      ] },
    ],
  },
  steps: {
    name: "Numbered steps",
    description: "Steps 1, 2, 3… in cards or as a numbered list.",
    group: "Text & pictures",
    tone: "white",
    fields: [
      heading,
      intro,
      { kind: "list", key: "items", label: "Steps", itemLabel: "Step", max: 8, fields: [
        { kind: "text", key: "title", label: "Title", max: 100 },
        { kind: "text", key: "text", label: "Text", multiline: true },
      ] },
      { kind: "select", key: "style", label: "Style", options: [
        { value: "cards", label: "Cards in a row" },
        { value: "list", label: "Numbered list, two columns" },
      ] },
      buttons,
    ],
  },
  cards: {
    name: "Cards",
    description: "A grid of cards, each with an optional picture or icon, title, text and links. Good for services.",
    group: "Text & pictures",
    tone: "white",
    fields: [
      heading,
      intro,
      { kind: "select", key: "columns", label: "Cards per row (computer)", options: [
        { value: "3", label: "3" },
        { value: "2", label: "2" },
        { value: "4", label: "4 (2 on phones)" },
      ] },
      { kind: "select", key: "cardStyle", label: "Card style", options: [
        { value: "outlined", label: "White with a border" },
        { value: "filled", label: "Light grey" },
      ] },
      { kind: "list", key: "items", label: "Cards", itemLabel: "Card", max: 12, fields: [
        { kind: "image", key: "image", label: "Picture (optional)" },
        { kind: "toggle", key: "showIcon", label: "Show an icon" },
        { kind: "icon", key: "icon", label: "Icon" },
        { kind: "text", key: "title", label: "Title", max: 100 },
        { kind: "text", key: "meta", label: "Small line under the title", max: 120, hint: "Optional, e.g. “Flights {flight days}”." },
        { kind: "text", key: "text", label: "Text", multiline: true },
        { kind: "buttons", key: "buttons", label: "Links", max: 2, hint: "On a white or grey card, one link shows as “Label →”." },
        { kind: "toggle", key: "dark", label: "Navy card (stands out)" },
      ] },
      { kind: "link", key: "moreLink", label: "Link under the cards" },
      { kind: "text", key: "moreLabel", label: "Text for that link", max: 80 },
    ],
  },
  imageText: {
    name: "Picture and text",
    description: "A picture beside a heading, text and buttons. Can include the app store badges.",
    group: "Text & pictures",
    tone: "white",
    fields: [
      heading,
      { kind: "text", key: "text", label: "Text", multiline: true },
      buttons,
      { kind: "toggle", key: "appBadges", label: "Show App Store and Google Play badges" },
      { kind: "image", key: "image", label: "Picture" },
      { kind: "link", key: "imageLink", label: "When the picture is tapped, go to" },
      { kind: "select", key: "imageSide", label: "Picture side (computer)", options: [
        { value: "right", label: "Right" },
        { value: "left", label: "Left" },
      ] },
    ],
  },
  text: {
    name: "Text",
    description: "A heading and formatted text: paragraphs, sub-headings, bullet points, bold and links.",
    group: "Text & pictures",
    tone: "white",
    fields: [heading, { kind: "markdown", key: "body", label: "Text", rows: 10 }, buttons],
  },
  image: {
    name: "Picture",
    description: "A single picture or poster, with an optional caption and link.",
    group: "Text & pictures",
    tone: "white",
    fields: [
      { kind: "image", key: "image", label: "Picture" },
      { kind: "text", key: "caption", label: "Caption", max: 200 },
      { kind: "link", key: "link", label: "When tapped, go to" },
      { kind: "select", key: "size", label: "Size", options: [
        { value: "medium", label: "Medium" },
        { value: "small", label: "Small" },
        { value: "full", label: "Full width" },
      ] },
    ],
  },
  banner: {
    name: "Highlight box",
    description: "A boxed message with a heading, text, tags and buttons, e.g. a promotion.",
    group: "Text & pictures",
    tone: "white",
    fields: [
      heading,
      { kind: "text", key: "text", label: "Text", multiline: true },
      { kind: "list", key: "chips", label: "Tags", itemLabel: "Tag", max: 8, fields: [{ kind: "text", key: "text", label: "Text", max: 40 }] },
      buttons,
      { kind: "select", key: "style", label: "Box colour", options: [
        { value: "navy", label: "Navy" },
        { value: "white", label: "White" },
        { value: "gold", label: "Yellow" },
      ] },
    ],
  },
  note: {
    name: "Important notice",
    description: "A yellow warning box for something customers must know.",
    group: "Text & pictures",
    fields: [{ kind: "text", key: "title", label: "Title", max: 120 }, { kind: "text", key: "text", label: "Text", multiline: true }],
  },
  cta: {
    name: "Call to action",
    description: "A centred closing band: heading, text, big buttons and a small note.",
    group: "Text & pictures",
    tone: "navy",
    fields: [heading, { kind: "text", key: "text", label: "Text", multiline: true }, buttons, { kind: "markdown", key: "footnote", label: "Small note under the buttons", rows: 2 }],
  },
  tiles: {
    name: "List of tiles",
    description: "A heading with short items shown as tiles, and an optional note.",
    group: "Text & pictures",
    tone: "white",
    fields: [
      heading,
      { kind: "list", key: "items", label: "Items", itemLabel: "Item", max: 80, fields: [{ kind: "text", key: "text", label: "Text", max: 120 }] },
      { kind: "markdown", key: "footnote", label: "Note under the tiles", rows: 2 },
    ],
  },
  table: {
    name: "Table",
    description: "A three-column table, e.g. items, what you need and who issues it.",
    group: "Text & pictures",
    tone: "mist",
    fields: [
      heading,
      { kind: "text", key: "col1", label: "Column 1 heading", max: 40 },
      { kind: "text", key: "col2", label: "Column 2 heading", max: 40 },
      { kind: "text", key: "col3", label: "Column 3 heading", max: 40 },
      { kind: "list", key: "rows", label: "Rows", itemLabel: "Row", max: 80, fields: [
        { kind: "text", key: "a", label: "Column 1", max: 200 },
        { kind: "text", key: "b", label: "Column 2", max: 200 },
        { kind: "text", key: "c", label: "Column 3", max: 200 },
      ] },
    ],
  },
  jumpLinks: {
    name: "Jump links",
    description: "A bar of buttons that jump to sections further down the page.",
    group: "Text & pictures",
    fields: [{ kind: "list", key: "items", label: "Links", itemLabel: "Link", max: 8, fields: [
      { kind: "text", key: "label", label: "Label", max: 30 },
      { kind: "text", key: "anchor", label: "Section name to jump to", max: 40, hint: "The “Section name” set on that section, e.g. air." },
    ] }],
  },
  faq: {
    name: "FAQs",
    description: "Questions from the FAQs list: the ones marked for the homepage, or one topic.",
    group: "Text & pictures",
    tone: "mist",
    fields: [
      heading,
      { kind: "select", key: "source", label: "Which questions", options: [
        { value: "featured", label: "Marked “Show on homepage”" },
        { value: "category", label: "One topic" },
      ] },
      { kind: "select", key: "category", label: "Topic", options: FAQ_CATEGORY_LIST.map((c) => ({ value: c, label: c })) },
      { kind: "text", key: "exclude", label: "Leave out questions containing", max: 40 },
      { kind: "number", key: "limit", label: "Most questions to show (0 = all)", min: 0, max: 60 },
      { kind: "link", key: "moreLink", label: "Link under the questions" },
      { kind: "text", key: "moreLabel", label: "Text for that link", max: 80 },
    ],
  },

  // ---------- Live information (filled in from the admin settings) ----------
  airRates: {
    name: "Air rate table",
    description: "All USA air prices by weight, from Air rates & schedule.",
    group: "Live information",
    fields: [heading, { kind: "text", key: "text", label: "Text under the heading", multiline: true }],
  },
  feesTables: {
    name: "Fees tables",
    description: "Processing fee, late invoice and storage charges, from Fees & other rates.",
    group: "Live information",
    tone: "white",
    fields: [
      heading,
      { kind: "text", key: "processingCaption", label: "First table title", max: 80 },
      { kind: "text", key: "underLabel", label: "Row: under 10 lb", max: 80 },
      { kind: "text", key: "overLabel", label: "Row: 10 lb and over", max: 80 },
      { kind: "text", key: "otherCaption", label: "Second table title", max: 80 },
      { kind: "text", key: "lateLabel", label: "Row: late invoice", max: 120 },
      { kind: "text", key: "storageLabel", label: "Row: storage", max: 160 },
      { kind: "text", key: "note", label: "Yellow note", multiline: true },
    ],
  },
  oceanRates: {
    name: "Ocean prices",
    description: "The USA Ocean price boxes, from Fees & other rates.",
    group: "Live information",
    tone: "mist",
    fields: [
      heading,
      { kind: "text", key: "text", label: "Text under the heading", multiline: true },
      { kind: "text", key: "cuftLabel", label: "Box 1 label", max: 60 },
      { kind: "text", key: "smallLabel", label: "Box 2 label", max: 60 },
      { kind: "markdown", key: "after", label: "Text under the boxes", rows: 2 },
      buttons,
    ],
  },
  chinaRates: {
    name: "China price table",
    description: "China air and sea prices with an optional picture, from Fees & other rates.",
    group: "Live information",
    tone: "white",
    fields: [
      heading,
      { kind: "text", key: "airExtra", label: "Air: extra line", max: 60 },
      { kind: "text", key: "seaExtra", label: "Sea: extra line", max: 60 },
      { kind: "text", key: "note", label: "Text under the table", multiline: true },
      buttons,
      { kind: "image", key: "image", label: "Picture" },
      { kind: "link", key: "imageLink", label: "When the picture is tapped, go to" },
    ],
  },
  chinaOptions: {
    name: "China air vs sea",
    description: "The China Air and China Sea cards and the dangerous goods box.",
    group: "Live information",
    tone: "white",
    fields: [
      heading,
      { kind: "text", key: "airTitle", label: "Air: title", max: 60 },
      { kind: "text", key: "airNote", label: "Air: note", max: 200 },
      { kind: "text", key: "airBest", label: "Air: best for", max: 200 },
      { kind: "text", key: "airAvoid", label: "Air: avoid", max: 200 },
      { kind: "text", key: "seaTitle", label: "Sea: title", max: 60 },
      { kind: "text", key: "seaPrice", label: "Sea: price line", max: 60 },
      { kind: "text", key: "seaNote", label: "Sea: note", max: 300 },
      { kind: "text", key: "seaBest", label: "Sea: best for", max: 200 },
      { kind: "buttons", key: "seaButtons", label: "Sea: button", max: 1 },
      { kind: "text", key: "dgHeading", label: "Dangerous goods: heading", max: 80 },
      { kind: "text", key: "dgText", label: "Dangerous goods: text", multiline: true },
      { kind: "list", key: "dgItems", label: "Dangerous goods: examples", itemLabel: "Example", max: 6, fields: [{ kind: "text", key: "text", label: "Text", max: 30 }] },
      { kind: "link", key: "dgLink", label: "Dangerous goods: link" },
      { kind: "text", key: "dgLinkLabel", label: "Dangerous goods: link text", max: 80 },
    ],
  },
  chinaAddresses: {
    name: "China addresses",
    description: "The Air, Sea and Dangerous goods addresses with copy buttons, from China addresses.",
    group: "Live information",
    tone: "white",
    fields: [
      heading,
      intro,
      { kind: "image", key: "airImage", label: "Air label picture" },
      { kind: "image", key: "seaImage", label: "Sea label picture" },
      { kind: "image", key: "dgImage", label: "Dangerous goods label picture" },
    ],
  },
  airSchedule: {
    name: "Air schedule",
    description: "Cutoff, flight, clearance and collection days, from Air rates & schedule.",
    group: "Live information",
    tone: "mist",
    fields: [heading, intro],
  },
  warehouseHours: {
    name: "Florida warehouse hours",
    description: "The Florida warehouse opening hours, from Air rates & schedule.",
    group: "Live information",
    tone: "white",
    fields: [heading],
  },
  branchCards: {
    name: "Branch cards",
    description: "Each branch with hours, Directions and Call buttons, from Branches & contact.",
    group: "Live information",
    tone: "white",
    fields: [heading],
  },
  branchLinks: {
    name: "Branch directions",
    description: "Opening hours and a Directions link for each branch, from Branches & contact.",
    group: "Live information",
    tone: "mist",
    fields: [heading],
  },
  calculator: {
    name: "Shipping calculator",
    description: "The USA Air and Ocean cost calculator.",
    group: "Live information",
    tone: "mist",
    fields: [buttons, { kind: "markdown", key: "footnote", label: "Small note under the buttons", rows: 2 }],
  },
  faqExplorer: {
    name: "FAQ search",
    description: "All FAQs with a search box and topic filters.",
    group: "Live information",
    tone: "white",
    fields: [{ kind: "markdown", key: "footnote", label: "Note under the questions", rows: 2 }],
  },
  helpContacts: {
    name: "Help contacts",
    description: "Call, WhatsApp and email tiles, from Branches & contact.",
    group: "Live information",
    tone: "mist",
    fields: [heading, intro],
  },
  contactPanel: {
    name: "Contact details and form",
    description: "Phones, WhatsApp, China Help Desk, email, hours, social links and the message form.",
    group: "Live information",
    tone: "mist",
    fields: [
      heading,
      { kind: "text", key: "highlight", label: "Words in yellow after the heading", max: 60 },
      { kind: "text", key: "formHeading", label: "Form heading", max: 100 },
      { kind: "text", key: "formIntro", label: "Form intro", multiline: true },
    ],
  },
  jobs: {
    name: "Job openings",
    description: "Open jobs from Careers, or a message when there are none.",
    group: "Live information",
    tone: "mist",
    fields: [
      heading,
      { kind: "text", key: "emptyTitle", label: "No openings: title", max: 100 },
      { kind: "text", key: "emptyText", label: "No openings: text", multiline: true },
      { kind: "text", key: "moreHeading", label: "Box under the jobs: heading", max: 100 },
      { kind: "text", key: "moreText", label: "Box under the jobs: text", multiline: true },
      { kind: "text", key: "applyLabel", label: "General application button text", max: 60 },
      { kind: "text", key: "moreButton", label: "Box under the jobs: button text", max: 60 },
    ],
  },
} satisfies Record<string, BlockDef>;

export type BlockType = keyof typeof BLOCKS;
export const BLOCK_TYPES = Object.keys(BLOCKS) as BlockType[];
