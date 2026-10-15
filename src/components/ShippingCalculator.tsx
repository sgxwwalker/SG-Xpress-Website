"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import {
  jmd,
  quoteAir,
  quoteOcean,
  usd,
  type OceanRule,
  type ProcessingFees,
  type ServiceChargeRule,
} from "@/lib/rates";
import { track } from "./Analytics";

type Mode = "air" | "ocean";

const DISCLAIMER = "This is an estimate based on the information entered. Final charges are confirmed after shipment assessment.";

// Opening /calculator#ocean shows the Ocean tab first.
function subscribeHash(cb: () => void) {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt>{label}</dt>
      <dd className="whitespace-nowrap text-right font-semibold">{value}</dd>
    </div>
  );
}

/**
 * Air and Ocean estimate with an itemised breakdown (freight, processing fee,
 * SG Xpress Service Charge, total). All maths comes from src/lib/rates.ts.
 */
export function ShippingCalculator({
  airRates,
  fees,
  serviceCharge,
  ocean,
  whatsappHref,
  id = "calc",
}: {
  airRates: number[];
  fees: ProcessingFees;
  serviceCharge: ServiceChargeRule;
  ocean: OceanRule;
  whatsappHref: string;
  id?: string;
}) {
  const hash = useSyncExternalStore(subscribeHash, () => window.location.hash, () => "");
  const [chosen, setChosen] = useState<Mode | null>(null);
  const mode: Mode = chosen ?? (hash === "#ocean" ? "ocean" : "air");

  const [weight, setWeight] = useState("2.3");
  const [airValue, setAirValue] = useState("");
  const [cuft, setCuft] = useState("3");
  const [oceanWeight, setOceanWeight] = useState("");
  const [oceanValue, setOceanValue] = useState("");
  const reported = useRef<Set<Mode>>(new Set());

  function used(m: Mode) {
    if (!reported.current.has(m)) {
      reported.current.add(m);
      track("estimate_used", { page: window.location.pathname, mode: m });
    }
  }

  const lb = parseFloat(weight);
  const air = quoteAir(lb, parseFloat(airValue) || 0, airRates, fees, serviceCharge);
  const volume = parseFloat(cuft);
  const sea = quoteOcean(volume, parseFloat(oceanWeight), parseFloat(oceanValue) || 0, ocean, serviceCharge);
  const needsWeight = volume > 0 && volume < ocean.smallUnderCubicFeet;

  function setAirWeight(next: string) {
    setWeight(next);
    used("air");
  }
  function step(delta: number) {
    const cur = lb > 0 ? lb : 0;
    setAirWeight(String(Math.max(0.5, Math.round((cur + delta) * 10) / 10)));
  }

  let airNote = "Enter a weight to see your estimate.";
  if (air) {
    if (air.billed === 0.5) airNote = "Charged at the 0.1–0.5 lb rate.";
    else if (air.billed === lb) airNote = `Charged as ${air.billed} lb.`;
    else airNote = `${lb} lb rounds up to ${air.billed} lb.`;
  }
  let seaNote = "Enter the volume to see your estimate.";
  if (sea && !sea.small) seaNote = sea.billedCuft === volume ? `Charged as ${sea.billedCuft} cu ft.` : `${volume} cu ft is charged as ${sea.billedCuft} cu ft.`;
  if (needsWeight) seaNote = `Under ${ocean.smallUnderCubicFeet} cu ft is charged by weight at ${jmd(ocean.smallPerLb)} per lb.`;

  const label = "text-sm font-semibold";
  const field = "h-12 w-full min-w-0 rounded-xl border-2 border-line px-4 text-lg font-semibold text-navy focus:border-navy focus:outline-none";
  const tab = (m: Mode, text: string) => (
    <button
      type="button"
      role="tab"
      id={`${id}-tab-${m}`}
      aria-selected={mode === m}
      aria-controls={`${id}-panel`}
      onClick={() => setChosen(m)}
      className={`h-11 rounded-lg text-sm font-semibold transition ${mode === m ? "bg-navy text-white" : "text-navy hover:bg-white"}`}
    >
      {text}
    </button>
  );

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-navy bg-white">
      <div className="p-4 pb-0 md:p-5 md:pb-0">
        <div role="tablist" aria-label="Shipping method" className="grid grid-cols-2 gap-1 rounded-xl bg-mist p-1">
          {tab("air", "USA Air")}
          {tab("ocean", "USA Ocean")}
        </div>
      </div>

      <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${mode}`}>
        {mode === "air" ? (
          <>
            <div className="flex flex-col gap-4 p-4 md:p-5">
              <div>
                <label htmlFor={`${id}-weight`} className={label}>Package weight (lb)</label>
                <div className="mt-2 flex items-center gap-2">
                  <button type="button" onClick={() => step(-1)} aria-label="Decrease weight by 1 lb" className="h-14 w-14 flex-none rounded-xl border border-line bg-mist text-2xl font-bold">−</button>
                  <input
                    id={`${id}-weight`}
                    type="number"
                    inputMode="decimal"
                    min="0.1"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setAirWeight(e.target.value)}
                    className="h-14 w-full min-w-0 rounded-xl border-2 border-line text-center text-2xl font-extrabold text-navy focus:border-navy focus:outline-none"
                  />
                  <button type="button" onClick={() => step(1)} aria-label="Increase weight by 1 lb" className="h-14 w-14 flex-none rounded-xl border border-line bg-mist text-2xl font-bold">+</button>
                </div>
                <p className="mt-2 text-sm text-muted" aria-live="polite">{airNote}</p>
              </div>
              <div>
                <label htmlFor={`${id}-air-value`} className={label}>Item value (US$)</label>
                <input id={`${id}-air-value`} type="number" inputMode="decimal" min="0" step="0.01" placeholder="e.g. 45" value={airValue} onChange={(e) => { setAirValue(e.target.value); used("air"); }} className={`${field} mt-2`} />
              </div>
            </div>

            {air && air.total !== null ? (
              <dl className="space-y-2.5 bg-mist p-4 md:p-5" aria-live="polite">
                <Row label="Air freight" value={jmd(air.freight!)} />
                <Row label="Processing fee" value={jmd(air.fee)} />
                <Row label="SG Xpress Service Charge" value={jmd(air.serviceCharge)} />
                <div className="flex items-baseline justify-between border-t border-line pt-3">
                  <dt className="text-lg font-semibold">Estimated total</dt>
                  <dd className="text-2xl font-extrabold">{jmd(air.total)}</dd>
                </div>
              </dl>
            ) : null}

            {air && air.total === null ? (
              <div className="space-y-3 bg-gold-soft p-4 md:p-5">
                <p><strong>Over 50 lb?</strong> We price these one by one. The processing fee is {jmd(air.fee)}.</p>
                <a href={whatsappHref} data-track="whatsapp_click" data-track-location="calculator" className="flex min-h-12 items-center justify-center rounded-xl bg-navy font-semibold text-white">
                  Get a price on WhatsApp
                </a>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <div className="flex flex-col gap-4 p-4 md:p-5">
              <div>
                <label htmlFor={`${id}-cuft`} className={label}>Volume (cubic feet)</label>
                <input id={`${id}-cuft`} type="number" inputMode="decimal" min="0.1" step="0.1" value={cuft} onChange={(e) => { setCuft(e.target.value); used("ocean"); }} className={`${field} mt-2`} />
                <p className="mt-2 text-sm text-muted" aria-live="polite">{seaNote}</p>
                <p className="mt-1 text-xs text-muted">Cubic feet = length × width × height in inches ÷ 1,728.</p>
              </div>
              {needsWeight ? (
                <div>
                  <label htmlFor={`${id}-ocean-weight`} className={label}>Package weight (lb)</label>
                  <input id={`${id}-ocean-weight`} type="number" inputMode="decimal" min="0.1" step="0.1" placeholder="e.g. 4" value={oceanWeight} onChange={(e) => setOceanWeight(e.target.value)} className={`${field} mt-2`} />
                </div>
              ) : null}
              <div>
                <label htmlFor={`${id}-ocean-value`} className={label}>Item value (US$)</label>
                <input id={`${id}-ocean-value`} type="number" inputMode="decimal" min="0" step="0.01" placeholder="e.g. 250" value={oceanValue} onChange={(e) => { setOceanValue(e.target.value); used("ocean"); }} className={`${field} mt-2`} />
              </div>
            </div>

            {sea ? (
              <dl className="space-y-2.5 bg-mist p-4 md:p-5" aria-live="polite">
                <Row label="Ocean freight" value={sea.small ? jmd(sea.freight) : `${usd(sea.freightUsd!)} (${jmd(sea.freight)})`} />
                <Row label="Processing fee" value="None" />
                <Row label="SG Xpress Service Charge" value={jmd(sea.serviceCharge)} />
                <div className="flex items-baseline justify-between border-t border-line pt-3">
                  <dt className="text-lg font-semibold">Estimated total</dt>
                  <dd className="text-2xl font-extrabold">{jmd(sea.total)}</dd>
                </div>
              </dl>
            ) : null}
          </>
        )}
      </div>

      <p className="border-t border-line px-4 py-3 text-xs text-muted md:px-5">{DISCLAIMER}</p>
    </div>
  );
}
