/** The full USA Air table, freight only: four side-by-side tables on computers, two on phones. */
export function AirRateTables({ airRates }: { airRates: number[] }) {
  const row = (i: number) => (
    <tr key={i} className={i % 2 ? "bg-white" : "bg-[#f7f8fb]"}>
      <th scope="row" className="px-3 py-1.5 text-left font-medium">{i === 0 ? "0.1–0.5" : i}</th>
      <td className="px-3 py-1.5 text-right font-semibold tabular-nums">{airRates[i].toLocaleString("en-US")}</td>
    </tr>
  );
  const head = (
    <thead>
      <tr className="bg-navy text-xs text-white">
        <th scope="col" className="px-3 py-2 text-left">lb</th>
        <th scope="col" className="px-3 py-2 text-right">J$</th>
      </tr>
    </thead>
  );
  // 51 rates (0.1–0.5 lb, then 1–50 lb) plus a "51+" row = 52 rows: four columns of 13.
  const columns = [0, 13, 26, 39].map((start) => Array.from({ length: 13 }, (_, i) => start + i).filter((i) => i <= 50));

  return (
    <div className="mt-6 grid grid-cols-2 items-start gap-3 text-navy lg:grid-cols-4 lg:gap-4">
      {columns.map((rows, h) => (
        <table key={h} className="w-full overflow-hidden rounded-xl text-sm">
          <caption className="sr-only">{`Air freight, ${rows[0] === 0 ? "0.1" : rows[0]} to ${rows[rows.length - 1]} lb${h === 3 ? " and over" : ""}`}</caption>
          {head}
          <tbody>
            {rows.map(row)}
            {h === 3 ? (
              <tr className="bg-gold-soft">
                <th scope="row" className="px-3 py-1.5 text-left font-medium">51+</th>
                <td className="px-3 py-1.5 text-right font-semibold">Call us</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      ))}
    </div>
  );
}
