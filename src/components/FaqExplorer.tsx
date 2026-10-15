"use client";

import { useEffect, useState } from "react";
import type { Faq } from "@/lib/content/schema";
import { FaqList, faqId } from "./FaqList";
import { track } from "./Analytics";

/**
 * FAQs page: live search across questions and answers, plus topic filters.
 * With no search and "All" selected, questions are grouped under their topics.
 */
export function FaqExplorer({ faqs, categories }: { faqs: Faq[]; categories: readonly string[] }) {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<string>("All");

  // Opening /faqs#some-question shows and opens that question.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    const el = id ? document.getElementById(id) : null;
    if (el instanceof HTMLDetailsElement) {
      el.open = true;
      el.scrollIntoView({ block: "start" });
    }
  }, []);

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = faqs.filter((f) => {
    if (topic !== "All" && f.category !== topic) return false;
    const text = `${f.q} ${f.a}`.toLowerCase();
    return terms.every((t) => text.includes(t));
  });

  // Report searches once the customer pauses typing.
  useEffect(() => {
    if (!terms.length) return;
    const t = setTimeout(() => track("faq_search", { term: query.trim().slice(0, 60), results: matches.length }), 1200);
    return () => clearTimeout(t);
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  const grouped = !terms.length && topic === "All";
  const chips = ["All", ...categories.filter((c) => faqs.some((f) => f.category === c))];

  return (
    <div>
      <div className="mx-auto max-w-2xl">
        <label htmlFor="faq-search" className="sr-only">Search the FAQs</label>
        <div className="relative">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            id="faq-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the FAQs…"
            autoComplete="off"
            className="h-14 w-full rounded-full border-2 border-line bg-white pl-12 pr-4 text-base text-navy shadow-sm placeholder:text-muted focus:border-navy focus:outline-none"
          />
        </div>
      </div>

      <div role="group" aria-label="Filter by topic" className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-2 md:mx-auto md:max-w-4xl md:flex-wrap md:justify-center md:overflow-visible md:px-0">
        {chips.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={topic === c}
            onClick={() => setTopic(c)}
            className={`min-h-11 flex-none whitespace-nowrap rounded-full px-4 text-sm font-semibold uppercase tracking-wide transition ${
              topic === c ? "bg-gold text-navy" : "border border-line bg-white text-navy hover:bg-mist"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <p className="sr-only" aria-live="polite">{`${matches.length} question${matches.length === 1 ? "" : "s"} found`}</p>

      <div className="mx-auto mt-8 max-w-3xl">
        {matches.length === 0 ? (
          <div className="rounded-2xl bg-mist p-6 text-center">
            <p className="font-semibold">No questions match “{query}”.</p>
            <p className="mt-1 text-sm text-muted">Try a different word, or message us and we&apos;ll help.</p>
            <button type="button" onClick={() => { setQuery(""); setTopic("All"); }} className="mt-4 min-h-11 rounded-xl border-2 border-navy px-4 font-semibold">
              Show all questions
            </button>
          </div>
        ) : grouped ? (
          <div className="flex flex-col gap-10">
            {chips.slice(1).map((c) => (
              <section key={c} aria-labelledby={`topic-${faqId(c)}`}>
                <h2 id={`topic-${faqId(c)}`} className="mb-2 text-xl font-extrabold md:text-2xl">{c}</h2>
                <FaqList faqs={faqs.filter((f) => f.category === c)} />
              </section>
            ))}
          </div>
        ) : (
          <FaqList faqs={matches} openFirst={terms.length > 0 && matches.length <= 3} />
        )}
      </div>
    </div>
  );
}
