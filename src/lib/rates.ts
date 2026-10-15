// Pure pricing helpers shared by the homepage and Rates page calculators and the rate
// table, so they always agree. No server imports: used in client components.
// Import duty is deliberately never calculated.

export const MAX_PRICED_LB = 50;

export interface ProcessingFees {
  under10: number; // packages under 10 lb
  from10: number; // packages 10 lb and over
}

export interface ServiceChargeRule {
  percent: number; // USA Air, e.g. 35
  oceanPercent: number; // USA Ocean, e.g. 20
  thresholdUsd: number; // charged only when the item value is OVER this
  jmdPerUsd: number; // exchange rate used for the charge and for US$ freight
}

export interface OceanRule {
  perCubicFootUsd: number;
  smallPerLb: number; // J$ per lb
  smallUnderCubicFeet: number;
}

/** 0.1–0.5 lb bills at the half-pound rate; anything heavier rounds up to the next whole pound. */
export function billedWeight(lb: number): number {
  if (!(lb > 0)) return 0;
  return lb <= 0.5 ? 0.5 : Math.ceil(Number(lb.toFixed(4)));
}

/** Index into airRates: 0 is the 0.1–0.5 lb rate, n is the n lb rate. */
export function rateIndex(billed: number): number {
  return billed === 0.5 ? 0 : billed;
}

export function processingFee(billed: number, fees: ProcessingFees): number {
  return billed < 10 ? fees.under10 : fees.from10;
}

/**
 * SG Xpress Service Charge in J$: a percentage of the FULL item value (air and ocean each
 * have their own), only when the value is over the threshold.
 */
export function serviceChargeJmd(valueUsd: number, rule: ServiceChargeRule, mode: "air" | "ocean" = "air"): number {
  if (!(valueUsd > rule.thresholdUsd)) return 0;
  const percent = mode === "ocean" ? rule.oceanPercent : rule.percent;
  return Math.round(valueUsd * (percent / 100) * rule.jmdPerUsd);
}

export interface AirQuote {
  billed: number;
  freight: number | null; // J$; null when over 50 lb ("call us")
  fee: number; // J$
  serviceCharge: number; // J$
  total: number | null; // J$
}

export function quoteAir(lb: number, valueUsd: number, airRates: number[], fees: ProcessingFees, rule: ServiceChargeRule): AirQuote | null {
  const billed = billedWeight(lb);
  if (!billed) return null;
  const fee = processingFee(billed, fees);
  const serviceCharge = serviceChargeJmd(valueUsd, rule);
  if (billed > MAX_PRICED_LB) return { billed, freight: null, fee, serviceCharge, total: null };
  const freight = airRates[rateIndex(billed)];
  return { billed, freight, fee, serviceCharge, total: freight + fee + serviceCharge };
}

export interface OceanQuote {
  small: boolean; // under the cubic-foot limit, so priced by weight
  billedCuft: number; // whole cubic feet charged (when !small)
  billedLb: number; // whole pounds charged (when small)
  freightUsd: number | null; // US$ freight before conversion (when !small)
  freight: number; // J$
  serviceCharge: number; // J$
  total: number; // J$ (ocean has no processing fee)
}

/** Ocean: whole cubic feet × US$ rate converted to J$; under the limit, J$ per lb on whole pounds. */
export function quoteOcean(cuft: number, weightLb: number, valueUsd: number, ocean: OceanRule, rule: ServiceChargeRule): OceanQuote | null {
  if (!(cuft > 0)) return null;
  const serviceCharge = serviceChargeJmd(valueUsd, rule, "ocean");
  if (cuft < ocean.smallUnderCubicFeet) {
    if (!(weightLb > 0)) return null;
    const billedLb = Math.max(1, Math.ceil(Number(weightLb.toFixed(4))));
    const freight = billedLb * ocean.smallPerLb;
    return { small: true, billedCuft: 0, billedLb, freightUsd: null, freight, serviceCharge, total: freight + serviceCharge };
  }
  const billedCuft = Math.ceil(Number(cuft.toFixed(4)));
  const freightUsd = billedCuft * ocean.perCubicFootUsd;
  const freight = Math.round(freightUsd * rule.jmdPerUsd);
  return { small: false, billedCuft, billedLb: 0, freightUsd, freight, serviceCharge, total: freight + serviceCharge };
}

export function jmd(n: number): string {
  return `J$${n.toLocaleString("en-US")}`;
}

export function usd(n: number): string {
  return `US$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

/** "Tue, Thu & Sun" from the schedule's flight days. */
export function flightDays(schedule: { flight: string }[]): string {
  const days = schedule.map((s) => s.flight.trim().slice(0, 3));
  return days.length > 1 ? `${days.slice(0, -1).join(", ")} & ${days[days.length - 1]}` : days.join("");
}
