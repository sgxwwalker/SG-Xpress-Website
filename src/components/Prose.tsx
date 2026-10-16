import Link from "next/link";

// Renders the simple formatting staff can use in text boxes:
//   ### Sub-heading      - bullet point      **bold**      [link text](/page or https://…)
// No HTML is ever injected, and links can only go to this site, https://, email or phone.

const SAFE_HREF = /^(\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i;

/** One line of text with **bold** and [links](…). */
export function Inline({ text, linkClass = "font-semibold underline" }: { text: string; linkClass?: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) return <strong key={i}>{part.slice(2, -2)}</strong>;
        const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
        if (link) {
          const [, label, href] = link;
          if (!SAFE_HREF.test(href)) return label;
          return href.startsWith("/") || href.startsWith("#") ? (
            <Link key={i} href={href} className={linkClass}>{label}</Link>
          ) : (
            <a key={i} href={href} className={linkClass}>{label}</a>
          );
        }
        return part;
      })}
    </>
  );
}

export function Prose({ markdown, className = "" }: { markdown: string; className?: string }) {
  const blocks = markdown.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const out: React.ReactNode[] = [];
  let list: string[] = [];

  const flush = () => {
    if (list.length) {
      out.push(
        <ul key={`ul-${out.length}`} className="list-disc space-y-1 pl-5">
          {list.map((li, i) => <li key={i}><Inline text={li} /></li>)}
        </ul>,
      );
      list = [];
    }
  };

  for (const block of blocks) {
    for (const line of block.split("\n")) {
      const l = line.trim();
      if (l.startsWith("- ")) {
        list.push(l.slice(2));
        continue;
      }
      flush();
      if (l.startsWith("### ") || l.startsWith("## ")) out.push(<h2 key={out.length} className="pt-4 text-xl font-bold">{l.replace(/^#{2,3} /, "")}</h2>);
      else if (l) out.push(<p key={out.length}><Inline text={l} /></p>);
    }
  }
  flush();

  return <div className={`max-w-3xl space-y-4 leading-relaxed ${className || "text-[#2b3a5c]"}`}>{out}</div>;
}
