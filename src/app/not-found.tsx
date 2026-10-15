import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-start justify-center gap-4 px-4">
      <h1 className="text-3xl font-extrabold">Page not found</h1>
      <p className="text-muted">This page may have moved when we updated our website.</p>
      <div className="flex flex-wrap gap-2">
        <Link href="/" className="flex min-h-12 items-center rounded-xl bg-navy px-5 font-semibold text-white">Go to the homepage</Link>
        <Link href="/rates" className="flex min-h-12 items-center rounded-xl border-2 border-navy px-5 font-semibold">See rates</Link>
      </div>
    </main>
  );
}
