import type { SiteContent } from "@/lib/content/schema";
import { telHref } from "@/lib/site";
import { IconPhone, IconPin } from "./Icons";

export function BranchCards({ content }: { content: SiteContent }) {
  const { hours } = content;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {content.branches.map((b) => (
        <article key={b.name} className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5">
          <h3 className="text-xl font-bold">{b.name}</h3>
          <p>{b.address}</p>
          <p className="text-sm text-muted">
            {hours.weekdays}
            <br />
            {hours.saturday} · {hours.sunday}
          </p>
          <div className="mt-auto grid grid-cols-2 gap-2">
            <a href={b.mapsUrl} data-track="directions_click" data-track-location={b.name} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-navy text-sm font-semibold text-white">
              <IconPin className="h-4 w-4" /> Directions
            </a>
            <a href={telHref(b.phone)} data-track="call_click" data-track-location={b.name} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-navy text-sm font-semibold">
              <IconPhone className="h-4 w-4" /> Call
            </a>
          </div>
        </article>
      ))}
    </div>
  );
}
