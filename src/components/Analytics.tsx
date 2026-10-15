"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/** Sends a GA4 event. Safe to call when analytics is off. */
export function track(event: string, params: Record<string, string | number> = {}): void {
  window.gtag?.("event", event, params);
}

/**
 * One listener for the whole site: any link or button with data-track="event_name"
 * (and optional data-track-location) reports a GA4 event when clicked.
 */
export function Analytics() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const el = (e.target as Element | null)?.closest<HTMLElement>("[data-track]");
      if (!el) return;
      track(el.dataset.track!, {
        location: el.dataset.trackLocation ?? "",
        page: window.location.pathname,
      });
    }
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}
