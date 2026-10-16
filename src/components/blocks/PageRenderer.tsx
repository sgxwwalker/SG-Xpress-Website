import type { BlockType } from "@/lib/blocks/registry";
import type { SiteContent } from "@/lib/content/schema";
import type { Page } from "@/lib/content/pages-schema";
import { Banner, Cards, Cta, Faqs, Hero, ImageText, JumpLinks, Note, Picture1, Stats, Steps, Table, Text, Tiles } from "./basic";
import {
  AirRates, AirScheduleBlock, BranchCardsBlock, BranchLinks, Calculator, ChinaAddressesBlock, ChinaOptions, ChinaRates,
  ContactPanel, FaqExplorerBlock, FeesTables, HelpContacts, Jobs, OceanRates, WarehouseHoursBlock,
} from "./live";
import type { BlockProps } from "./shared";

// Turns a page's list of sections into the page. Used by the public site and by the
// live preview in the admin, so what staff see while editing is what customers get.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RENDER: Record<BlockType, (props: BlockProps<any>) => React.ReactNode> = {
  hero: Hero,
  steps: Steps,
  cards: Cards,
  imageText: ImageText,
  text: Text,
  image: Picture1,
  banner: Banner,
  stats: Stats,
  note: Note,
  cta: Cta,
  tiles: Tiles,
  table: Table,
  jumpLinks: JumpLinks,
  faq: Faqs,
  airRates: AirRates,
  feesTables: FeesTables,
  oceanRates: OceanRates,
  chinaRates: ChinaRates,
  chinaOptions: ChinaOptions,
  chinaAddresses: ChinaAddressesBlock,
  airSchedule: AirScheduleBlock,
  warehouseHours: WarehouseHoursBlock,
  branchCards: BranchCardsBlock,
  branchLinks: BranchLinks,
  calculator: Calculator,
  faqExplorer: FaqExplorerBlock,
  helpContacts: HelpContacts,
  contactPanel: ContactPanel,
  jobs: Jobs,
};

export function PageRenderer({ page, content }: { page: Page; content: SiteContent }) {
  const visible = page.sections.filter((s) => !s.hidden);
  return (
    <>
      {visible.map((s, i) => {
        const Block = RENDER[s.type];
        if (!Block) return null;
        return (
          <Block
            key={s.id}
            p={s.props}
            c={content}
            id={s.id}
            anchor={s.anchor || undefined}
            tone={s.tone as BlockProps<unknown>["tone"]}
            first={i === 0}
          />
        );
      })}
    </>
  );
}
