// Renders the small markdown subset used in the legal pages: "### " headings,
// "- " bullet lists, **bold** and paragraphs. No HTML is ever injected.

function inline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : part,
  );
}

export function Prose({ markdown }: { markdown: string }) {
  const blocks = markdown.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const out: React.ReactNode[] = [];
  let list: string[] = [];

  const flush = () => {
    if (list.length) {
      out.push(
        <ul key={`ul-${out.length}`} className="list-disc space-y-1 pl-5">
          {list.map((li, i) => <li key={i}>{inline(li)}</li>)}
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
      if (l.startsWith("### ")) out.push(<h2 key={out.length} className="pt-4 text-xl font-bold">{l.slice(4)}</h2>);
      else if (l) out.push(<p key={out.length}>{inline(l)}</p>);
    }
  }
  flush();

  return <div className="max-w-3xl space-y-4 leading-relaxed text-[#2b3a5c]">{out}</div>;
}
