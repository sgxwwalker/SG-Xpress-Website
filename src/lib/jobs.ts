// A job is taking applications when staff have it switched on and its apply-by date
// (if any) hasn't passed in Jamaica. The last day counts: it closes at midnight.

/** Today's date in Jamaica as YYYY-MM-DD. */
export function jamaicaToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Jamaica", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function isJobOpen(job: { open: boolean; closingDate: string }, today = jamaicaToday()): boolean {
  return job.open && (!job.closingDate || job.closingDate >= today);
}
