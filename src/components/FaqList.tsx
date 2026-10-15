import type { Faq } from "@/lib/content/schema";

/** Stable anchor for a question, e.g. /faqs#how-do-i-track-my-package */
export function faqId(q: string): string {
  return q.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/** Plain-text answer: lines starting "- " or "* " become a bullet list; other lines become paragraphs. */
function Answer({ text }: { text: string }) {
  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];
  const flush = () => {
    if (bullets.length) {
      blocks.push(
        <ul key={blocks.length} className="list-disc space-y-1 pl-5">
          {bullets.map((b, i) => <li key={i}>{b}</li>)}
        </ul>,
      );
      bullets = [];
    }
  };
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (/^[-*•]\s+/.test(line)) bullets.push(line.replace(/^[-*•]\s+/, ""));
    else {
      flush();
      if (line) blocks.push(<p key={blocks.length}>{line}</p>);
    }
  }
  flush();
  return <div className="space-y-2 pb-5 pr-8 text-muted">{blocks}</div>;
}

/** Native <details> accordions: work without JavaScript and are keyboard-accessible. */
export function FaqList({ faqs, openFirst = false }: { faqs: Faq[]; openFirst?: boolean }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {faqs.map((f, i) => (
        <details key={f.q} id={faqId(f.q)} open={openFirst && i === 0} className="group scroll-mt-28">
          <summary className="flex min-h-16 cursor-pointer items-center justify-between gap-4 py-4 text-left text-base font-semibold md:text-lg">
            {f.q}
            <span aria-hidden="true" className="faq-sign flex-none text-2xl font-medium transition-transform">+</span>
          </summary>
          <Answer text={f.a} />
        </details>
      ))}
    </div>
  );
}
