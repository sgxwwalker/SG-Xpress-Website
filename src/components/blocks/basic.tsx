import type { ButtonValue, IconName, ImageValue, LinkValue } from "@/lib/blocks/fields";
import { fill } from "@/lib/blocks/tokens";
import { AppLinks } from "../AppLinks";
import { FaqList } from "../FaqList";
import { IconAlert, IconCheck } from "../Icons";
import { Inline, Prose } from "../Prose";
import { H2, IconTile, Section } from "../ui";
import { Icon, LinkButton, MaybeLink, muted, Picture, TextLink, type BlockProps } from "./shared";

// The "Text & pictures" sections. Each matches a section of the original design.

type Item = { text: string };

// ---- Page banner ----
export function Hero({ p, c, id, anchor, first }: BlockProps<{
  eyebrow: string; heading: string; highlight: string; text: string; buttons: ButtonValue[]; checks: Item[];
  image: ImageValue; hideImageOnPhone: boolean; style: "standard" | "large" | "centered";
}>) {
  const heading = (
    <>
      {fill(p.heading, c)}
      {p.highlight ? <> <span className="text-gold">{fill(p.highlight, c)}</span></> : null}
    </>
  );
  const [lead, ...rest] = p.buttons;
  const buttons = lead ? (
    <div className="flex flex-col gap-3 sm:max-w-md">
      <LinkButton b={lead} c={c} where={id} size="lg" />
      {rest.length === 2 ? (
        <div className="grid grid-cols-2 gap-3">{rest.map((b, i) => <LinkButton key={i} b={b} c={c} where={id} size="sm" />)}</div>
      ) : (
        rest.map((b, i) => <LinkButton key={i} b={b} c={c} where={id} />)
      )}
    </div>
  ) : null;

  if (p.style === "centered") {
    return (
      <section id={anchor} className="bg-navy text-white">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-10 text-center md:px-6 md:pb-14 md:pt-16">
          {p.eyebrow ? <p className="mb-2 text-sm font-semibold text-on-navy">{fill(p.eyebrow, c)}</p> : null}
          <h1 className="text-3xl font-extrabold uppercase leading-tight md:text-5xl">{heading}</h1>
          <span aria-hidden="true" className="mx-auto mt-4 block h-1 w-20 rounded-full bg-gold" />
          {p.text ? <p className="mx-auto mt-4 max-w-xl text-on-navy">{fill(p.text, c)}</p> : null}
          {lead ? <div className="mx-auto mt-6 flex justify-center">{buttons}</div> : null}
        </div>
      </section>
    );
  }

  const hasImage = Boolean(p.image.src);
  return (
    <section id={anchor} className="bg-navy text-white">
      <div className={hasImage ? "mx-auto grid max-w-6xl items-center gap-8 px-4 py-8 md:px-6 md:py-16 lg:grid-cols-2" : "mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-14"}>
        <div className="flex flex-col gap-5">
          <div>
            {p.eyebrow ? <p className="mb-2 text-sm font-semibold text-on-navy">{fill(p.eyebrow, c)}</p> : null}
            <h1 className={p.style === "large" ? "text-[34px] font-extrabold leading-[1.08] md:text-6xl" : "text-[31px] font-extrabold leading-tight md:text-5xl"}>{heading}</h1>
          </div>
          {p.text ? <p className="max-w-2xl text-lg text-on-navy">{fill(p.text, c)}</p> : null}
          {buttons}
          {p.checks.length ? (
            <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-on-navy">
              {p.checks.map((t, i) => (
                <li key={i} className="flex items-center gap-1.5"><IconCheck className="h-4 w-4 text-gold" />{fill(t.text, c)}</li>
              ))}
            </ul>
          ) : null}
        </div>
        <Picture
          image={p.image}
          priority={first}
          sizes={p.hideImageOnPhone ? "(min-width: 1024px) 560px, 1px" : "(min-width: 1024px) 560px, 100vw"}
          className={p.hideImageOnPhone ? "hidden rounded-2xl lg:block" : "w-full rounded-2xl"}
        />
      </div>
    </section>
  );
}

// ---- Numbered steps ----
const COLS: Record<number, string> = { 1: "", 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4" };

export function Steps({ p, c, id, anchor, tone }: BlockProps<{ heading: string; intro: string; items: { title: string; text: string }[]; style: "cards" | "list"; buttons: ButtonValue[] }>) {
  return (
    <Section id={anchor} tone={tone}>
      {p.heading ? <H2>{fill(p.heading, c)}</H2> : null}
      {p.intro ? <p className={`mt-2 ${muted(tone)}`}>{fill(p.intro, c)}</p> : null}
      {p.style === "list" ? (
        <ol className="mt-6 grid gap-4 md:grid-cols-2">
          {p.items.map((x, i) => (
            <li key={i} className="flex gap-4">
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-gold text-lg font-extrabold text-navy">{i + 1}</span>
              <div>
                <h3 className="font-bold">{fill(x.title, c)}</h3>
                <p className={`text-sm ${muted(tone)}`}>{fill(x.text, c)}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <ol className={`mt-6 grid gap-3 ${COLS[Math.min(p.items.length, 4)] ?? ""}`}>
          {p.items.map((s, i) => (
            <li key={i} className={`flex gap-4 rounded-2xl p-4 text-navy md:flex-col ${tone === "white" ? "bg-mist" : "border border-line bg-white"}`}>
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-navy text-lg font-extrabold text-gold">{i + 1}</span>
              <div>
                <h3 className="text-lg font-bold">{fill(s.title, c)}</h3>
                <p className="text-sm text-muted">{fill(s.text, c)}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
      {p.buttons.length ? (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {p.buttons.map((b, i) => <LinkButton key={i} b={b} c={c} where={id} className="w-full sm:w-auto" />)}
        </div>
      ) : null}
    </Section>
  );
}

// ---- Cards ----
type Card = { image: ImageValue; showIcon: boolean; icon: IconName; title: string; meta: string; text: string; buttons: ButtonValue[]; dark: boolean };
const GRID: Record<string, string> = { "2": "gap-4 md:grid-cols-2", "3": "gap-4 md:grid-cols-2 lg:grid-cols-3", "4": "grid-cols-2 gap-3 lg:grid-cols-4" };

export function Cards({ p, c, id, anchor, tone }: BlockProps<{ heading: string; intro: string; columns: string; cardStyle: "outlined" | "filled"; items: Card[]; moreLink: LinkValue; moreLabel: string }>) {
  const Title = p.heading ? "h3" : "h2";
  return (
    <Section id={anchor} tone={tone}>
      {p.heading ? <H2>{fill(p.heading, c)}</H2> : null}
      {p.intro ? <p className={`mt-2 ${muted(tone)}`}>{fill(p.intro, c)}</p> : null}
      <div className={`grid ${p.heading || p.intro ? "mt-6" : ""} ${GRID[p.columns] ?? GRID["3"]}`}>
        {p.items.map((card, i) => {
          const shell = card.dark
            ? "bg-navy text-white"
            : p.cardStyle === "filled"
              ? tone === "mist" ? "bg-white text-navy" : "bg-mist text-navy"
              : "border border-line bg-white text-navy";
          const sub = card.dark ? "text-on-navy" : "text-muted";
          const icon = card.showIcon ? <IconTile tone={card.dark ? "gold" : "navy"}><Icon name={card.icon} /></IconTile> : null;
          const asButtons = card.dark || card.buttons.length > 1;
          return (
            <article key={i} className={`flex flex-col overflow-hidden rounded-2xl ${shell}`}>
              <Picture image={card.image} sizes="(min-width: 1024px) 360px, (min-width: 768px) 50vw, 100vw" className="w-full" />
              <div className="flex flex-1 flex-col gap-3 p-5">
                {card.meta ? (
                  <div className="flex items-center gap-3">
                    {icon}
                    <div>
                      <Title className="text-lg font-bold">{fill(card.title, c)}</Title>
                      <p className={`text-sm font-medium ${sub}`}>{fill(card.meta, c)}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {icon}
                    <Title className="text-lg font-bold">{fill(card.title, c)}</Title>
                  </>
                )}
                {card.text ? <p className={`text-sm ${sub}`}>{fill(card.text, c)}</p> : null}
                {card.buttons.length ? (
                  asButtons ? (
                    <div className={`mt-auto grid gap-2 ${card.buttons.length > 1 ? "grid-cols-2" : ""}`}>
                      {card.buttons.map((b, j) => <LinkButton key={j} b={b} c={c} where={`${id}-${i + 1}`} />)}
                    </div>
                  ) : (
                    <TextLink link={card.buttons[0].link} label={card.buttons[0].label} c={c} where={`${id}-${i + 1}`} className="mt-auto inline-flex min-h-11 items-center font-semibold" />
                  )
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
      <TextLink link={p.moreLink} label={p.moreLabel} c={c} where={id} className="mt-4 inline-flex min-h-11 items-center font-semibold" />
    </Section>
  );
}

// ---- Picture and text ----
export function ImageText({ p, c, id, anchor, tone }: BlockProps<{ heading: string; text: string; buttons: ButtonValue[]; appBadges: boolean; image: ImageValue; imageLink: LinkValue; imageSide: "right" | "left" }>) {
  return (
    <Section id={anchor} tone={tone}>
      <div className="grid items-center gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          {p.heading ? <H2>{fill(p.heading, c)}</H2> : null}
          {p.text ? <p>{fill(p.text, c)}</p> : null}
          {p.appBadges ? <AppLinks /> : null}
          {p.buttons.length ? (
            <div className="flex flex-col gap-3 sm:flex-row">{p.buttons.map((b, i) => <LinkButton key={i} b={b} c={c} where={id} />)}</div>
          ) : null}
        </div>
        <MaybeLink link={p.imageLink} c={c} where={id} label={p.image.alt} className={`mx-auto block w-full max-w-md ${p.imageSide === "left" ? "md:order-first" : ""}`}>
          <Picture image={p.image} sizes="(min-width: 768px) 440px, 100vw" className="w-full rounded-2xl shadow-xl shadow-navy-deep/20" />
        </MaybeLink>
      </div>
    </Section>
  );
}

// ---- Text ----
export function Text({ p, c, id, anchor, tone }: BlockProps<{ heading: string; body: string; buttons: ButtonValue[] }>) {
  return (
    <Section id={anchor} tone={tone}>
      {p.heading ? <H2 className="mb-4">{fill(p.heading, c)}</H2> : null}
      <Prose markdown={fill(p.body, c)} className={tone === "navy" ? "text-white" : ""} />
      {p.buttons.length ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">{p.buttons.map((b, i) => <LinkButton key={i} b={b} c={c} where={id} className="w-full sm:w-auto" />)}</div>
      ) : null}
    </Section>
  );
}

// ---- Picture ----
const SIZE: Record<string, string> = { small: "max-w-sm", medium: "max-w-2xl", full: "max-w-none" };

export function Picture1({ p, c, id, anchor, tone }: BlockProps<{ image: ImageValue; caption: string; link: LinkValue; size: string }>) {
  if (!p.image.src) return null;
  return (
    <Section id={anchor} tone={tone}>
      <figure className={`mx-auto w-full ${SIZE[p.size] ?? SIZE.medium}`}>
        <MaybeLink link={p.link} c={c} where={id} label={p.image.alt} className="block overflow-hidden rounded-2xl">
          <Picture image={p.image} sizes={p.size === "full" ? "100vw" : "(min-width: 768px) 672px, 100vw"} className="w-full" />
        </MaybeLink>
        {p.caption ? <figcaption className={`mt-2 text-center text-sm ${muted(tone)}`}>{fill(p.caption, c)}</figcaption> : null}
      </figure>
    </Section>
  );
}

// ---- Highlight box ----
export function Banner({ p, c, id, anchor, tone }: BlockProps<{ heading: string; text: string; chips: Item[]; buttons: ButtonValue[]; style: "navy" | "white" | "gold" }>) {
  const box = {
    navy: "bg-navy text-white p-6 md:p-8",
    white: "border border-line bg-white text-navy p-5 md:p-6",
    gold: "border-2 border-gold bg-gold-soft text-navy p-5 md:p-6",
  }[p.style];
  return (
    <Section id={anchor} tone={tone}>
      <div className={`flex flex-col gap-4 rounded-2xl md:flex-row md:items-center md:justify-between ${box}`}>
        <div>
          {p.style === "navy" ? <h2 className="text-2xl font-extrabold">{fill(p.heading, c)}</h2> : <H2>{fill(p.heading, c)}</H2>}
          {p.text ? <p className={`mt-2 ${p.style === "navy" ? "text-on-navy" : ""}`}>{fill(p.text, c)}</p> : null}
          {p.chips.length ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {p.chips.map((x, i) => <li key={i} className={`rounded-xl px-3 py-2.5 text-sm font-semibold ${p.style === "navy" ? "bg-white/10" : "bg-mist"}`}>{fill(x.text, c)}</li>)}
            </ul>
          ) : null}
        </div>
        {p.buttons.length ? (
          <div className="flex w-full flex-none flex-col gap-2 md:w-auto">
            {p.buttons.map((b, i) => <LinkButton key={i} b={b} c={c} where={id} />)}
          </div>
        ) : null}
      </div>
    </Section>
  );
}

// ---- Important notice ----
export function Note({ p, c, anchor }: BlockProps<{ title: string; text: string }>) {
  return (
    <div id={anchor} className="mx-auto max-w-6xl px-4 pt-6 md:px-6">
      <div role="note" className="flex gap-3 rounded-2xl border-2 border-[#b07f00] bg-gold-soft p-4">
        <IconAlert className="h-6 w-6 flex-none text-gold-text" />
        <div>
          <h2 className="font-bold">{fill(p.title, c)}</h2>
          {p.text ? <p className="text-sm">{fill(p.text, c)}</p> : null}
        </div>
      </div>
    </div>
  );
}

// ---- Call to action ----
export function Cta({ p, c, id, anchor, tone }: BlockProps<{ heading: string; text: string; buttons: ButtonValue[]; footnote: string }>) {
  const linkClass = "underline";
  return (
    <Section id={anchor} tone={tone}>
      <div className="flex flex-col gap-4 md:items-center md:text-center">
        {p.heading ? <H2>{fill(p.heading, c)}</H2> : null}
        {p.text ? <p className={muted(tone)}>{fill(p.text, c)}</p> : null}
        {p.buttons.map((b, i) => <LinkButton key={i} b={b} c={c} where={id} size={i === 0 ? "lg" : "md"} className="md:min-w-80" />)}
        {p.footnote ? <p className={`text-sm ${muted(tone)}`}><Inline text={fill(p.footnote, c)} linkClass={linkClass} /></p> : null}
      </div>
    </Section>
  );
}

// ---- List of tiles ----
export function Tiles({ p, c, anchor, tone }: BlockProps<{ heading: string; items: Item[]; footnote: string }>) {
  return (
    <Section id={anchor} tone={tone}>
      {p.heading ? <H2>{fill(p.heading, c)}</H2> : null}
      <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {p.items.map((x, i) => <li key={i} className={`rounded-xl px-4 py-3 font-medium text-navy ${tone === "white" ? "bg-mist" : "bg-white"}`}>{fill(x.text, c)}</li>)}
      </ul>
      {p.footnote ? <p className={`mt-6 text-sm ${muted(tone)}`}><Inline text={fill(p.footnote, c)} /></p> : null}
    </Section>
  );
}

// ---- Table ----
export function Table({ p, c, anchor, tone }: BlockProps<{ heading: string; col1: string; col2: string; col3: string; rows: { a: string; b: string; c: string }[] }>) {
  return (
    <Section id={anchor} tone={tone}>
      {p.heading ? <H2>{fill(p.heading, c)}</H2> : null}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-white text-navy">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-navy text-left text-white">
            <tr>
              <th scope="col" className="px-4 py-3">{p.col1}</th>
              <th scope="col" className="px-4 py-3">{p.col2}</th>
              <th scope="col" className="px-4 py-3">{p.col3}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {p.rows.map((r, i) => (
              <tr key={i}>
                <th scope="row" className="px-4 py-3 text-left font-semibold">{fill(r.a, c)}</th>
                <td className="px-4 py-3">{fill(r.b, c)}</td>
                <td className="px-4 py-3">{fill(r.c, c)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

// ---- Jump links ----
export function JumpLinks({ p, anchor }: BlockProps<{ items: { label: string; anchor: string }[] }>) {
  return (
    <nav id={anchor} aria-label="On this page" className="sticky top-16 z-30 border-b border-line bg-white md:top-20">
      <ul className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-2.5 md:px-6">
        {p.items.map((j, i) => (
          <li key={i} className="flex-none">
            <a href={`#${j.anchor.replace(/^#/, "")}`} className="flex h-10 items-center rounded-full border border-line px-4 text-sm font-semibold hover:bg-mist">{j.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// ---- FAQs ----
export function Faqs({ p, c, id, anchor, tone }: BlockProps<{ heading: string; source: "featured" | "category"; category: string; exclude: string; limit: number; moreLink: LinkValue; moreLabel: string }>) {
  let faqs = p.source === "featured" ? c.faqs.filter((f) => f.featured) : c.faqs.filter((f) => f.category === p.category);
  if (p.exclude.trim()) faqs = faqs.filter((f) => !f.q.toLowerCase().includes(p.exclude.trim().toLowerCase()));
  if (p.limit > 0) faqs = faqs.slice(0, p.limit);
  return (
    <Section id={anchor} tone={tone}>
      {p.heading ? <H2>{fill(p.heading, c)}</H2> : null}
      <div className="mt-4 text-navy"><FaqList faqs={faqs} openFirst /></div>
      <TextLink link={p.moreLink} label={p.moreLabel} c={c} where={id} className="mt-4 inline-flex min-h-11 items-center font-semibold" />
    </Section>
  );
}
