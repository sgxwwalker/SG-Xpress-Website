import type { SiteContent } from "@/lib/content/schema";
import { IconInfo } from "./Icons";

type Content = Pick<SiteContent, "usaAir" | "warehouseHours">;

/** USA air schedule: a table on larger screens, one card per flight on phones. */
export function AirSchedule({ content }: { content: Content }) {
  const rows = content.usaAir.schedule;
  const cols = [
    ["cutoff", "Warehouse cutoff"],
    ["flight", "Flight day"],
    ["clearance", "Expected Customs clearance"],
    ["collection", "Expected collection day"],
  ] as const;

  return (
    <div className="flex flex-col gap-4">
      <div className="hidden overflow-hidden rounded-2xl border border-line bg-white md:block">
        <table className="w-full text-left">
          <thead className="bg-navy text-sm text-white">
            <tr>
              <th scope="col" className="px-4 py-3">Shipment</th>
              {cols.map(([, label]) => <th key={label} scope="col" className="px-4 py-3">{label}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.name}>
                <th scope="row" className="px-4 py-3 font-bold">{r.name}</th>
                <td className="px-4 py-3">{r.cutoff}</td>
                <td className="px-4 py-3 font-semibold">{r.flight}</td>
                <td className="px-4 py-3">{r.clearance}</td>
                <td className="px-4 py-3 font-semibold">{r.collection}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="grid gap-3 md:hidden">
        {rows.map((r) => (
          <li key={r.name} className="rounded-2xl border border-line bg-white p-4">
            <h3 className="font-bold">{r.name}</h3>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
              {cols.map(([key, label]) => (
                <div key={key}>
                  <dt className="text-muted">{label}</dt>
                  <dd className="font-semibold">{r[key]}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>

      <p className="text-sm text-muted">
        Packages must be received and processed before the applicable cutoff to be eligible for that shipment. Flight, clearance and collection dates are
        estimates and may change due to airline schedules, weather, Customs inspections or processing delays.
      </p>
      <p className="flex gap-2 rounded-xl bg-gold-soft px-4 py-3 text-sm font-medium">
        <IconInfo className="mt-0.5 h-4 w-4 flex-none" />
        Always wait for your “Ready for Pickup” notification before visiting your branch.
      </p>
    </div>
  );
}

const isClosed = (hours: string) => hours.trim().toLowerCase() === "closed";

export function WarehouseHours({ content }: { content: Content }) {
  return (
    <div className="flex flex-col gap-4">
      <p>Our Florida warehouse accepts deliveries during these hours, Florida local time.</p>
      {/* Days across the top on larger screens */}
      <div className="hidden overflow-hidden rounded-2xl border border-line md:block">
        <table className="w-full table-fixed text-left">
          <caption className="sr-only">Florida warehouse operating hours</caption>
          <thead className="bg-mist">
            <tr>
              {content.warehouseHours.map((h) => (
                <th key={h.days} scope="col" className="px-4 py-3 font-semibold">{h.days}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {content.warehouseHours.map((h) => (
                <td key={h.days} className={`px-4 py-3 text-sm ${isClosed(h.hours) ? "text-muted" : "font-semibold"}`}>{h.hours}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      {/* One row per day on phones */}
      <table className="w-full md:hidden">
        <caption className="sr-only">Florida warehouse operating hours</caption>
        <tbody className="divide-y divide-line border-y border-line">
          {content.warehouseHours.map((h) => (
            <tr key={h.days}>
              <th scope="row" className="py-3 text-left font-medium">{h.days}</th>
              <td className={`py-3 text-right ${isClosed(h.hours) ? "text-muted" : "font-semibold"}`}>{h.hours}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-sm text-muted">
        Warehouse receiving hours are separate from shipment cutoff times. A package room is available for deliveries outside receiving hours; however,
        packages left there are at your own risk.
      </p>
    </div>
  );
}
